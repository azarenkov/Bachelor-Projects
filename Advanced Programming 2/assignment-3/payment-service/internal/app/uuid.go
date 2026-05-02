package app

import "github.com/google/uuid"

type uuidGenerator struct{}

func (g *uuidGenerator) NewID() string { return uuid.NewString() }
