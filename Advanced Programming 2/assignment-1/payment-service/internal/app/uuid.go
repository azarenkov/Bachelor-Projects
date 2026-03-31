package app

import "github.com/google/uuid"

// uuidGenerator implements the usecase.IDGenerator interface using UUID v4.
type uuidGenerator struct{}

func (g *uuidGenerator) NewID() string {
	return uuid.NewString()
}
