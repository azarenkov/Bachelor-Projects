module notification-service

go 1.24.13

require (
	github.com/azarenkov/ap2-events v0.0.0-00010101000000-000000000000
	github.com/rabbitmq/amqp091-go v1.10.0
)

replace github.com/azarenkov/ap2-events => ../events
