package routes

import (
	"errors"
	"sort"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"schej.it/server/models"
)

var errActiveSlotOutsideEnabled = errors.New("active-slots-must-be-enabled")
var errIncompleteTimedEventContract = errors.New("incomplete-timed-event-contract")

type timedEventPayloadFields struct {
	EnabledSlots    []primitive.DateTime    `json:"enabledSlots"`
	ActiveSlots     []primitive.DateTime    `json:"activeSlots"`
	EventTimezone   *string                 `json:"eventTimezone"`
	SlotGeneration  *models.SlotGeneration  `json:"slotGeneration"`
	TimedRecurrence *models.TimedRecurrence `json:"timedRecurrence"`
}

func normalizeDateTimes(values []primitive.DateTime) []primitive.DateTime {
	if len(values) == 0 {
		return []primitive.DateTime{}
	}

	seen := make(map[int64]struct{}, len(values))
	normalized := make([]primitive.DateTime, 0, len(values))
	for _, value := range values {
		ms := int64(value)
		if _, exists := seen[ms]; exists {
			continue
		}
		seen[ms] = struct{}{}
		normalized = append(normalized, value)
	}

	sort.Slice(normalized, func(i, j int) bool {
		return normalized[i].Time().Before(normalized[j].Time())
	})

	return normalized
}

func normalizeTimedEventPayloadFields(
	fields timedEventPayloadFields,
) (timedEventPayloadFields, error) {
	if fields.EnabledSlots == nil || fields.ActiveSlots == nil ||
		fields.EventTimezone == nil || fields.SlotGeneration == nil ||
		fields.TimedRecurrence == nil {
		return timedEventPayloadFields{}, errIncompleteTimedEventContract
	}
	if *fields.EventTimezone == "" || fields.SlotGeneration.TimeIncrementMinutes <= 0 ||
		fields.SlotGeneration.StartTimeLocal == "" || fields.SlotGeneration.EndTimeLocal == "" ||
		(fields.TimedRecurrence.Kind != "specific_dates" && fields.TimedRecurrence.Kind != "weekly") ||
		fields.TimedRecurrence.StartOnMonday == nil {
		return timedEventPayloadFields{}, errIncompleteTimedEventContract
	}

	enabledSlots := normalizeDateTimes(fields.EnabledSlots)
	activeSlots := normalizeDateTimes(fields.ActiveSlots)

	enabledLookup := make(map[int64]struct{}, len(enabledSlots))
	for _, slot := range enabledSlots {
		enabledLookup[int64(slot)] = struct{}{}
	}
	for _, slot := range activeSlots {
		if _, exists := enabledLookup[int64(slot)]; !exists {
			return timedEventPayloadFields{}, errActiveSlotOutsideEnabled
		}
	}

	fields.EnabledSlots = enabledSlots
	fields.ActiveSlots = activeSlots

	return fields, nil
}
