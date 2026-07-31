package main

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHealthRouteReportsDatabaseAvailability(t *testing.T) {
	previousDatabasePing := databasePing
	t.Cleanup(func() {
		databasePing = previousDatabasePing
	})

	gin.SetMode(gin.TestMode)
	router := gin.New()
	initHealthRoute(router.Group("/api"))

	t.Run("available", func(t *testing.T) {
		databasePing = func(context.Context) error {
			return nil
		}

		response := httptest.NewRecorder()
		router.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/api/health", nil))

		if response.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
		}
	})

	t.Run("unavailable", func(t *testing.T) {
		databasePing = func(context.Context) error {
			return errors.New("database unavailable")
		}

		response := httptest.NewRecorder()
		router.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/api/health", nil))

		if response.Code != http.StatusServiceUnavailable {
			t.Fatalf("status = %d, want %d", response.Code, http.StatusServiceUnavailable)
		}
	})
}
