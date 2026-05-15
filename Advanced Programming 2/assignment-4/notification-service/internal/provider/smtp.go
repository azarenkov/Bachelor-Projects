package provider

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"log"
	"net"
	"net/smtp"
	"strings"
	"time"

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

	msg := buildMessage(s.cfg.From, evt)

	errCh := make(chan error, 1)
	go func() {
		errCh <- s.deliver(ctx, evt.CustomerEmail, msg)
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

func (s *SMTPSender) deliver(ctx context.Context, to string, body []byte) error {
	addr := s.cfg.Host + ":" + s.cfg.Port
	useImplicitTLS := s.cfg.Port == "465"

	dialer := &net.Dialer{Timeout: 10 * time.Second}
	dialCtx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	var conn net.Conn
	var err error
	if useImplicitTLS {
		tlsConf := &tls.Config{ServerName: s.cfg.Host, MinVersion: tls.VersionTLS12}
		rawConn, dErr := dialer.DialContext(dialCtx, "tcp", addr)
		if dErr != nil {
			return fmt.Errorf("dial tls: %w", dErr)
		}
		tlsConn := tls.Client(rawConn, tlsConf)
		if hErr := tlsConn.HandshakeContext(dialCtx); hErr != nil {
			_ = rawConn.Close()
			return fmt.Errorf("tls handshake: %w", hErr)
		}
		conn = tlsConn
	} else {
		conn, err = dialer.DialContext(dialCtx, "tcp", addr)
		if err != nil {
			return fmt.Errorf("dial: %w", err)
		}
	}

	client, err := smtp.NewClient(conn, s.cfg.Host)
	if err != nil {
		_ = conn.Close()
		return fmt.Errorf("smtp new client: %w", err)
	}
	defer func() {
		_ = client.Quit()
	}()

	if !useImplicitTLS {
		if ok, _ := client.Extension("STARTTLS"); ok {
			tlsConf := &tls.Config{ServerName: s.cfg.Host, MinVersion: tls.VersionTLS12}
			if err := client.StartTLS(tlsConf); err != nil {
				return fmt.Errorf("starttls: %w", err)
			}
		}
	}

	if s.cfg.Username != "" {
		auth := smtp.PlainAuth("", s.cfg.Username, s.cfg.Password, s.cfg.Host)
		if err := client.Auth(auth); err != nil {
			return fmt.Errorf("auth: %w", err)
		}
	}

	if err := client.Mail(s.cfg.From); err != nil {
		return fmt.Errorf("MAIL FROM: %w", err)
	}
	if err := client.Rcpt(to); err != nil {
		return fmt.Errorf("RCPT TO: %w", err)
	}
	wc, err := client.Data()
	if err != nil {
		return fmt.Errorf("DATA: %w", err)
	}
	if _, err := wc.Write(body); err != nil {
		_ = wc.Close()
		return fmt.Errorf("write body: %w", err)
	}
	if err := wc.Close(); err != nil {
		return fmt.Errorf("close DATA: %w", err)
	}
	return nil
}

func buildMessage(from string, evt events.PaymentCompletedEvent) []byte {
	subject := fmt.Sprintf("Payment %s for Order #%s", strings.ToLower(evt.Status), evt.OrderID)
	body := fmt.Sprintf(
		"Hello,\r\n\r\nYour payment for order %s has %s.\r\nAmount: $%.2f\r\nTransaction: %s\r\n\r\n-- Order Service\r\n",
		evt.OrderID,
		strings.ToLower(evt.Status),
		float64(evt.Amount)/100.0,
		evt.TransactionID,
	)
	var msg strings.Builder
	msg.WriteString("From: ")
	msg.WriteString(from)
	msg.WriteString("\r\n")
	msg.WriteString("To: ")
	msg.WriteString(evt.CustomerEmail)
	msg.WriteString("\r\n")
	msg.WriteString("Subject: ")
	msg.WriteString(subject)
	msg.WriteString("\r\n")
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString("Content-Type: text/plain; charset=\"utf-8\"\r\n")
	msg.WriteString("\r\n")
	msg.WriteString(body)
	return []byte(msg.String())
}
