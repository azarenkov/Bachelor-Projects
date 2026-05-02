package notifier

import (
	"context"
	"fmt"
	"log"
	"strings"

	events "github.com/azarenkov/ap2-events"
)

type EmailSender struct {
	failOnEmailDomain string
}

func NewEmailSender(failOnEmailDomain string) *EmailSender {
	return &EmailSender{failOnEmailDomain: failOnEmailDomain}
}

func (n *EmailSender) Notify(ctx context.Context, evt events.PaymentCompletedEvent) error {
	if n.failOnEmailDomain != "" && strings.HasSuffix(strings.ToLower(evt.CustomerEmail), "@"+strings.ToLower(n.failOnEmailDomain)) {
		return fmt.Errorf("simulated permanent error for poison email %s", evt.CustomerEmail)
	}

	log.Printf("[Notification] Sent email to %s for Order #%s. Amount: $%.2f (status=%s, tx=%s)",
		evt.CustomerEmail,
		evt.OrderID,
		float64(evt.Amount)/100.0,
		evt.Status,
		evt.TransactionID,
	)
	return nil
}
