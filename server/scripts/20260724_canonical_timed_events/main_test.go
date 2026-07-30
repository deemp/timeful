package main

import (
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"schej.it/server/models"
)

func migrationDateTime(t *testing.T, value string) primitive.DateTime {
	t.Helper()
	instant, err := time.Parse(time.RFC3339, value)
	if err != nil {
		t.Fatal(err)
	}
	return primitive.NewDateTimeFromTime(instant)
}

func TestCanonicalSlotsBuildsLegacyDomainAndDefaultsMissingActiveSlots(t *testing.T) {
	duration := float32(1)
	increment := 30
	event := models.Event{
		Dates:         []primitive.DateTime{migrationDateTime(t, "2026-01-05T09:00:00Z")},
		Duration:      &duration,
		TimeIncrement: &increment,
	}

	enabled, active, err := canonicalSlots(event)
	if err != nil {
		t.Fatal(err)
	}
	if len(enabled) != 2 || enabled[0] != migrationDateTime(t, "2026-01-05T09:00:00Z") || enabled[1] != migrationDateTime(t, "2026-01-05T09:30:00Z") {
		t.Fatalf("unexpected enabled slots: %#v", enabled)
	}
	if len(active) != len(enabled) || active[0] != enabled[0] || active[1] != enabled[1] {
		t.Fatalf("expected active slots to default to enabled slots, got %#v", active)
	}
}

func TestCanonicalSlotsPrefersLegacySpecificTimes(t *testing.T) {
	event := models.Event{
		EnabledSlots: []primitive.DateTime{
			migrationDateTime(t, "2026-01-05T09:00:00Z"),
			migrationDateTime(t, "2026-01-05T09:30:00Z"),
		},
		Times: []primitive.DateTime{migrationDateTime(t, "2026-01-05T09:30:00Z")},
	}

	_, active, err := canonicalSlots(event)
	if err != nil {
		t.Fatal(err)
	}
	if len(active) != 1 || active[0] != migrationDateTime(t, "2026-01-05T09:30:00Z") {
		t.Fatalf("expected legacy times to become active slots, got %#v", active)
	}
}
