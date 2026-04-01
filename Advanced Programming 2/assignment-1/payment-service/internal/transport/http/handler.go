package http

import (
	"context"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"payment-service/internal/domain"
	"payment-service/internal/usecase"
)

// paymentUseCase is the interface the handler depends on.
type paymentUseCase interface {
	Authorize(ctx context.Context, orderID string, amount int64) (*domain.Payment, error)
	GetByOrderID(ctx context.Context, orderID string) (*domain.Payment, error)
}

// Handler holds the HTTP handlers for the Payment Service.
type Handler struct {
	uc paymentUseCase
}

// New creates a Handler with its dependencies injected.
func New(uc paymentUseCase) *Handler {
	return &Handler{uc: uc}
}

// RegisterRoutes registers all Payment Service routes on the given router.
func (h *Handler) RegisterRoutes(r *gin.Engine) {
	r.POST("/payments", h.authorizePayment)
	r.GET("/payments/:order_id", h.getPayment)
}

type authorizeRequest struct {
	OrderID string `json:"order_id" binding:"required"`
	Amount  int64  `json:"amount"   binding:"required,gt=0"`
}

type paymentResponse struct {
	ID            string `json:"id"`
	OrderID       string `json:"order_id"`
	TransactionID string `json:"transaction_id"`
	Amount        int64  `json:"amount"`
	Status        string `json:"status"`
}

func toResponse(p *domain.Payment) paymentResponse {
	return paymentResponse{
		ID:            p.ID,
		OrderID:       p.OrderID,
		TransactionID: p.TransactionID,
		Amount:        p.Amount,
		Status:        p.Status,
	}
}

// authorizePayment handles POST /payments.
func (h *Handler) authorizePayment(c *gin.Context) {
	var req authorizeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	p, err := h.uc.Authorize(c.Request.Context(), req.OrderID, req.Amount)
	if err != nil {
		if errors.Is(err, usecase.ErrDuplicateOrder) {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	status := http.StatusCreated
	if p.Status == domain.StatusDeclined {
		status = http.StatusUnprocessableEntity
	}
	c.JSON(status, toResponse(p))
}

// getPayment handles GET /payments/:order_id.
func (h *Handler) getPayment(c *gin.Context) {
	orderID := c.Param("order_id")

	p, err := h.uc.GetByOrderID(c.Request.Context(), orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if p == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}

	c.JSON(http.StatusOK, toResponse(p))
}
