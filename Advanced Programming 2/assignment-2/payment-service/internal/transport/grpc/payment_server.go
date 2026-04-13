package grpc

import (
	"context"
	"log"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	paymentv1 "github.com/azarenkov/ap2-gen/payment/v1"
	"payment-service/internal/usecase"
)

// PaymentServer implements the gRPC PaymentService server.
type PaymentServer struct {
	paymentv1.UnimplementedPaymentServiceServer
	uc *usecase.PaymentUseCase
}

// New creates a PaymentServer.
func New(uc *usecase.PaymentUseCase) *PaymentServer {
	return &PaymentServer{uc: uc}
}

// ProcessPayment handles a payment authorization request.
func (s *PaymentServer) ProcessPayment(ctx context.Context, req *paymentv1.PaymentRequest) (*paymentv1.PaymentResponse, error) {
	if req.OrderId == "" {
		return nil, status.Error(codes.InvalidArgument, "order_id is required")
	}
	if req.Amount <= 0 {
		return nil, status.Error(codes.InvalidArgument, "amount must be greater than 0")
	}

	p, err := s.uc.Authorize(ctx, req.OrderId, req.Amount)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "authorize payment: %v", err)
	}

	return &paymentv1.PaymentResponse{
		TransactionId: p.TransactionID,
		Status:        p.Status,
		CreatedAt:     timestamppb.New(p.CreatedAt),
	}, nil
}

// LoggingInterceptor is a gRPC unary server interceptor that logs method name and duration.
func LoggingInterceptor(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
	start := time.Now()
	resp, err := handler(ctx, req)
	log.Printf("gRPC method=%s duration=%s err=%v", info.FullMethod, time.Since(start), err)
	return resp, err
}
