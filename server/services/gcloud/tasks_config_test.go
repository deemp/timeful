package gcloud

import "testing"

func TestEmailTasksParent(t *testing.T) {
	t.Setenv("GOOGLE_CLOUD_PROJECT_ID", "timeful-staging")
	t.Setenv("GOOGLE_CLOUD_TASKS_LOCATION", "europe-west1")
	t.Setenv("GOOGLE_CLOUD_TASKS_QUEUE", "email-reminders")

	if got, want := EmailTasksParent(), "projects/timeful-staging/locations/europe-west1/queues/email-reminders"; got != want {
		t.Fatalf("EmailTasksParent() = %q, want %q", got, want)
	}
}

func TestEmailTasksParentDefaults(t *testing.T) {
	t.Setenv("GOOGLE_CLOUD_PROJECT_ID", "")
	t.Setenv("GOOGLE_CLOUD_TASKS_LOCATION", "")
	t.Setenv("GOOGLE_CLOUD_TASKS_QUEUE", "")

	if got, want := EmailTasksParent(), "projects/timeful/locations/us-central1/queues/SendReminderEmail"; got != want {
		t.Fatalf("EmailTasksParent() = %q, want %q", got, want)
	}
}
