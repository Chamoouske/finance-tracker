package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/chamoouske/finance-tracker/internal/domain"
)

type BalanceSnapshotRepository interface {
	GetLatest(ctx context.Context) (*domain.BalanceSnapshot, error)
	Recalculate(ctx context.Context, tx *sql.Tx) error
}

type sqliteBalanceSnapshotRepository struct {
	db *sql.DB
}

func NewBalanceSnapshotRepository(db *sql.DB) BalanceSnapshotRepository {
	return &sqliteBalanceSnapshotRepository{db: db}
}

func (r *sqliteBalanceSnapshotRepository) GetLatest(ctx context.Context) (*domain.BalanceSnapshot, error) {
	s := &domain.BalanceSnapshot{}
	var calculatedAt, createdAt string

	err := r.db.QueryRowContext(ctx,
		`SELECT id, total_balance, total_income, total_expense,
			total_credit, total_debit, month_count,
			calculated_at, created_at
		 FROM balance_snapshots
		 ORDER BY calculated_at DESC LIMIT 1`,
	).Scan(&s.ID, &s.TotalBalance, &s.TotalIncome, &s.TotalExpense,
		&s.TotalCredit, &s.TotalDebit, &s.MonthCount,
		&calculatedAt, &createdAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get latest balance snapshot: %w", err)
	}

	s.CalculatedAt, _ = parseTime(calculatedAt)
	s.CreatedAt, _ = parseTime(createdAt)
	return s, nil
}

func (r *sqliteBalanceSnapshotRepository) Recalculate(ctx context.Context, tx *sql.Tx) error {
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

	// Truncate existing snapshots
	if _, err := tx.ExecContext(ctx, "DELETE FROM balance_snapshots"); err != nil {
		return fmt.Errorf("delete balance snapshots: %w", err)
	}

	// Insert aggregated data from all monthly_summaries
	query := `
		INSERT INTO balance_snapshots
			(total_balance, total_income, total_expense, total_credit, total_debit,
			 month_count, calculated_at, created_at)
		SELECT
			COALESCE(SUM(balance), 0),
			COALESCE(SUM(revenue_total + investment_total), 0),
			COALESCE(SUM(fixed_expense_total + variable_expense_total +
				extra_expense_total + additional_expense_total), 0),
			0, 0,
			COUNT(*),
			CURRENT_TIMESTAMP,
			CURRENT_TIMESTAMP
		FROM monthly_summaries`

	if _, err := tx.ExecContext(ctx, query); err != nil {
		return fmt.Errorf("insert balance snapshot: %w", err)
	}

	if ownTx {
		return tx.Commit()
	}
	return nil
}

// Ensure compile-time interface compliance
var _ BalanceSnapshotRepository = (*sqliteBalanceSnapshotRepository)(nil)
