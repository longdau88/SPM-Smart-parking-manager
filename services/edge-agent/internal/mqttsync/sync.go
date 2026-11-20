package mqttsync

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

type Publisher interface {
	Publish(topic string, qos byte, retained bool, payload interface{}) error
	Subscribe(topic string, qos byte, handler mqtt.MessageHandler) error
	Connected() bool
	Disconnect(quiesce uint)
}

type PahoPublisher struct {
	client mqtt.Client
}

func NewPaho(brokerURL, clientID, username, password string) (*PahoPublisher, error) {
	opts := mqtt.NewClientOptions().AddBroker(brokerURL).SetClientID(clientID).
		SetCleanSession(false).SetAutoReconnect(true).SetConnectRetry(true).
		SetKeepAlive(30 * time.Second)
	if username != "" {
		opts.SetUsername(username)
		opts.SetPassword(password)
	}
	client := mqtt.NewClient(opts)
	token := client.Connect()
	token.Wait()
	if err := token.Error(); err != nil {
		return nil, err
	}
	return &PahoPublisher{client: client}, nil
}

func (p *PahoPublisher) Publish(topic string, qos byte, retained bool, payload interface{}) error {
	token := p.client.Publish(topic, qos, retained, payload)
	token.Wait()
	return token.Error()
}

func (p *PahoPublisher) Subscribe(topic string, qos byte, handler mqtt.MessageHandler) error {
	token := p.client.Subscribe(topic, qos, handler)
	token.Wait()
	return token.Error()
}

func (p *PahoPublisher) Connected() bool {
	return p.client.IsConnected()
}

func (p *PahoPublisher) Disconnect(quiesce uint) {
	p.client.Disconnect(quiesce)
}

type BarrierAction struct {
	CommandID string `json:"command_id"`
	Action    string `json:"action"`
	Reason    string `json:"reason"`
}

func DetectionTopic(tenantID, siteID, laneID string) string {
	return fmt.Sprintf("spm/%s/%s/lane/%s/event/detected", tenantID, siteID, laneID)
}

func BarrierCommandTopic(tenantID, siteID, laneID string) string {
	return fmt.Sprintf("spm/%s/%s/lane/%s/command/barrier", tenantID, siteID, laneID)
}

func PublishOutbox(ctx context.Context, publisher Publisher, topic string, payload map[string]any) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	return publisher.Publish(topic, 1, false, body)
}
