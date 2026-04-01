package http

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"order-service/internal/usecase"
)

// PaymentClient calls the Payment Service over REST.
type PaymentClient struct {
	baseURL string
	client  *http.Client
}

// NewPaymentClient creates a PaymentClient.
// The caller must supply an *http.Client with an appropriate Timeout (≤ 2 s per assignment).
func NewPaymentClient(baseURL string, client *http.Client) *PaymentClient {
	return &PaymentClient{baseURL: baseURL, client: client}
}

type authorizeRequest struct {
	OrderID string `json:"order_id"`
	Amount  int64  `json:"amount"`
}

type authorizeResponse struct {
	TransactionID string `json:"transaction_id"`
	Status        string `json:"status"`
}

// Authorize sends a payment authorization request to the Payment Service.
func (c *PaymentClient) Authorize(ctx context.Context, orderID string, amount int64) (*usecase.PaymentResult, error) {
	body, err := json.Marshal(authorizeRequest{OrderID: orderID, Amount: amount})
	if err != nil {
		return nil, fmt.Errorf("marshal payment request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/payments", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("build payment request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("payment service call: %w", err)
	}
	defer resp.Body.Close()

	// Both 201 (Authorized) and 422 (Declined) are valid responses from the Payment Service.
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusUnprocessableEntity {
		return nil, fmt.Errorf("unexpected payment service status: %d", resp.StatusCode)
	}

	var pr authorizeResponse
	if err := json.NewDecoder(resp.Body).Decode(&pr); err != nil {
		return nil, fmt.Errorf("decode payment response: %w", err)
	}

	return &usecase.PaymentResult{
		TransactionID: pr.TransactionID,
		Status:        pr.Status,
	}, nil
}
