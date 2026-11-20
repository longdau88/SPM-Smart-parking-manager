package store

import (
	"context"
	"testing"
)

func TestOutboxEnqueueIdempotentAndPending(t *testing.T) {
	s, err := Open("file:edge-test-" + t.Name() + "?mode=memory&cache=shared")
	if err != nil {
		t.Fatal(err)
	}
	defer s.Close()

	ctx := context.Background()
	item := OutboxItem{
		ID:        "edge-event-1",
		TenantID:  "tenant-1",
		SiteID:    "site-1",
		LaneID:    "lane-1",
		EventType: "lane.loop_state",
		Payload:   map[string]any{"loop1": true, "loop2": false},
	}
	if err := s.Enqueue(ctx, item); err != nil {
		t.Fatal(err)
	}
	if err := s.Enqueue(ctx, item); err != nil {
		t.Fatal(err)
	}

	pending, err := s.Pending(ctx, 100)
	if err != nil {
		t.Fatal(err)
	}
	if len(pending) != 1 {
		t.Fatalf("expected 1 idempotent outbox item, got %d", len(pending))
	}
	if pending[0].Payload["loop1"] != true {
		t.Fatalf("unexpected payload: %#v", pending[0].Payload)
	}
}

func TestRetryDelay(t *testing.T) {
	if RetryDelay(1) != 2_000_000_000 {
		t.Fatalf("unexpected first retry delay")
	}
	if RetryDelay(5) != 60_000_000_000 {
		t.Fatalf("unexpected max retry delay")
	}
}
