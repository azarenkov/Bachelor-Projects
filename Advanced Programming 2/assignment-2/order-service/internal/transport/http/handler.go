package http

import (
	"context"
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"order-service/internal/domain"
	"order-service/internal/usecase"
)

type orderUseCase interface {
	CreateOrder(ctx context.Context, customerID, itemName string, amount int64, idempotencyKey string) (*domain.Order, error)
	GetOrder(ctx context.Context, id string) (*domain.Order, error)
	CancelOrder(ctx context.Context, id string) (*domain.Order, error)
	GetRecentOrders(ctx context.Context, limit int) ([]*domain.Order, error)
}

type Handler struct {
	uc orderUseCase
}

func New(uc orderUseCase) *Handler {
	return &Handler{uc: uc}
}

func (h *Handler) RegisterRoutes(r *gin.Engine) {
	r.POST("/orders", h.createOrder)
	r.GET("/orders/recent", h.getRecentOrders)
	r.GET("/orders/:id", h.getOrder)
	r.PATCH("/orders/:id/cancel", h.cancelOrder)
}

type createOrderRequest struct {
	CustomerID string `json:"customer_id" binding:"required"`
	ItemName   string `json:"item_name"   binding:"required"`
	Amount     int64  `json:"amount"      binding:"required,gt=0"`
}

type orderResponse struct {
	ID         string `json:"id"`
	CustomerID string `json:"customer_id"`
	ItemName   string `json:"item_name"`
	Amount     int64  `json:"amount"`
	Status     string `json:"status"`
	CreatedAt  string `json:"created_at"`
}

func toResponse(o *domain.Order) orderResponse {
	return orderResponse{
		ID:         o.ID,
		CustomerID: o.CustomerID,
		ItemName:   o.ItemName,
		Amount:     o.Amount,
		Status:     o.Status,
		CreatedAt:  o.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

func (h *Handler) createOrder(c *gin.Context) {
	var req createOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	idempotencyKey := c.GetHeader("Idempotency-Key")

	order, err := h.uc.CreateOrder(c.Request.Context(), req.CustomerID, req.ItemName, req.Amount, idempotencyKey)
	if err != nil {
		if errors.Is(err, usecase.ErrPaymentServiceUnavailable) {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": err.Error(), "order": toResponse(order)})
			return
		}
		if errors.Is(err, domain.ErrInvalidAmount) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, toResponse(order))
}

func (h *Handler) getOrder(c *gin.Context) {
	order, err := h.uc.GetOrder(c.Request.Context(), c.Param("id"))
	if err != nil {
		if errors.Is(err, domain.ErrOrderNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, toResponse(order))
}

func (h *Handler) getRecentOrders(c *gin.Context) {
	raw, exists := c.GetQuery("limit")
	if !exists || raw == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "limit query parameter is required"})
		return
	}

	limit, err := strconv.Atoi(raw)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "limit must be a number"})
		return
	}

	if limit < 1 || limit > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "limit must be between 1 and 100"})
		return
	}

	orders, err := h.uc.GetRecentOrders(c.Request.Context(), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := make([]orderResponse, 0, len(orders))
	for _, o := range orders {
		resp = append(resp, toResponse(o))
	}
	c.JSON(http.StatusOK, resp)
}

func (h *Handler) cancelOrder(c *gin.Context) {
	order, err := h.uc.CancelOrder(c.Request.Context(), c.Param("id"))
	if err != nil {
		if errors.Is(err, domain.ErrOrderNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if errors.Is(err, domain.ErrCannotCancel) {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, toResponse(order))
}
