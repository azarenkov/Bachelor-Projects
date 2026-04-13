package usecases

import (
	"Booking/internal/domain/entities"
	"Booking/internal/domain/repository"
	"Booking/pkg/hasher"
	"Booking/pkg/jwt"
	"errors"
	"strings"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrWeakPassword       = errors.New("password must be at least 6 characters long")
	ErrInvalidEmail       = errors.New("invalid email format")
	ErrInvalidName        = errors.New("name must be at least 2 characters long")
)

type UserUseCase interface {
	Register(req entities.RegisterRequest) (*entities.AuthResponse, error)
	Login(req entities.LoginRequest) (*entities.AuthResponse, error)
	GetUserByID(id uint64) (*entities.User, error)
	GetUserByEmail(email string) (*entities.User, error)
}

type userUseCase struct {
	userRepo        repository.UserRepository
	passwordService hasher.PasswordService
	jwtService      jwt.JWTService
}

func NewUserUseCase(
	userRepo repository.UserRepository,
	passwordService hasher.PasswordService,
	jwtService jwt.JWTService,
) UserUseCase {
	return &userUseCase{
		userRepo:        userRepo,
		passwordService: passwordService,
		jwtService:      jwtService,
	}
}

func (uc *userUseCase) Register(req entities.RegisterRequest) (*entities.AuthResponse, error) {
	if err := uc.validateRegisterRequest(req); err != nil {
		return nil, err
	}

	existingUser, _ := uc.userRepo.GetByEmail(req.Email)
	if existingUser != nil {
		return nil, repository.ErrUserAlreadyExists
	}

	hashedPassword, err := uc.passwordService.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	user := &entities.User{
		Name:         req.Name,
		Email:        strings.ToLower(strings.TrimSpace(req.Email)),
		Role:         "user",
		PasswordHash: hashedPassword,
	}

	if err := uc.userRepo.Create(user); err != nil {
		return nil, err
	}

	token, err := uc.jwtService.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, err
	}

	return &entities.AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

func (uc *userUseCase) Login(req entities.LoginRequest) (*entities.AuthResponse, error) {
	if err := uc.validateLoginRequest(req); err != nil {
		return nil, err
	}

	user, err := uc.userRepo.GetByEmail(strings.ToLower(strings.TrimSpace(req.Email)))
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if err := uc.passwordService.CheckPassword(user.PasswordHash, req.Password); err != nil {
		return nil, ErrInvalidCredentials
	}

	token, err := uc.jwtService.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, err
	}

	return &entities.AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

func (uc *userUseCase) GetUserByID(id uint64) (*entities.User, error) {
	return uc.userRepo.GetByID(id)
}

func (uc *userUseCase) GetUserByEmail(email string) (*entities.User, error) {
	return uc.userRepo.GetByEmail(strings.ToLower(strings.TrimSpace(email)))
}

func (uc *userUseCase) validateRegisterRequest(req entities.RegisterRequest) error {
	if len(req.Name) < 2 {
		return ErrInvalidName
	}
	if len(req.Password) < 6 {
		return ErrWeakPassword
	}
	if !strings.Contains(req.Email, "@") {
		return ErrInvalidEmail
	}
	return nil
}

func (uc *userUseCase) validateLoginRequest(req entities.LoginRequest) error {
	if !strings.Contains(req.Email, "@") {
		return ErrInvalidEmail
	}
	if req.Password == "" {
		return ErrWeakPassword
	}
	return nil
}
