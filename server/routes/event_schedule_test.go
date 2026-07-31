package routes

import (
	"net/http"
	"testing"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"timeful/server/models"
)

func TestPublicTimefulScheduleCanBeSavedReplacedAndCleared(t *testing.T) {
	initRoutesReadFiltersTestDB(t)
	router := newEventsReadFiltersTestRouter()
	event := models.Event{
		Id:   primitive.NewObjectID(),
		Name: "Public planning",
		Type: models.SPECIFIC_DATES,
	}
	seedEventReadFiltersTestData(t, event, nil, nil)

	firstPayload := map[string]any{
		"startDate": "2026-08-01T09:00:00Z",
		"endDate":   "2026-08-01T10:00:00Z",
	}
	firstRecorder := timedEventRequest(
		t, router, http.MethodPut, "/api/events/"+event.Id.Hex()+"/schedule", firstPayload,
	)
	if firstRecorder.Code != http.StatusOK {
		t.Fatalf("expected save status 200, got %d: %s", firstRecorder.Code, firstRecorder.Body.String())
	}

	saved := loadEventByID(t, event.Id.Hex()).ScheduledEvent
	if saved == nil || saved.Summary != event.Name || saved.StartDate != timedSlotDateTime(t, "2026-08-01T09:00:00Z") || saved.EndDate != timedSlotDateTime(t, "2026-08-01T10:00:00Z") {
		t.Fatalf("expected saved Timeful schedule, got %#v", saved)
	}

	replacementPayload := map[string]any{
		"startDate": "2026-08-01T11:00:00Z",
		"endDate":   "2026-08-01T12:30:00Z",
	}
	replacementRecorder := timedEventRequest(
		t, router, http.MethodPut, "/api/events/"+event.Id.Hex()+"/schedule", replacementPayload,
	)
	if replacementRecorder.Code != http.StatusOK {
		t.Fatalf("expected replacement status 200, got %d: %s", replacementRecorder.Code, replacementRecorder.Body.String())
	}

	replaced := loadEventByID(t, event.Id.Hex()).ScheduledEvent
	if replaced == nil || replaced.StartDate != timedSlotDateTime(t, "2026-08-01T11:00:00Z") || replaced.EndDate != timedSlotDateTime(t, "2026-08-01T12:30:00Z") {
		t.Fatalf("expected replacement Timeful schedule, got %#v", replaced)
	}

	clearRecorder := timedEventRequest(
		t, router, http.MethodDelete, "/api/events/"+event.Id.Hex()+"/schedule", map[string]any{},
	)
	if clearRecorder.Code != http.StatusOK {
		t.Fatalf("expected clear status 200, got %d: %s", clearRecorder.Code, clearRecorder.Body.String())
	}
	if cleared := loadEventByID(t, event.Id.Hex()).ScheduledEvent; cleared != nil {
		t.Fatalf("expected Timeful schedule to be cleared, got %#v", cleared)
	}
}

func TestPublicTimefulScheduleRejectsEmptyRange(t *testing.T) {
	initRoutesReadFiltersTestDB(t)
	router := newEventsReadFiltersTestRouter()
	event := models.Event{Id: primitive.NewObjectID(), Name: "Invalid range", Type: models.SPECIFIC_DATES}
	seedEventReadFiltersTestData(t, event, nil, nil)

	recorder := timedEventRequest(t, router, http.MethodPut, "/api/events/"+event.Id.Hex()+"/schedule", map[string]any{
		"startDate": "2026-08-01T10:00:00Z",
		"endDate":   "2026-08-01T10:00:00Z",
	})
	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected invalid range status 400, got %d: %s", recorder.Code, recorder.Body.String())
	}
}
