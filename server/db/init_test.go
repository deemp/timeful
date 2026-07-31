package db

import "testing"

func TestDatabaseName(t *testing.T) {
	t.Setenv("MONGODB_DATABASE", "timeful-staging")
	if got := DatabaseName(); got != "timeful-staging" {
		t.Fatalf("DatabaseName() = %q, want %q", got, "timeful-staging")
	}
}

func TestDatabaseNameDefaultsToTimeful(t *testing.T) {
	t.Setenv("MONGODB_DATABASE", "")
	if got := DatabaseName(); got != "timeful" {
		t.Fatalf("DatabaseName() = %q, want %q", got, "timeful")
	}
}
