module notification-service

go 1.24.13

require (
	github.com/azarenkov/ap2-events v0.0.0-00010101000000-000000000000
	github.com/rabbitmq/amqp091-go v1.10.0
	github.com/redis/go-redis/v9 v9.19.0
)

require (
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	go.uber.org/atomic v1.11.0 // indirect
)

replace github.com/azarenkov/ap2-events => ../events
