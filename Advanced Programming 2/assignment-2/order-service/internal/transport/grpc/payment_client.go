package grpc

import (
	"context"
	"fmt"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	paymentv1 "github.com/azarenkov/ap2-gen/payment/v1"
	"order-service/internal/usecase"
)

// PaymentClient wraps the gRPC PaymentService client.
type PaymentClient struct {
	client paymentv1.PaymentServiceClient
	conn   *grpc.ClientConn
}

// NewPaymentClient dials the Payment gRPC server at addr.
func NewPaymentClient(addr string) (*PaymentClient, error) {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("dial payment service: %w", err)
	}
	return &PaymentClient{client: paymentv1.NewPaymentServiceClient(conn), conn: conn}, nil
}

// Close tears down the underlying gRPC connection.
func (c *PaymentClient) Close() error { return c.conn.Close() }

// Authorize sends a payment request to the Payment Service over gRPC.
func (c *PaymentClient) Authorize(ctx context.Context, orderID string, amount int64) (*usecase.PaymentResult, error) {
	resp, err := c.client.ProcessPayment(ctx, &paymentv1.PaymentRequest{
		OrderId: orderID,
		Amount:  amount,
	})
	if err != nil {
		return nil, fmt.Errorf("payment service gRPC call: %w", err)
	}
	return &usecase.PaymentResult{
		TransactionID: resp.TransactionId,
		Status:        resp.Status,
	}, nil
}
