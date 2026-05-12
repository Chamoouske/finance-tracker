package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/chamoouske/finance-tracker/internal/domain"
)

type SummaryRepository interface {
	FindByPeriod(periodID int64) (*domain.MonthlySummary, error)
	Recalculate(periodID int64) error
	RecalculateAll(ctx context.Context, tx *sql.Tx) error
}

type sqliteSummaryRepository struct {
	db *sql.DB
}

func NewSummaryRepository(db *sql.DB) SummaryRepository {
	return &sqliteSummaryRepository{db: db}
}

func (r *sqliteSummaryRepository) FindByPeriod(periodID int64) (*domain.MonthlySummary, error) {
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
	s.CreatedAt, _ = parseTime(createdAt)
	s.UpdatedAt, _ = parseTime(updatedAt)
	return s, nil
}

func (r *sqliteSummaryRepository) Recalculate(periodID int64) error {
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

	now := formatTime(time.Now())

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

func (r *sqliteSummaryRepository) RecalculateAll(ctx context.Context, tx *sql.Tx) error {
	ownTx := false
	if tx == nil {
		var err error
		tx, err = r.db.BeginTx(ctx, nil)
		if err != nil {
			return fmt.Errorf("begin tx: %w", err)
		}
		ownTx = true
		defer tx.Rollback()
	}

	// Use INSERT OR REPLACE (UPSERT) to recalculate all summaries at once
	now := formatTime(time.Now())

	query := `
		INSERT INTO monthly_summaries
			(period_id, revenue_total, investment_total,
			 fixed_expense_total, variable_expense_total,
			 extra_expense_total, additional_expense_total,
			 balance, created_at, updated_at)
		SELECT
			p.id,
			COALESCE(SUM(CASE WHEN cg.type = 'revenue' THEN t.amount ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN cg.type = 'investment' THEN t.amount ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN c.expense_type = 'fixed' AND cg.type = 'expense' THEN t.amount ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN c.expense_type = 'variable' AND cg.type = 'expense' THEN t.amount ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN c.expense_type = 'extra' AND cg.type = 'expense' THEN t.amount ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN c.expense_type = 'additional' AND cg.type = 'expense' THEN t.amount ELSE 0 END), 0),
			COALESCE(SUM(CASE WHEN cg.type = 'revenue' OR cg.type = 'investment' THEN t.amount ELSE -t.amount END), 0),
			?, ?
		FROM periods p
		LEFT JOIN transactions t ON t.period_id = p.id
		LEFT JOIN categories c ON c.id = t.category_id
		LEFT JOIN category_groups cg ON cg.id = c.group_id
		GROUP BY p.id
		ON CONFLICT(period_id) DO UPDATE SET
			revenue_total = excluded.revenue_total,
			investment_total = excluded.investment_total,
			fixed_expense_total = excluded.fixed_expense_total,
			variable_expense_total = excluded.variable_expense_total,
			extra_expense_total = excluded.extra_expense_total,
			additional_expense_total = excluded.additional_expense_total,
			balance = excluded.balance,
			updated_at = excluded.updated_at`

	if _, err := tx.ExecContext(ctx, query, now, now); err != nil {
		return fmt.Errorf("recalculate all summaries: %w", err)
	}

	if ownTx {
		return tx.Commit()
	}
	return nil
}
