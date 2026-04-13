package hasher

import (
	"golang.org/x/crypto/bcrypt"
)

type PasswordService interface {
	HashPassword(password string) (string, error)
	CheckPassword(hashedPassword, password string) error
}

type bcryptPasswordService struct {
	cost int
}

func NewPasswordService() PasswordService {
	return &bcryptPasswordService{cost: bcrypt.DefaultCost}
}

func (s *bcryptPasswordService) HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), s.cost)
	return string(hash), err
}

func (s *bcryptPasswordService) CheckPassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}
