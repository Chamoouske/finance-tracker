package service

import (
	"database/sql"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/ajaxl/finance-tracker/internal/domain"
)

// TransactionService handles business logic for transactions.
type TransactionService struct {
	db              *sql.DB
	transactionRepo domain.TransactionRepository
	categoryRepo    domain.CategoryRepository
	periodRepo      domain.PeriodRepository
	summaryRepo     domain.SummaryRepository
}

// NewTransactionService creates a new TransactionService.
func NewTransactionService(
	db *sql.DB,
	transactionRepo domain.TransactionRepository,
	categoryRepo domain.CategoryRepository,
	periodRepo domain.PeriodRepository,
	summaryRepo domain.SummaryRepository,
) *TransactionService {
	return &TransactionService{
		db:              db,
		transactionRepo: transactionRepo,
		categoryRepo:    categoryRepo,
		periodRepo:      periodRepo,
		summaryRepo:     summaryRepo,
	}
}

// Create creates a new transaction with validations.
func (s *TransactionService) Create(t *domain.Transaction) (*domain.Transaction, *domain.MonthlySummary, error) {
	// Validate note
	t.Note = strings.TrimSpace(t.Note)
	if t.Note == "" {
		return nil, nil, fmt.Errorf("o campo 'note' é obrigatório e deve ter pelo menos 1 caractere")
	}

	// Validate date
	year, month, err := getPeriodFromDate(t.Date)
	if err != nil {
		return nil, nil, fmt.Errorf("data inválida: %w", err)
	}

	// Validate amount
	if t.Amount <= 0 {
		return nil, nil, fmt.Errorf("o valor deve ser positivo")
	}

	// Validate type
	validTypes := map[domain.TransactionType]bool{
		domain.TransactionIncome:     true,
		domain.TransactionInvestment: true,
		domain.TransactionExpense:    true,
	}
	if !validTypes[t.Type] {
		return nil, nil, fmt.Errorf("tipo inválido: %s", t.Type)
	}

	// Validate category exists and is active
	category, err := s.categoryRepo.FindByID(t.CategoryID)
	if err != nil {
		return nil, nil, fmt.Errorf("categoria não encontrada: %d", t.CategoryID)
	}
	if !category.Active {
		return nil, nil, fmt.Errorf("categoria inativa: %d", t.CategoryID)
	}

	// Get or create period
	period, err := s.periodRepo.GetOrCreate(year, month)
	if err != nil {
		return nil, nil, fmt.Errorf("erro ao obter período: %w", err)
	}

	// Check if period is closed
	if period.ClosedAt != nil {
		return nil, nil, fmt.Errorf("período %04d-%02d já está fechado. Não é possível adicionar transações", year, month)
	}

	t.PeriodID = period.ID

	// Execute in transaction
	tx, err := s.db.Begin()
	if err != nil {
		return nil, nil, fmt.Errorf("erro ao iniciar transação: %w", err)
	}
	defer tx.Rollback()

	if err := s.transactionRepo.Create(tx, t); err != nil {
		return nil, nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, nil, fmt.Errorf("erro ao commitar transação: %w", err)
	}

	// Recalculate summary
	if err := s.summaryRepo.Recalculate(period.ID); err != nil {
		return nil, nil, fmt.Errorf("erro ao recalcular resumo: %w", err)
	}

	// Fetch updated summary
	summary, _ := s.summaryRepo.FindByPeriod(period.ID)

	return t, summary, nil
}

// List returns transactions for a given period string (YYYY-MM).
func (s *TransactionService) List(periodStr string) ([]*domain.Transaction, error) {
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

// Update updates an existing transaction.
func (s *TransactionService) Update(id int64, updates map[string]interface{}) (*domain.Transaction, *domain.MonthlySummary, error) {
	// Fetch existing transaction
	existing, err := s.transactionRepo.FindByID(id)
	if err != nil {
		return nil, nil, err
	}

	// Validate period is not closed
	period, err := s.periodRepo.FindByID(existing.PeriodID)
	if err != nil {
		return nil, nil, err
	}
	if period.ClosedAt != nil {
		return nil, nil, fmt.Errorf("período %04d-%02d já está fechado. Não é possível alterar transações", period.Year, period.Month)
	}

	// Apply updates
	newPeriodID := existing.PeriodID
	if v, ok := updates["categoryId"]; ok {
		catID, _ := v.(float64)
		existing.CategoryID = int64(catID)
		// Validate category
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
		// Get or create new period
		newPeriod, err := s.periodRepo.GetOrCreate(year, month)
		if err != nil {
			return nil, nil, err
		}
		newPeriodID = newPeriod.ID
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

	existing.PeriodID = newPeriodID

	// If period changed, check if old period needs summary recalc
	oldPeriodID := period.ID

	if err := s.transactionRepo.Update(existing); err != nil {
		return nil, nil, err
	}

	// Recalculate summary for new period
	if err := s.summaryRepo.Recalculate(existing.PeriodID); err != nil {
		return nil, nil, fmt.Errorf("erro ao recalcular resumo: %w", err)
	}

	// If period changed, recalculate old period summary too
	if oldPeriodID != existing.PeriodID {
		if err := s.summaryRepo.Recalculate(oldPeriodID); err != nil {
			return nil, nil, fmt.Errorf("erro ao recalcular resumo do período anterior: %w", err)
		}
	}

	summary, _ := s.summaryRepo.FindByPeriod(existing.PeriodID)

	return existing, summary, nil
}

// Delete deletes a transaction and recalculates the summary.
func (s *TransactionService) Delete(id int64) (*domain.MonthlySummary, error) {
	// Fetch existing transaction
	existing, err := s.transactionRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	// Validate period is not closed
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

	// Recalculate summary
	if err := s.summaryRepo.Recalculate(existing.PeriodID); err != nil {
		return nil, fmt.Errorf("erro ao recalcular resumo: %w", err)
	}

	summary, _ := s.summaryRepo.FindByPeriod(existing.PeriodID)
	return summary, nil
}

// getPeriodFromDate extracts year and month from an ISO date string.
func getPeriodFromDate(date string) (int, int, error) {
	if len(date) < 7 {
		return 0, 0, fmt.Errorf("formato de data inválido. Use YYYY-MM-DD")
	}

	// Try to parse the date
	t, err := time.Parse("2006-01-02", date)
	if err != nil {
		// Try just YYYY-MM
		t, err = time.Parse("2006-01", date)
		if err != nil {
			return 0, 0, fmt.Errorf("formato de data inválido. Use YYYY-MM-DD (ex: 2026-05-10): %w", err)
		}
	}

	return t.Year(), int(t.Month()), nil
}
