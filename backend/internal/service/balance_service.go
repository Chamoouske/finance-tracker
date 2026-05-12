package service

import (
	"context"

	"github.com/chamoouske/finance-tracker/internal/domain"
	"github.com/chamoouske/finance-tracker/internal/repository"
)

type BalanceService interface {
	GetBalance(ctx context.Context) (*domain.BalanceSnapshot, error)
	RecalculateAll(ctx context.Context) error
}

type balanceService struct {
	balanceRepo repository.BalanceSnapshotRepository
}

func NewBalanceService(balanceRepo repository.BalanceSnapshotRepository) BalanceService {
	return &balanceService{balanceRepo: balanceRepo}
}

func (s *balanceService) GetBalance(ctx context.Context) (*domain.BalanceSnapshot, error) {
	return s.balanceRepo.GetLatest(ctx)
}

func (s *balanceService) RecalculateAll(ctx context.Context) error {
	return s.balanceRepo.Recalculate(ctx, nil)
}
