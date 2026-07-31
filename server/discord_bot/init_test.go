package discord_bot

import "testing"

func TestListeningChannelNameUsesConfiguredChannel(t *testing.T) {
	t.Setenv("DISCORD_BOT_CHANNEL", "timeful-staging-bot")
	if got := listeningChannelName(); got != "timeful-staging-bot" {
		t.Fatalf("listeningChannelName() = %q, want %q", got, "timeful-staging-bot")
	}
}

func TestListeningChannelNameDefaultsToTimeful(t *testing.T) {
	t.Setenv("DISCORD_BOT_CHANNEL", "")
	t.Setenv("GIN_MODE", "debug")
	if got := listeningChannelName(); got != "timeful-bot-dev" {
		t.Fatalf("listeningChannelName() = %q, want %q", got, "timeful-bot-dev")
	}
}
