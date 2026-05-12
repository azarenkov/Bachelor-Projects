package rabbitmq

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"

	events "github.com/azarenkov/ap2-events"

	"notification-service/internal/idempotency"
	"notification-service/internal/provider"
	"notification-service/internal/retry"
)

type Consumer struct {
	conn     *amqp.Connection
	channel  *amqp.Channel
	queue    string
	sender   provider.EmailSender
	idem     idempotency.Store
	retry    retry.Policy
	jobTimeout time.Duration
}

type Config struct {
	URL         string
	Sender      provider.EmailSender
	Idempotency idempotency.Store
	Retry       retry.Policy
	JobTimeout  time.Duration
}

func NewConsumer(cfg Config) (*Consumer, error) {
	conn, err := amqp.Dial(cfg.URL)
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

	if cfg.JobTimeout <= 0 {
		cfg.JobTimeout = 60 * time.Second
	}

	return &Consumer{
		conn:       conn,
		channel:    ch,
		queue:      events.QueueNotifications,
		sender:     cfg.Sender,
		idem:       cfg.Idempotency,
		retry:      cfg.Retry,
		jobTimeout: cfg.JobTimeout,
	}, nil
}

func declareTopology(ch *amqp.Channel) error {
	if err := ch.ExchangeDeclare(events.ExchangePayments, "topic", true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare exchange: %w", err)
	}
	if _, err := ch.QueueDeclare(events.QueueNotificationsDLQ, true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare dlq: %w", err)
	}
	if _, err := ch.QueueDeclare(events.QueueNotifications, true, false, false, false, nil); err != nil {
		return fmt.Errorf("declare main queue: %w", err)
	}
	if err := ch.QueueBind(events.QueueNotifications, events.RoutingKeyPaymentCompleted, events.ExchangePayments, false, nil); err != nil {
		return fmt.Errorf("bind main queue: %w", err)
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

	log.Printf("notification-service consuming from queue=%s provider=%s", c.queue, c.sender.Name())

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

func (c *Consumer) handle(parent context.Context, d amqp.Delivery) {
	var evt events.PaymentCompletedEvent
	if err := json.Unmarshal(d.Body, &evt); err != nil {
		log.Printf("invalid payload (cannot unmarshal): %v — moving to DLQ", err)
		c.routeToDLQ(d)
		return
	}

	idemKey := evt.TransactionID
	if idemKey == "" {
		idemKey = evt.MessageID
	}
	if idemKey == "" {
		log.Printf("event has neither transaction_id nor message_id — moving to DLQ")
		c.routeToDLQ(d)
		return
	}

	idemCtx, cancelIdem := context.WithTimeout(parent, 5*time.Second)
	already, err := c.idem.Has(idemCtx, idemKey)
	cancelIdem()
	if err != nil {
		log.Printf("idempotency.Has failed for key=%s: %v — will still attempt send", idemKey, err)
	}
	if already {
		log.Printf("duplicate payment key=%s — acking without re-processing", idemKey)
		_ = d.Ack(false)
		return
	}

	jobCtx, cancelJob := context.WithTimeout(parent, c.jobTimeout)
	defer cancelJob()

	label := fmt.Sprintf("send(payment=%s,order=%s)", idemKey, evt.OrderID)
	sendErr := c.retry.Do(jobCtx, label, func(ctx context.Context) error {
		return c.sender.Send(ctx, evt)
	})
	if sendErr != nil {
		log.Printf("permanent failure for payment=%s order=%s: %v — moving to DLQ",
			idemKey, evt.OrderID, sendErr)
		c.routeToDLQ(d)
		return
	}

	markCtx, cancelMark := context.WithTimeout(parent, 5*time.Second)
	if _, err := c.idem.MarkProcessed(markCtx, idemKey); err != nil && !errors.Is(err, context.Canceled) {
		log.Printf("idempotency.MarkProcessed failed for key=%s: %v", idemKey, err)
	}
	cancelMark()

	if err := d.Ack(false); err != nil {
		log.Printf("ack failed for payment=%s: %v", idemKey, err)
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

func (c *Consumer) Close() error {
	if c.channel != nil {
		_ = c.channel.Close()
	}
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}
