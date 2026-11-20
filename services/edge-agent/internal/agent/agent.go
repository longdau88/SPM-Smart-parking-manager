package agent

import (
	"context"
	"time"

	"github.com/longdau88/SPM-Smart-parking-manager/services/edge-agent/internal/modbus"
	"github.com/longdau88/SPM-Smart-parking-manager/services/edge-agent/internal/mqttsync"
	"github.com/longdau88/SPM-Smart-parking-manager/services/edge-agent/internal/store"
)

type Config struct {
	TenantID string
	SiteID   string
	LaneID   string
}

type Engine struct {
	store      *store.Store
	controller *modbus.Controller
	publisher  mqttsync.Publisher
	config     Config
}

func New(storeDB *store.Store, controller *modbus.Controller, publisher mqttsync.Publisher, config Config) *Engine {
	return &Engine{store: storeDB, controller: controller, publisher: publisher, config: config}
}

func (e *Engine) EnqueueLoopEvent(ctx context.Context, edgeEventID string, loop1, loop2 bool) error {
	return e.store.Enqueue(ctx, store.OutboxItem{
		ID:        edgeEventID,
		TenantID:  e.config.TenantID,
		SiteID:    e.config.SiteID,
		LaneID:    e.config.LaneID,
		EventType: "lane.loop_state",
		Payload: map[string]any{
			"edge_event_id": edgeEventID,
			"loop1":         loop1,
			"loop2":         loop2,
			"timestamp":     time.Now().UTC().Format(time.RFC3339Nano),
		},
	})
}

func (e *Engine) OpenBarrier(ctx context.Context, edgeEventID string) error {
	if err := e.controller.OpenBarrier(); err != nil {
		return err
	}
	return e.store.Enqueue(ctx, store.OutboxItem{
		ID:        edgeEventID,
		TenantID:  e.config.TenantID,
		SiteID:    e.config.SiteID,
		LaneID:    e.config.LaneID,
		EventType: "barrier.open",
		Payload: map[string]any{
			"edge_event_id": edgeEventID,
			"action":        "OPEN",
			"timestamp":     time.Now().UTC().Format(time.RFC3339Nano),
		},
	})
}

func (e *Engine) CloseBarrier(ctx context.Context, edgeEventID string) error {
	if err := e.controller.CloseBarrier(); err != nil {
		_ = e.store.Enqueue(ctx, store.OutboxItem{
			ID:        edgeEventID,
			TenantID:  e.config.TenantID,
			SiteID:    e.config.SiteID,
			LaneID:    e.config.LaneID,
			EventType: "barrier.close_blocked",
			Payload: map[string]any{
				"edge_event_id": edgeEventID,
				"action":        "CLOSE_BLOCKED",
				"reason":        err.Error(),
				"timestamp":     time.Now().UTC().Format(time.RFC3339Nano),
			},
		})
		return err
	}
	return e.store.Enqueue(ctx, store.OutboxItem{
		ID:        edgeEventID,
		TenantID:  e.config.TenantID,
		SiteID:    e.config.SiteID,
		LaneID:    e.config.LaneID,
		EventType: "barrier.close",
		Payload: map[string]any{
			"edge_event_id": edgeEventID,
			"action":        "CLOSE",
			"timestamp":     time.Now().UTC().Format(time.RFC3339Nano),
		},
	})
}

func (e *Engine) SyncOutbox(ctx context.Context) error {
	items, err := e.store.Pending(ctx, 100)
	if err != nil {
		return err
	}
	for _, item := range items {
		payload := item.Payload
		payload["edge_event_id"] = item.ID
		topic := mqttsync.DetectionTopic(item.TenantID, item.SiteID, item.LaneID)
		if err := mqttsync.PublishOutbox(ctx, e.publisher, topic, payload); err != nil {
			attempts := item.Attempts + 1
			if retryErr := e.store.MarkRetry(ctx, item.ID, attempts); retryErr != nil {
				return retryErr
			}
			continue
		}
		if err := e.store.MarkSent(ctx, item.ID); err != nil {
			return err
		}
	}
	return nil
}
