package utils

import (
	"testing"
)

func TestGetBaseUrlNormalizesConfiguredOrigin(t *testing.T) {
	t.Setenv("APP_BASE_URL", " https://staging.timeful.fun/ ")

	if got := GetBaseUrl(); got != "https://staging.timeful.fun" {
		t.Fatalf("GetBaseUrl() = %q, want %q", got, "https://staging.timeful.fun")
	}
}

func TestValidateBaseUrlRejectsNonOrigins(t *testing.T) {
	for _, baseUrl := range []string{
		"",
		"timeful.fun",
		"ftp://timeful.fun",
		"https://timeful.fun/path",
		"https://timeful.fun?query=value",
	} {
		t.Run(baseUrl, func(t *testing.T) {
			t.Setenv("APP_BASE_URL", baseUrl)

			if err := ValidateBaseUrl(); err == nil {
				t.Fatalf("ValidateBaseUrl() with %q returned nil error", baseUrl)
			}
		})
	}
}
