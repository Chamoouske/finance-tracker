package service

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/chamoouske/finance-tracker/internal/domain"
)

// SummaryService handles business logic for monthly summaries.
type SummaryService struct {
	summaryRepo  domain.SummaryRepository
	periodRepo   domain.PeriodRepository
}

// NewSummaryService creates a new SummaryService.
func NewSummaryService(
	summaryRepo domain.SummaryRepository,
	periodRepo domain.PeriodRepository,
) *SummaryService {
	return &SummaryService{
		summaryRepo:  summaryRepo,
		periodRepo:   periodRepo,
	}
}

// GetByPeriod returns the summary for a given period string (YYYY-MM).
func (s *SummaryService) GetByPeriod(periodStr string) (*domain.MonthlySummary, error) {
	periodStr = strings.TrimSpace(periodStr)
	if periodStr == "" {
		return nil, fmt.Errorf("parâmetro 'period' é obrigatório")
	}

	parts := strings.Split(periodStr, "-")
	if len(parts) != 2 {
		return nil, fmt.Errorf("formato de período inválido. Use YYYY-MM (ex: 2026-05)")
	}

	year, err := strconv.Atoi(parts[0])
	if err != nil || year < 2020 || year > 2100 {
		return nil, fmt.Errorf("ano inválido: %s", parts[0])
	}

	month, err := strconv.Atoi(parts[1])
	if err != nil || month < 1 || month > 12 {
		return nil, fmt.Errorf("mês inválido: %s", parts[1])
	}

	// Find period
	period, err := s.periodRepo.FindByYearMonth(year, month)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar período: %w", err)
	}
	if period == nil {
		// Return empty summary if period doesn't exist
		return &domain.MonthlySummary{
			PeriodID:  0,
			Balance:   0,
		}, nil
	}

	summary, err := s.summaryRepo.FindByPeriod(period.ID)
	if err != nil {
		return nil, err
	}
	if summary == nil {
		return &domain.MonthlySummary{
			PeriodID:  period.ID,
			Balance:   0,
		}, nil
	}

	return summary, nil
}
