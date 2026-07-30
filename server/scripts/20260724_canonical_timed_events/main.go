package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"sort"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"schej.it/server/db"
	"schej.it/server/models"
)

const batchSize = int32(500)

func normalize(values []primitive.DateTime) []primitive.DateTime {
	seen := make(map[primitive.DateTime]struct{}, len(values))
	result := make([]primitive.DateTime, 0, len(values))
	for _, value := range values {
		if _, exists := seen[value]; exists {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	sort.Slice(result, func(i, j int) bool { return result[i] < result[j] })
	return result
}

func buildLegacySlots(event models.Event) []primitive.DateTime {
	if event.Duration == nil || len(event.Dates) == 0 {
		return nil
	}
	increment := 15
	if event.TimeIncrement != nil && *event.TimeIncrement > 0 {
		increment = *event.TimeIncrement
	}
	duration := time.Duration(float64(*event.Duration) * float64(time.Hour))
	if duration <= 0 {
		return nil
	}
	var slots []primitive.DateTime
	for _, date := range event.Dates {
		for current, end := date.Time().UTC(), date.Time().UTC().Add(duration); current.Before(end); current = current.Add(time.Duration(increment) * time.Minute) {
			slots = append(slots, primitive.NewDateTimeFromTime(current))
		}
	}
	return normalize(slots)
}

func canonicalSlots(event models.Event) ([]primitive.DateTime, []primitive.DateTime, error) {
	enabled := normalize(event.EnabledSlots)
	if event.EnabledSlots == nil {
		enabled = buildLegacySlots(event)
	}
	if enabled == nil {
		return nil, nil, fmt.Errorf("missing enabled slot domain")
	}
	active := normalize(event.ActiveSlots)
	if event.ActiveSlots == nil {
		if event.Times != nil {
			active = normalize(event.Times)
		} else {
			active = enabled
		}
	}
	enabledSet := make(map[primitive.DateTime]struct{}, len(enabled))
	for _, slot := range enabled {
		enabledSet[slot] = struct{}{}
	}
	for _, slot := range active {
		if _, exists := enabledSet[slot]; !exists {
			return nil, nil, fmt.Errorf("active slot outside enabled domain")
		}
	}
	return enabled, active, nil
}

func validateTimedMetadata(event models.Event) error {
	if event.EventTimezone == nil || *event.EventTimezone == "" || event.SlotGeneration == nil || event.TimedRecurrence == nil {
		return fmt.Errorf("missing timed metadata")
	}
	if event.SlotGeneration.StartTimeLocal == "" || event.SlotGeneration.EndTimeLocal == "" || event.SlotGeneration.TimeIncrementMinutes <= 0 {
		return fmt.Errorf("invalid slot generation")
	}
	if event.TimedRecurrence.StartOnMonday == nil || (event.TimedRecurrence.Kind != "specific_dates" && event.TimedRecurrence.Kind != "weekly") {
		return fmt.Errorf("invalid timed recurrence")
	}
	return nil
}

func preflight(ctx context.Context) int {
	var lastID primitive.ObjectID
	invalid := 0
	for {
		filter := bson.M{"daysOnly": bson.M{"$ne": true}}
		if lastID != primitive.NilObjectID {
			filter["_id"] = bson.M{"$gt": lastID}
		}
		cursor, err := db.EventsCollection.Find(ctx, filter, options.Find().SetSort(bson.D{{Key: "_id", Value: 1}}).SetLimit(int64(batchSize)))
		if err != nil {
			log.Fatal(err)
		}
		count := 0
		for cursor.Next(ctx) {
			count++
			var event models.Event
			if err := cursor.Decode(&event); err != nil {
				log.Printf("cannot decode event: %v", err)
				invalid++
				continue
			}
			lastID = event.Id
			if event.ScheduleVersion == 1 {
				continue
			}
			if err := validateTimedMetadata(event); err != nil {
				log.Printf("event %s cannot be migrated: %v", event.Id.Hex(), err)
				invalid++
				continue
			}
			if _, _, err := canonicalSlots(event); err != nil {
				log.Printf("event %s cannot be migrated: %v", event.Id.Hex(), err)
				invalid++
			}
		}
		if err := cursor.Err(); err != nil {
			log.Fatal(err)
		}
		if count < int(batchSize) {
			return invalid
		}
	}
}

func main() {
	disconnect := db.Init()
	defer disconnect()

	ctx := context.Background()
	invalid := preflight(ctx)
	if invalid > 0 {
		fmt.Printf("canonical timed-event migration blocked: invalid=%d\n", invalid)
		os.Exit(1)
	}
	if len(os.Args) != 2 || os.Args[1] != "--apply" {
		fmt.Println("canonical timed-event migration preflight passed; rerun with --apply to write changes")
		return
	}
	var lastID primitive.ObjectID
	var migrated, skipped int
	for {
		filter := bson.M{"daysOnly": bson.M{"$ne": true}}
		if lastID != primitive.NilObjectID {
			filter["_id"] = bson.M{"$gt": lastID}
		}
		cursor, err := db.EventsCollection.Find(ctx, filter, options.Find().SetSort(bson.D{{Key: "_id", Value: 1}}).SetLimit(int64(batchSize)))
		if err != nil {
			log.Fatal(err)
		}

		var writes []mongo.WriteModel
		count := 0
		for cursor.Next(ctx) {
			count++
			var event models.Event
			if err := cursor.Decode(&event); err != nil {
				log.Fatal(err)
			}
			lastID = event.Id
			if event.ScheduleVersion == 1 {
				skipped++
				continue
			}
			if err := validateTimedMetadata(event); err != nil {
				log.Fatalf("event %s failed validation after preflight: %v", event.Id.Hex(), err)
			}
			enabled, active, err := canonicalSlots(event)
			if err != nil {
				log.Fatalf("event %s failed slot conversion after preflight: %v", event.Id.Hex(), err)
			}
			writes = append(writes, mongo.NewUpdateOneModel().SetFilter(bson.M{"_id": event.Id}).SetUpdate(bson.M{
				"$set":   bson.M{"enabledSlots": enabled, "activeSlots": active, "scheduleVersion": 1},
				"$unset": bson.M{"duration": "", "dates": "", "timeIncrement": "", "hasSpecificTimes": "", "times": "", "startOnMonday": ""},
			}))
		}
		if err := cursor.Err(); err != nil {
			log.Fatal(err)
		}
		if len(writes) > 0 {
			result, err := db.EventsCollection.BulkWrite(ctx, writes)
			if err != nil {
				log.Fatal(err)
			}
			migrated += int(result.ModifiedCount)
		}
		if count < int(batchSize) {
			break
		}
	}
	fmt.Printf("canonical timed-event migration complete: migrated=%d skipped=%d\n", migrated, skipped)
}
