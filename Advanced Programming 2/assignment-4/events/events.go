package events

const (
	ExchangePayments = "payments"

	RoutingKeyPaymentCompleted = "payment.completed"

	QueueNotifications = "notifications.payment_completed"

	ExchangePaymentsDLX = "payments.dlx"
	QueueNotificationsDLQ = "notifications.payment_completed.dlq"

	HeaderMessageID = "message_id"
	HeaderAttempts  = "x-attempts"

	MaxDeliveryAttempts = 3
)

type PaymentCompletedEvent struct {
	MessageID     string `json:"message_id"`
	OrderID       string `json:"order_id"`
	TransactionID string `json:"transaction_id"`
	Amount        int64  `json:"amount"`
	CustomerEmail string `json:"customer_email"`
	Status        string `json:"status"`
	OccurredAt    string `json:"occurred_at"`
}
