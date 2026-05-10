package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/ajaxl/finance-tracker/internal/domain"
)

// TransactionRepo implements domain.TransactionRepository.
type TransactionRepo struct {
	db *sql.DB
}

// NewTransactionRepo creates a new TransactionRepo.
func NewTransactionRepo(db *sql.DB) *TransactionRepo {
	return &TransactionRepo{db: db}
}

// Create inserts a new transaction within a transaction context.
func (r *TransactionRepo) Create(tx *sql.Tx, t *domain.Transaction) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	result, err := tx.Exec(
		`INSERT INTO transactions (period_id, category_id, date, amount, type, note, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		t.PeriodID, t.CategoryID, t.Date, t.Amount, t.Type, t.Note, now, now,
	)
	if err != nil {
		return fmt.Errorf("create transaction: %w", err)
	}
	id, _ := result.LastInsertId()
	t.ID = id
	t.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", now)
	t.UpdatedAt = t.CreatedAt
	return nil
}

// FindByID returns a transaction by its ID with optional joins.
func (r *TransactionRepo) FindByID(id int64) (*domain.Transaction, error) {
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
	t.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
	t.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
	return t, nil
}

// FindByPeriod returns all transactions for a given period ID.
func (r *TransactionRepo) FindByPeriod(periodID int64) ([]*domain.Transaction, error) {
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

// FindByPeriodStr returns all transactions for a given year/month.
func (r *TransactionRepo) FindByPeriodStr(year, month int) ([]*domain.Transaction, error) {
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

func (r *TransactionRepo) queryTransactions(query string, args ...interface{}) ([]*domain.Transaction, error) {
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

// scanFullTransaction scans a transaction row with category and period joins.
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

	t.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", tCreatedAt)
	t.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", tUpdatedAt)

	if cat.ID > 0 {
		if catExpenseType.Valid {
			et := domain.ExpenseType(catExpenseType.String)
			cat.ExpenseType = &et
		}
		cat.Active = catActive == 1
		cat.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", catCreatedAt)
		cat.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", catUpdatedAt)
		t.Category = cat
	}

	if period.ID > 0 {
		if periodClosedAt.Valid {
			t2, err := time.Parse("2006-01-02 15:04:05", periodClosedAt.String)
			if err == nil {
				period.ClosedAt = &t2
			}
		}
		period.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", periodCreatedAt)
		period.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", periodUpdatedAt)
		t.Period = period
	}

	return t, nil
}

// Update updates an existing transaction.
func (r *TransactionRepo) Update(t *domain.Transaction) error {
	now := time.Now().Format("2006-01-02 15:04:05")
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
	t.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", now)
	return nil
}

// Delete removes a transaction by ID.
func (r *TransactionRepo) Delete(id int64) error {
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

// GetOrCreatePeriod finds or creates a period by year/month and returns its ID.
func (r *TransactionRepo) GetOrCreatePeriod(year, month int) (int64, error) {
	// Try to find existing
	var id int64
	err := r.db.QueryRow(`SELECT id FROM periods WHERE year = ? AND month = ?`, year, month).Scan(&id)
	if err == nil {
		return id, nil
	}
	if err != sql.ErrNoRows {
		return 0, fmt.Errorf("find period: %w", err)
	}

	// Create new period
	now := time.Now().Format("2006-01-02 15:04:05")
	result, err := r.db.Exec(
		`INSERT INTO periods (year, month, created_at, updated_at) VALUES (?, ?, ?, ?)`,
		year, month, now, now,
	)
	if err != nil {
		return 0, fmt.Errorf("create period: %w", err)
	}
	id, _ = result.LastInsertId()
	return id, nil
}
