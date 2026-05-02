package rabbitmq

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"

	events "github.com/azarenkov/ap2-events"
)

type Notifier interface {
	Notify(ctx context.Context, evt events.PaymentCompletedEvent) error
}

type IdempotencyStore interface {
	MarkProcessed(messageID string) bool
	Has(messageID string) bool
}

type Consumer struct {
	conn     *amqp.Connection
	channel  *amqp.Channel
	queue    string
	notifier Notifier
	idem     IdempotencyStore
}

func NewConsumer(url string, notifier Notifier, idem IdempotencyStore) (*Consumer, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, fmt.Errorf("dial rabbitmq: %w", err)
	}
	ch, err := conn.Channel()
	if err != nil {
		_ = conn.Close()
		return nil, fmt.Errorf("open channel: %w", err)
	}

	if err := declareTopology(ch); err != nil {
		_ = ch.Close()
		_ = conn.Close()
		return nil, err
	}

	if err := ch.Qos(8, 0, false); err != nil {
		_ = ch.Close()
		_ = conn.Close()
		return nil, fmt.Errorf("set qos: %w", err)
	}

	return &Consumer{
		conn:     conn,
		channel:  ch,
		queue:    events.QueueNotifications,
		notifier: notifier,
		idem:     idem,
	}, nil
}

func declareTopology(ch *amqp.Channel) error {
	if err := ch.ExchangeDeclare(events.ExchangePayments, "topic", true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare exchange: %w", err)
	}

	if err := ch.ExchangeDeclare(events.ExchangePaymentsDLX, "topic", true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare dlx: %w", err)
	}

	if _, err := ch.QueueDeclare(events.QueueNotificationsDLQ, true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare dlq: %w", err)
	}

	args := amqp.Table{
		"x-dead-letter-exchange":    events.ExchangePaymentsDLX,
		"x-dead-letter-routing-key": events.RoutingKeyPaymentCompleted,
	}
	if _, err := ch.QueueDeclare(events.QueueNotifications, true, false, false, false, args); err != nil {
		return fmt.Errorf("declare main queue: %w", err)
	}
	if err := ch.QueueBind(events.QueueNotifications, events.RoutingKeyPaymentCompleted, events.ExchangePayments, false, nil); err != nil {
		return fmt.Errorf("bind main queue to payments exchange: %w", err)
	}
	if err := ch.QueueBind(events.QueueNotifications, events.RoutingKeyPaymentCompleted, events.ExchangePaymentsDLX, false, nil); err != nil {
		return fmt.Errorf("bind main queue to dlx (for retries): %w", err)
	}

	return nil
}

func (c *Consumer) Run(ctx context.Context) error {
	deliveries, err := c.channel.ConsumeWithContext(
		ctx,
		c.queue,
		"notification-service",
		false,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return fmt.Errorf("consume: %w", err)
	}

	log.Printf("notification-service consuming from queue=%s", c.queue)

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case d, ok := <-deliveries:
			if !ok {
				return fmt.Errorf("delivery channel closed")
			}
			c.handle(ctx, d)
		}
	}
}

func (c *Consumer) handle(ctx context.Context, d amqp.Delivery) {
	msgID := d.MessageId
	if msgID == "" {
		var probe events.PaymentCompletedEvent
		if err := json.Unmarshal(d.Body, &probe); err == nil {
			msgID = probe.MessageID
		}
	}

	if msgID != "" && c.idem.Has(msgID) {
		log.Printf("duplicate message_id=%s — acking without re-processing", msgID)
		_ = d.Ack(false)
		return
	}

	var evt events.PaymentCompletedEvent
	if err := json.Unmarshal(d.Body, &evt); err != nil {
		log.Printf("invalid payload (cannot unmarshal): %v — moving to DLQ", err)
		c.routeToDLQ(d)
		return
	}

	deathCount := deliveryDeathCount(d, c.queue)
	if deathCount >= int64(events.MaxDeliveryAttempts) {
		log.Printf("message_id=%s exceeded %d attempts (deaths=%d) — moving to DLQ",
			evt.MessageID, events.MaxDeliveryAttempts, deathCount)
		c.routeToDLQ(d)
		return
	}

	if err := c.notifier.Notify(ctx, evt); err != nil {
		log.Printf("notify failed for message_id=%s order_id=%s (attempt %d/%d): %v",
			evt.MessageID, evt.OrderID, deathCount+1, events.MaxDeliveryAttempts, err)
		_ = d.Nack(false, false)
		return
	}

	if msgID != "" {
		c.idem.MarkProcessed(msgID)
	}
	if err := d.Ack(false); err != nil {
		log.Printf("ack failed for message_id=%s: %v", evt.MessageID, err)
	}
}

func (c *Consumer) routeToDLQ(d amqp.Delivery) {
	pubCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := c.channel.PublishWithContext(
		pubCtx,
		"",
		events.QueueNotificationsDLQ,
		false,
		false,
		amqp.Publishing{
			ContentType:  d.ContentType,
			DeliveryMode: amqp.Persistent,
			MessageId:    d.MessageId,
			Headers:      d.Headers,
			Timestamp:    time.Now().UTC(),
			Body:         d.Body,
		},
	); err != nil {
		log.Printf("failed to publish to DLQ: %v — Nacking with requeue", err)
		_ = d.Nack(false, true)
		return
	}
	_ = d.Ack(false)
}

func deliveryDeathCount(d amqp.Delivery, queue string) int64 {
	xDeath, ok := d.Headers["x-death"].([]any)
	if !ok {
		return 0
	}
	for _, item := range xDeath {
		entry, ok := item.(amqp.Table)
		if !ok {
			continue
		}
		if q, _ := entry["queue"].(string); q != queue {
			continue
		}
		if reason, _ := entry["reason"].(string); reason != "rejected" {
			continue
		}
		switch v := entry["count"].(type) {
		case int64:
			return v
		case int32:
			return int64(v)
		case int:
			return int64(v)
		}
	}
	return 0
}

func (c *Consumer) Close() error {
	if c.channel != nil {
		_ = c.channel.Close()
	}
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}
