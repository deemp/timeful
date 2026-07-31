package utils

import (
	"reflect"
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

func TestCORSOriginsIncludesCanonicalOriginAndNormalizesAdditionalOrigins(t *testing.T) {
	t.Setenv("APP_BASE_URL", " https://timeful.fun/ ")

	origins, err := CORSOrigins("https://www.timeful.fun/, https://timeful.fun, http://localhost:4173")
	if err != nil {
		t.Fatalf("CORSOrigins() returned an error: %v", err)
	}

	want := []string{"https://timeful.fun", "https://www.timeful.fun", "http://localhost:4173"}
	if !reflect.DeepEqual(origins, want) {
		t.Fatalf("CORSOrigins() = %q, want %q", origins, want)
	}
}

func TestCORSOriginsRejectsInvalidAdditionalOrigin(t *testing.T) {
	t.Setenv("APP_BASE_URL", "https://timeful.fun")

	if _, err := CORSOrigins("not-an-origin"); err == nil {
		t.Fatal("CORSOrigins() returned nil error for an invalid additional origin")
	}
}

func TestGetListmonkOtpFromAddress(t *testing.T) {
	t.Setenv("LISTMONK_OTP_FROM_ADDRESS", "Timeful <noreply@example.com>")

	address, err := GetListmonkOtpFromAddress()
	if err != nil {
		t.Fatalf("GetListmonkOtpFromAddress() returned an error: %v", err)
	}
	if address != "Timeful <noreply@example.com>" {
		t.Fatalf("GetListmonkOtpFromAddress() = %q", address)
	}
}

func TestGetListmonkOtpFromAddressRejectsMissingOrInvalidValues(t *testing.T) {
	for _, fromAddress := range []string{"", "not-an-email"} {
		t.Run(fromAddress, func(t *testing.T) {
			t.Setenv("LISTMONK_OTP_FROM_ADDRESS", fromAddress)

			if _, err := GetListmonkOtpFromAddress(); err == nil {
				t.Fatalf("GetListmonkOtpFromAddress() with %q returned nil error", fromAddress)
			}
		})
	}
}
