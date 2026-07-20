package service

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/chamoouske/finance-tracker/internal/domain"
	"github.com/chamoouske/finance-tracker/internal/repository"
)

type TransactionService interface {
	Create(t *domain.Transaction) (*domain.Transaction, *domain.MonthlySummary, error)
	List(periodStr string) ([]*domain.Transaction, error)
	Update(id int64, updates map[string]interface{}) (*domain.Transaction, *domain.MonthlySummary, error)
	Delete(id int64) (*domain.MonthlySummary, error)
}

type transactionService struct {
	transactionRepo repository.TransactionRepository
	categoryRepo    repository.CategoryRepository
	periodRepo      repository.PeriodRepository
	summaryRepo     repository.SummaryRepository
}

func NewTransactionService(
	transactionRepo repository.TransactionRepository,
	categoryRepo repository.CategoryRepository,
	periodRepo repository.PeriodRepository,
	summaryRepo repository.SummaryRepository,
) TransactionService {
	return &transactionService{
		transactionRepo: transactionRepo,
		categoryRepo:    categoryRepo,
		periodRepo:      periodRepo,
		summaryRepo:     summaryRepo,
	}
}

func (s *transactionService) Create(t *domain.Transaction) (*domain.Transaction, *domain.MonthlySummary, error) {
	t.Note = strings.TrimSpace(t.Note)
	if t.Note == "" {
		return nil, nil, fmt.Errorf("o campo 'note' é obrigatório e deve ter pelo menos 1 caractere")
	}

	year, month, err := getPeriodFromDate(t.Date)
	if err != nil {
		return nil, nil, fmt.Errorf("data inválida: %w", err)
	}

	if t.Amount <= 0 {
		return nil, nil, fmt.Errorf("o valor deve ser positivo")
	}

	validTypes := map[domain.TransactionType]bool{
		domain.TransactionIncome:     true,
		domain.TransactionInvestment: true,
		domain.TransactionExpense:    true,
	}
	if !validTypes[t.Type] {
		return nil, nil, fmt.Errorf("tipo inválido: %s", t.Type)
	}

	category, err := s.categoryRepo.FindByID(t.CategoryID)
	if err != nil {
		return nil, nil, fmt.Errorf("categoria não encontrada: %d", t.CategoryID)
	}
	if !category.Active {
		return nil, nil, fmt.Errorf("categoria inativa: %d", t.CategoryID)
	}

	period, err := s.periodRepo.GetOrCreate(year, month)
	if err != nil {
		return nil, nil, fmt.Errorf("erro ao obter período: %w", err)
	}

	if period.ClosedAt != nil {
		return nil, nil, fmt.Errorf("período %04d-%02d já está fechado. Não é possível adicionar transações", year, month)
	}

	t.PeriodID = period.ID
	t.Category = category
	t.CategoryName = category.Name
	t.Period = period
	t.PeriodLabel = fmt.Sprintf("%04d-%02d", period.Year, period.Month)

	if err := s.transactionRepo.Create(t); err != nil {
		return nil, nil, err
	}

	if err := s.summaryRepo.Recalculate(period.ID); err != nil {
		return nil, nil, fmt.Errorf("erro ao recalcular resumo: %w", err)
	}

	summary, _ := s.summaryRepo.FindByPeriod(period.ID)

	return t, summary, nil
}

func (s *transactionService) List(periodStr string) ([]*domain.Transaction, error) {
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

	return s.transactionRepo.FindByPeriodStr(year, month)
}

func (s *transactionService) Update(id int64, updates map[string]interface{}) (*domain.Transaction, *domain.MonthlySummary, error) {
	existing, err := s.transactionRepo.FindByID(id)
	if err != nil {
		return nil, nil, err
	}

	period, err := s.periodRepo.FindByID(existing.PeriodID)
	if err != nil {
		return nil, nil, err
	}
	if period.ClosedAt != nil {
		return nil, nil, fmt.Errorf("período %04d-%02d já está fechado. Não é possível alterar transações", period.Year, period.Month)
	}

	newPeriodID := existing.PeriodID
	if v, ok := updates["category_id"]; ok {
		updates["categoryId"] = v
	}
	if v, ok := updates["categoryId"]; ok {
		catID, _ := v.(float64)
		existing.CategoryID = int64(catID)
		category, err := s.categoryRepo.FindByID(existing.CategoryID)
		if err != nil {
			return nil, nil, fmt.Errorf("categoria não encontrada: %d", existing.CategoryID)
		}
		if !category.Active {
			return nil, nil, fmt.Errorf("categoria inativa: %d", existing.CategoryID)
		}
	}
	if v, ok := updates["date"]; ok {
		dateStr, _ := v.(string)
		year, month, err := getPeriodFromDate(dateStr)
		if err != nil {
			return nil, nil, fmt.Errorf("data inválida: %w", err)
		}
		existing.Date = dateStr
		newPeriod, err := s.periodRepo.GetOrCreate(year, month)
		if err != nil {
			return nil, nil, err
		}
		newPeriodID = newPeriod.ID
		if newPeriod.ClosedAt != nil {
			return nil, nil, fmt.Errorf("perÃ­odo %04d-%02d jÃ¡ estÃ¡ fechado. NÃ£o Ã© possÃ­vel mover transaÃ§Ãµes para ele", year, month)
		}
	}
	if v, ok := updates["amount"]; ok {
		amt, _ := v.(float64)
		if int64(amt) <= 0 {
			return nil, nil, fmt.Errorf("o valor deve ser positivo")
		}
		existing.Amount = int64(amt)
	}
	if v, ok := updates["type"]; ok {
		typeStr, _ := v.(string)
		validTypes := map[domain.TransactionType]bool{
			domain.TransactionIncome:     true,
			domain.TransactionInvestment: true,
			domain.TransactionExpense:    true,
		}
		if !validTypes[domain.TransactionType(typeStr)] {
			return nil, nil, fmt.Errorf("tipo inválido: %s", typeStr)
		}
		existing.Type = domain.TransactionType(typeStr)
	}
	if v, ok := updates["note"]; ok {
		note, _ := v.(string)
		note = strings.TrimSpace(note)
		if note == "" {
			return nil, nil, fmt.Errorf("o campo 'note' é obrigatório e deve ter pelo menos 1 caractere")
		}
		existing.Note = note
	}

	oldPeriodID := period.ID
	existing.PeriodID = newPeriodID

	if err := s.transactionRepo.Update(existing); err != nil {
		return nil, nil, err
	}

	if err := s.summaryRepo.Recalculate(existing.PeriodID); err != nil {
		return nil, nil, fmt.Errorf("erro ao recalcular resumo: %w", err)
	}

	if oldPeriodID != existing.PeriodID {
		if err := s.summaryRepo.Recalculate(oldPeriodID); err != nil {
			return nil, nil, fmt.Errorf("erro ao recalcular resumo do período anterior: %w", err)
		}
	}

	summary, _ := s.summaryRepo.FindByPeriod(existing.PeriodID)
	if category, err := s.categoryRepo.FindByID(existing.CategoryID); err == nil {
		existing.Category = category
		existing.CategoryName = category.Name
	}
	if currentPeriod, err := s.periodRepo.FindByID(existing.PeriodID); err == nil {
		existing.Period = currentPeriod
		existing.PeriodLabel = fmt.Sprintf("%04d-%02d", currentPeriod.Year, currentPeriod.Month)
	}

	return existing, summary, nil
}

func (s *transactionService) Delete(id int64) (*domain.MonthlySummary, error) {
	existing, err := s.transactionRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	period, err := s.periodRepo.FindByID(existing.PeriodID)
	if err != nil {
		return nil, err
	}
	if period.ClosedAt != nil {
		return nil, fmt.Errorf("período %04d-%02d já está fechado. Não é possível excluir transações", period.Year, period.Month)
	}

	if err := s.transactionRepo.Delete(id); err != nil {
		return nil, err
	}

	if err := s.summaryRepo.Recalculate(existing.PeriodID); err != nil {
		return nil, fmt.Errorf("erro ao recalcular resumo: %w", err)
	}

	summary, _ := s.summaryRepo.FindByPeriod(existing.PeriodID)
	return summary, nil
}

func getPeriodFromDate(date string) (int, int, error) {
	if len(date) < 7 {
		return 0, 0, fmt.Errorf("formato de data inválido. Use YYYY-MM-DD")
	}

	t, err := time.Parse("2006-01-02", date)
	if err != nil {
		t, err = time.Parse("2006-01", date)
		if err != nil {
			return 0, 0, fmt.Errorf("formato de data inválido. Use YYYY-MM-DD (ex: 2026-05-10): %w", err)
		}
	}

	return t.Year(), int(t.Month()), nil
}
