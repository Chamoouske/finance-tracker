package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/chamoouske/finance-tracker/internal/domain"
)

// SummaryRepo implements domain.SummaryRepository.
type SummaryRepo struct {
	db *sql.DB
}

// NewSummaryRepo creates a new SummaryRepo.
func NewSummaryRepo(db *sql.DB) *SummaryRepo {
	return &SummaryRepo{db: db}
}

// FindByPeriod returns the monthly summary for a given period.
func (r *SummaryRepo) FindByPeriod(periodID int64) (*domain.MonthlySummary, error) {
	s := &domain.MonthlySummary{}
	var createdAt, updatedAt string
	err := r.db.QueryRow(
		`SELECT id, period_id, revenue_total, investment_total, fixed_expense_total,
			variable_expense_total, extra_expense_total, additional_expense_total, balance,
			created_at, updated_at
		 FROM monthly_summaries WHERE period_id = ?`, periodID,
	).Scan(&s.ID, &s.PeriodID, &s.RevenueTotal, &s.InvestmentTotal,
		&s.FixedExpenseTotal, &s.VariableExpenseTotal, &s.ExtraExpenseTotal,
		&s.AdditionalExpenseTotal, &s.Balance, &createdAt, &updatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("find summary by period: %w", err)
	}
	s.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
	s.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
	return s, nil
}

// Recalculate recalculates the monthly summary for a given period.
func (r *SummaryRepo) Recalculate(periodID int64) error {
	query := `
	SELECT
		COALESCE(SUM(CASE WHEN cg.type = 'revenue' THEN t.amount ELSE 0 END), 0),
		COALESCE(SUM(CASE WHEN cg.type = 'investment' THEN t.amount ELSE 0 END), 0),
		COALESCE(SUM(CASE WHEN c.expense_type = 'fixed' AND cg.type = 'expense' THEN t.amount ELSE 0 END), 0),
		COALESCE(SUM(CASE WHEN c.expense_type = 'variable' AND cg.type = 'expense' THEN t.amount ELSE 0 END), 0),
		COALESCE(SUM(CASE WHEN c.expense_type = 'extra' AND cg.type = 'expense' THEN t.amount ELSE 0 END), 0),
		COALESCE(SUM(CASE WHEN c.expense_type = 'additional' AND cg.type = 'expense' THEN t.amount ELSE 0 END), 0)
	FROM transactions t
	JOIN categories c ON c.id = t.category_id
	JOIN category_groups cg ON cg.id = c.group_id
	WHERE t.period_id = ?`

	var revenueTotal, investmentTotal, fixedTotal, variableTotal, extraTotal, additionalTotal int64

	err := r.db.QueryRow(query, periodID).Scan(
		&revenueTotal, &investmentTotal, &fixedTotal, &variableTotal, &extraTotal, &additionalTotal,
	)
	if err != nil {
		return fmt.Errorf("recalculate summary query: %w", err)
	}

	balance := revenueTotal + investmentTotal - fixedTotal - variableTotal - extraTotal - additionalTotal

	now := time.Now().Format("2006-01-02 15:04:05")

	// UPSERT: try update first, then insert if not exists
	result, err := r.db.Exec(
		`UPDATE monthly_summaries SET
			revenue_total = ?, investment_total = ?,
			fixed_expense_total = ?, variable_expense_total = ?,
			extra_expense_total = ?, additional_expense_total = ?,
			balance = ?, updated_at = ?
		 WHERE period_id = ?`,
		revenueTotal, investmentTotal, fixedTotal, variableTotal, extraTotal, additionalTotal,
		balance, now, periodID,
	)
	if err != nil {
		return fmt.Errorf("update summary: %w", err)
	}
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		// Insert new row
		_, err = r.db.Exec(
			`INSERT INTO monthly_summaries (period_id, revenue_total, investment_total,
				fixed_expense_total, variable_expense_total, extra_expense_total,
				additional_expense_total, balance, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			periodID, revenueTotal, investmentTotal, fixedTotal, variableTotal, extraTotal,
			additionalTotal, balance, now, now,
		)
		if err != nil {
			return fmt.Errorf("insert summary: %w", err)
		}
	}

	return nil
}
