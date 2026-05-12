package provider

import (
	"context"

	events "github.com/azarenkov/ap2-events"
)

type EmailSender interface {
	Send(ctx context.Context, evt events.PaymentCompletedEvent) error
	Name() string
}
