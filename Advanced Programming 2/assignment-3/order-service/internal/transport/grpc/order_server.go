package grpc

import (
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	orderv1 "github.com/azarenkov/ap2-gen/order/v1"
	"order-service/internal/domain"
	"order-service/internal/usecase"
)

type OrderServer struct {
	orderv1.UnimplementedOrderServiceServer
	uc *usecase.OrderUseCase
}

func NewOrderServer(uc *usecase.OrderUseCase) *OrderServer {
	return &OrderServer{uc: uc}
}

func (s *OrderServer) SubscribeToOrderUpdates(req *orderv1.OrderRequest, stream orderv1.OrderService_SubscribeToOrderUpdatesServer) error {
	ctx := stream.Context()
	orderID := req.OrderId
	if orderID == "" {
		return status.Error(codes.InvalidArgument, "order_id is required")
	}

	order, err := s.uc.GetOrder(ctx, orderID)
	if err != nil {
		return status.Errorf(codes.NotFound, "order not found: %v", err)
	}

	lastStatus := order.Status
	if err := stream.Send(&orderv1.OrderStatusUpdate{
		OrderId:   orderID,
		Status:    lastStatus,
		UpdatedAt: timestamppb.Now(),
	}); err != nil {
		return err
	}

	if lastStatus == domain.StatusPaid ||
		lastStatus == domain.StatusFailed ||
		lastStatus == domain.StatusCancelled {
		return nil
	}

	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			o, err := s.uc.GetOrder(ctx, orderID)
			if err != nil {
				return status.Errorf(codes.Internal, "fetch order: %v", err)
			}
			if o.Status != lastStatus {
				lastStatus = o.Status
				if err := stream.Send(&orderv1.OrderStatusUpdate{
					OrderId:   orderID,
					Status:    lastStatus,
					UpdatedAt: timestamppb.Now(),
				}); err != nil {
					return err
				}
			}
			if lastStatus == domain.StatusPaid ||
				lastStatus == domain.StatusFailed ||
				lastStatus == domain.StatusCancelled {
				return nil
			}
		}
	}
}
