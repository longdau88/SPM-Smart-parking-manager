package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/longdau88/SPM-Smart-parking-manager/services/edge-agent/internal/agent"
	"github.com/longdau88/SPM-Smart-parking-manager/services/edge-agent/internal/modbus"
	"github.com/longdau88/SPM-Smart-parking-manager/services/edge-agent/internal/mqttsync"
	"github.com/longdau88/SPM-Smart-parking-manager/services/edge-agent/internal/store"
)

func env(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	db, err := store.Open(env("EDGE_DB_PATH", "./edge-agent.db"))
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	modbusAddress := env("MODBUS_ADDRESS", "127.0.0.1:502")
	controller, err := modbus.NewTCPController(modbusAddress, 1500*time.Millisecond)
	if err != nil {
		log.Printf("Modbus unavailable: %v", err)
		controller = modbus.NewController(nil)
	} else {
		defer controller.Close()
	}

	publisher, err := mqttsync.NewPaho(
		env("MQTT_BROKER", "tcp://127.0.0.1:1883"),
		env("MQTT_CLIENT_ID", "spm-edge-agent"),
		env("MQTT_USERNAME", ""),
		env("MQTT_PASSWORD", ""),
	)
	if err != nil {
		log.Printf("MQTT unavailable: %v", err)
		publisher = nil
	}

	config := agent.Config{
		TenantID: env("EDGE_TENANT_ID", "tenant-local"),
		SiteID:   env("EDGE_SITE_ID", "site-local"),
		LaneID:   env("EDGE_LANE_ID", "lane-local"),
	}
	var publisherInterface mqttsync.Publisher
	if publisher != nil {
		publisherInterface = publisher
	}
	engine := agent.New(db, controller, publisherInterface, config)

	if publisher != nil {
		commandTopic := mqttsync.BarrierCommandTopic(config.TenantID, config.SiteID, config.LaneID)
		handler := mqtt.MessageHandler(func(_ mqtt.Client, message mqtt.Message) {
			var command mqttsync.BarrierAction
			if err := json.Unmarshal(message.Payload(), &command); err != nil {
				log.Printf("invalid barrier command: %v", err)
				return
			}
			switch command.Action {
			case "OPEN":
				if err := engine.OpenBarrier(ctx, command.CommandID); err != nil {
					log.Printf("open barrier failed: %v", err)
				}
			case "CLOSE":
				if err := engine.CloseBarrier(ctx, command.CommandID); err != nil {
					log.Printf("close barrier blocked: %v", err)
				}
			default:
				log.Printf("unsupported barrier action: %s", command.Action)
			}
		})
		if err := publisher.Subscribe(commandTopic, 1, handler); err != nil {
			log.Printf("subscribe barrier command failed: %v", err)
		}
	}

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	log.Printf("SPM Edge Agent started: tenant=%s site=%s lane=%s", config.TenantID, config.SiteID, config.LaneID)
	for {
		select {
		case <-ctx.Done():
			if publisher != nil {
				publisher.Disconnect(250)
			}
			return
		case <-ticker.C:
			loop1, loop2, err := controller.LoopStates()
			if err == nil {
				if err := engine.EnqueueLoopEvent(ctx, time.Now().UTC().Format("20060102T150405.000000000Z"), loop1, loop2); err != nil {
					log.Printf("enqueue loop event failed: %v", err)
				}
			}
			if publisher != nil && publisher.Connected() {
				if err := engine.SyncOutbox(ctx); err != nil {
					log.Printf("sync outbox failed: %v", err)
				}
			}
		}
	}
}
