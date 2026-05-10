package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/chamoouske/finance-tracker/internal/domain"
)

type TransactionRepository interface {
	Create(t *domain.Transaction) error
	FindByID(id int64) (*domain.Transaction, error)
	FindByPeriod(periodID int64) ([]*domain.Transaction, error)
	FindByPeriodStr(year, month int) ([]*domain.Transaction, error)
	Update(t *domain.Transaction) error
	Delete(id int64) error
}

type sqliteTransactionRepository struct {
	db *sql.DB
}

func NewTransactionRepository(db *sql.DB) TransactionRepository {
	return &sqliteTransactionRepository{db: db}
}

func (r *sqliteTransactionRepository) Create(t *domain.Transaction) error {
	now := formatTime(time.Now())
	result, err := r.db.Exec(
		`INSERT INTO transactions (period_id, category_id, date, amount, type, note, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		t.PeriodID, t.CategoryID, t.Date, t.Amount, t.Type, t.Note, now, now,
	)
	if err != nil {
		return fmt.Errorf("create transaction: %w", err)
	}
	id, _ := result.LastInsertId()
	t.ID = id
	t.CreatedAt, _ = parseTime(now)
	t.UpdatedAt = t.CreatedAt
	return nil
}

func (r *sqliteTransactionRepository) FindByID(id int64) (*domain.Transaction, error) {
	t := &domain.Transaction{}
	var createdAt, updatedAt string
	err := r.db.QueryRow(
		`SELECT t.id, t.period_id, t.category_id, t.date, t.amount, t.type, t.note, t.created_at, t.updated_at
		 FROM transactions t WHERE t.id = ?`, id,
	).Scan(&t.ID, &t.PeriodID, &t.CategoryID, &t.Date, &t.Amount, &t.Type, &t.Note, &createdAt, &updatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("transaction not found: %d", id)
		}
		return nil, fmt.Errorf("find transaction by id: %w", err)
	}
	t.CreatedAt, _ = parseTime(createdAt)
	t.UpdatedAt, _ = parseTime(updatedAt)
	return t, nil
}

func (r *sqliteTransactionRepository) FindByPeriod(periodID int64) ([]*domain.Transaction, error) {
	query := `SELECT t.id, t.period_id, t.category_id, t.date, t.amount, t.type, t.note,
		t.created_at, t.updated_at,
		c.id, c.group_id, c.name, c.expense_type, c.sort_order, c.active,
		c.created_at, c.updated_at,
		p.id, p.year, p.month, p.closed_at, p.created_at, p.updated_at
	FROM transactions t
	LEFT JOIN categories c ON c.id = t.category_id
	LEFT JOIN periods p ON p.id = t.period_id
	WHERE t.period_id = ?
	ORDER BY t.date DESC, t.id DESC`

	return r.queryTransactions(query, periodID)
}

func (r *sqliteTransactionRepository) FindByPeriodStr(year, month int) ([]*domain.Transaction, error) {
	query := `SELECT t.id, t.period_id, t.category_id, t.date, t.amount, t.type, t.note,
		t.created_at, t.updated_at,
		c.id, c.group_id, c.name, c.expense_type, c.sort_order, c.active,
		c.created_at, c.updated_at,
		p.id, p.year, p.month, p.closed_at, p.created_at, p.updated_at
	FROM transactions t
	LEFT JOIN categories c ON c.id = t.category_id
	LEFT JOIN periods p ON p.id = t.period_id
	WHERE p.year = ? AND p.month = ?
	ORDER BY t.date DESC, t.id DESC`

	return r.queryTransactions(query, year, month)
}

func (r *sqliteTransactionRepository) queryTransactions(query string, args ...interface{}) ([]*domain.Transaction, error) {
	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("query transactions: %w", err)
	}
	defer rows.Close()

	var transactions []*domain.Transaction
	for rows.Next() {
		t, err := scanFullTransaction(rows)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, t)
	}
	if transactions == nil {
		transactions = []*domain.Transaction{}
	}
	return transactions, nil
}

func scanFullTransaction(scanner interface {
	Scan(dest ...interface{}) error
}) (*domain.Transaction, error) {
	t := &domain.Transaction{}
	cat := &domain.Category{}
	period := &domain.Period{}

	var catExpenseType sql.NullString
	var catCreatedAt, catUpdatedAt string
	var catActive int

	var periodClosedAt sql.NullString
	var periodCreatedAt, periodUpdatedAt string

	var tCreatedAt, tUpdatedAt string

	err := scanner.Scan(
		&t.ID, &t.PeriodID, &t.CategoryID, &t.Date, &t.Amount, &t.Type, &t.Note,
		&tCreatedAt, &tUpdatedAt,
		&cat.ID, &cat.GroupID, &cat.Name, &catExpenseType, &cat.SortOrder, &catActive,
		&catCreatedAt, &catUpdatedAt,
		&period.ID, &period.Year, &period.Month, &periodClosedAt, &periodCreatedAt, &periodUpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("scan transaction: %w", err)
	}

	t.CreatedAt, _ = parseTime(tCreatedAt)
	t.UpdatedAt, _ = parseTime(tUpdatedAt)

	if cat.ID > 0 {
		if catExpenseType.Valid {
			et := domain.ExpenseType(catExpenseType.String)
			cat.ExpenseType = &et
		}
		cat.Active = catActive == 1
		cat.CreatedAt, _ = parseTime(catCreatedAt)
		cat.UpdatedAt, _ = parseTime(catUpdatedAt)
		t.Category = cat
	}

	if period.ID > 0 {
		if periodClosedAt.Valid {
			t2, err := parseTime(periodClosedAt.String)
			if err == nil {
				period.ClosedAt = &t2
			}
		}
		period.CreatedAt, _ = parseTime(periodCreatedAt)
		period.UpdatedAt, _ = parseTime(periodUpdatedAt)
		t.Period = period
	}

	return t, nil
}

func (r *sqliteTransactionRepository) Update(t *domain.Transaction) error {
	now := formatTime(time.Now())
	result, err := r.db.Exec(
		`UPDATE transactions SET period_id = ?, category_id = ?, date = ?, amount = ?, type = ?, note = ?, updated_at = ?
		 WHERE id = ?`,
		t.PeriodID, t.CategoryID, t.Date, t.Amount, t.Type, t.Note, now, t.ID,
	)
	if err != nil {
		return fmt.Errorf("update transaction: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("transaction not found: %d", t.ID)
	}
	t.UpdatedAt, _ = parseTime(now)
	return nil
}

func (r *sqliteTransactionRepository) Delete(id int64) error {
	result, err := r.db.Exec(`DELETE FROM transactions WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete transaction: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("transaction not found: %d", id)
	}
	return nil
}
