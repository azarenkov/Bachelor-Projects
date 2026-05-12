package provider

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/smtp"
	"strings"

	events "github.com/azarenkov/ap2-events"
)

type SMTPConfig struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
}

type SMTPSender struct {
	cfg SMTPConfig
}

func NewSMTPSender(cfg SMTPConfig) (*SMTPSender, error) {
	if cfg.Host == "" || cfg.Port == "" {
		return nil, errors.New("SMTP host and port are required")
	}
	if cfg.From == "" {
		return nil, errors.New("SMTP from address is required")
	}
	return &SMTPSender{cfg: cfg}, nil
}

func (s *SMTPSender) Name() string { return "smtp" }

func (s *SMTPSender) Send(ctx context.Context, evt events.PaymentCompletedEvent) error {
	if evt.CustomerEmail == "" {
		return errors.New("customer email is empty")
	}

	subject := fmt.Sprintf("Payment %s for Order #%s", strings.ToLower(evt.Status), evt.OrderID)
	body := fmt.Sprintf(
		"Hello,\n\nYour payment for order %s has %s.\nAmount: $%.2f\nTransaction: %s\n\n-- Order Service\n",
		evt.OrderID,
		strings.ToLower(evt.Status),
		float64(evt.Amount)/100.0,
		evt.TransactionID,
	)
	headers := map[string]string{
		"From":         s.cfg.From,
		"To":           evt.CustomerEmail,
		"Subject":      subject,
		"Content-Type": "text/plain; charset=\"utf-8\"",
	}
	var msg strings.Builder
	for k, v := range headers {
		msg.WriteString(k)
		msg.WriteString(": ")
		msg.WriteString(v)
		msg.WriteString("\r\n")
	}
	msg.WriteString("\r\n")
	msg.WriteString(body)

	addr := s.cfg.Host + ":" + s.cfg.Port
	var auth smtp.Auth
	if s.cfg.Username != "" {
		auth = smtp.PlainAuth("", s.cfg.Username, s.cfg.Password, s.cfg.Host)
	}

	errCh := make(chan error, 1)
	go func() {
		errCh <- smtp.SendMail(addr, auth, s.cfg.From, []string{evt.CustomerEmail}, []byte(msg.String()))
	}()

	select {
	case err := <-errCh:
		if err != nil {
			return fmt.Errorf("smtp send: %w", err)
		}
		log.Printf("[Notification] (smtp) Sent email to %s for Order #%s", evt.CustomerEmail, evt.OrderID)
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}
