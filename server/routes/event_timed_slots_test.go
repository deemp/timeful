package routes

import (
	"testing"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"timeful/server/models"
)

func completeTimedFields(t *testing.T) timedEventPayloadFields {
	t.Helper()
	timezone := "UTC"
	startOnMonday := true
	return timedEventPayloadFields{
		EventTimezone: &timezone,
		SlotGeneration: &models.SlotGeneration{
			StartTimeLocal: "09:00", EndTimeLocal: "10:00", TimeIncrementMinutes: 15,
		},
		TimedRecurrence: &models.TimedRecurrence{
			Kind: "specific_dates", StartOnMonday: &startOnMonday,
		},
	}
}

func TestNormalizeTimedEventPayloadFieldsPreservesExplicitEmptyActiveSlots(t *testing.T) {
	fields := completeTimedFields(t)
	fields.EnabledSlots = []primitive.DateTime{
		timedSlotDateTime(t, "2026-01-05T09:00:00Z"),
		timedSlotDateTime(t, "2026-01-05T09:15:00Z"),
	}
	fields.ActiveSlots = []primitive.DateTime{}
	fields, err := normalizeTimedEventPayloadFields(fields)
	if err != nil {
		t.Fatalf("normalize timed payload: %v", err)
	}

	assertPrimitiveDateTimesEqual(t, fields.EnabledSlots, []primitive.DateTime{
		timedSlotDateTime(t, "2026-01-05T09:00:00Z"),
		timedSlotDateTime(t, "2026-01-05T09:15:00Z"),
	})
	assertPrimitiveDateTimesEqual(t, fields.ActiveSlots, []primitive.DateTime{})
}

func TestNormalizeTimedEventPayloadFieldsRejectsMissingActiveSlots(t *testing.T) {
	fields := completeTimedFields(t)
	fields.EnabledSlots = []primitive.DateTime{timedSlotDateTime(t, "2026-01-05T09:00:00Z")}
	if _, err := normalizeTimedEventPayloadFields(fields); err == nil {
		t.Fatal("expected incomplete timed contract error")
	}
}
