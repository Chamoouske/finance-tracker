package service

import (
	"fmt"
	"time"

	"github.com/chamoouske/finance-tracker/internal/domain"
	"github.com/chamoouske/finance-tracker/internal/repository"
)

type PeriodService interface {
	List() ([]map[string]interface{}, error)
	Close(year, month int) (*domain.Period, error)
}

type periodService struct {
	periodRepo  repository.PeriodRepository
	summaryRepo repository.SummaryRepository
}

func NewPeriodService(periodRepo repository.PeriodRepository, summaryRepo repository.SummaryRepository) PeriodService {
	return &periodService{
		periodRepo:  periodRepo,
		summaryRepo: summaryRepo,
	}
}

func (s *periodService) List() ([]map[string]interface{}, error) {
	periods, err := s.periodRepo.List()
	if err != nil {
		return nil, err
	}

	result := make([]map[string]interface{}, 0, len(periods))
	for _, p := range periods {
		items := map[string]interface{}{
			"id":        p.ID,
			"year":      p.Year,
			"month":     p.Month,
			"label":     fmt.Sprintf("%04d-%02d", p.Year, p.Month),
			"closedAt":  p.ClosedAt,
			"createdAt": p.CreatedAt,
			"updatedAt": p.UpdatedAt,
		}

		summary, err := s.summaryRepo.FindByPeriod(p.ID)
		if err == nil && summary != nil {
			items["balance"] = summary.Balance
			items["revenueTotal"] = summary.RevenueTotal
			items["investmentTotal"] = summary.InvestmentTotal
			items["fixedExpenseTotal"] = summary.FixedExpenseTotal
			items["variableExpenseTotal"] = summary.VariableExpenseTotal
			items["extraExpenseTotal"] = summary.ExtraExpenseTotal
			items["additionalExpenseTotal"] = summary.AdditionalExpenseTotal
		}

		result = append(result, items)
	}
	return result, nil
}

func (s *periodService) Close(year, month int) (*domain.Period, error) {
	period, err := s.periodRepo.FindByYearMonth(year, month)
	if err != nil {
		return nil, err
	}
	if period == nil {
		return nil, fmt.Errorf("nenhuma transação encontrada para o período %04d-%02d. Crie ao menos uma transação antes de fechar o período", year, month)
	}

	if period.ClosedAt != nil {
		return nil, fmt.Errorf("período %04d-%02d já está fechado", year, month)
	}

	if err := s.periodRepo.Close(period.ID); err != nil {
		return nil, err
	}

	now := time.Now()
	period.ClosedAt = &now
	return period, nil
}
