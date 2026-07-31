package db

import (
	"context"
	"testing"
)

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

func TestPingReturnsErrorWhenClientIsUninitialized(t *testing.T) {
	previousClient := Client
	Client = nil
	t.Cleanup(func() {
		Client = previousClient
	})

	if err := Ping(context.Background()); err == nil {
		t.Fatal("Ping() error = nil, want an uninitialized client error")
	}
}
