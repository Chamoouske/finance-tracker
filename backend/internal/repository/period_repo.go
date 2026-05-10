package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/ajaxl/finance-tracker/internal/domain"
)

// PeriodRepo implements domain.PeriodRepository.
type PeriodRepo struct {
	db *sql.DB
}

// NewPeriodRepo creates a new PeriodRepo.
func NewPeriodRepo(db *sql.DB) *PeriodRepo {
	return &PeriodRepo{db: db}
}

// FindByID returns a period by its ID.
func (r *PeriodRepo) FindByID(id int64) (*domain.Period, error) {
	p := &domain.Period{}
	var closedAt sql.NullString
	var createdAt, updatedAt string
	err := r.db.QueryRow(
		`SELECT id, year, month, closed_at, created_at, updated_at FROM periods WHERE id = ?`, id,
	).Scan(&p.ID, &p.Year, &p.Month, &closedAt, &createdAt, &updatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("period not found: %d", id)
		}
		return nil, fmt.Errorf("find period by id: %w", err)
	}
	if closedAt.Valid {
		t, err := time.Parse("2006-01-02 15:04:05", closedAt.String)
		if err == nil {
			p.ClosedAt = &t
		}
	}
	p.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
	p.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
	return p, nil
}

// FindByYearMonth returns a period by year and month.
func (r *PeriodRepo) FindByYearMonth(year, month int) (*domain.Period, error) {
	p := &domain.Period{}
	var closedAt sql.NullString
	var createdAt, updatedAt string
	err := r.db.QueryRow(
		`SELECT id, year, month, closed_at, created_at, updated_at FROM periods WHERE year = ? AND month = ?`, year, month,
	).Scan(&p.ID, &p.Year, &p.Month, &closedAt, &createdAt, &updatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // not found is not an error
		}
		return nil, fmt.Errorf("find period by year/month: %w", err)
	}
	if closedAt.Valid {
		t, err := time.Parse("2006-01-02 15:04:05", closedAt.String)
		if err == nil {
			p.ClosedAt = &t
		}
	}
	p.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
	p.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
	return p, nil
}

// GetOrCreate finds a period by year/month or creates it.
func (r *PeriodRepo) GetOrCreate(year, month int) (*domain.Period, error) {
	// Try to find existing period
	p, err := r.FindByYearMonth(year, month)
	if err != nil {
		return nil, err
	}
	if p != nil {
		return p, nil
	}

	// Create new period
	now := time.Now().Format("2006-01-02 15:04:05")
	result, err := r.db.Exec(
		`INSERT INTO periods (year, month, created_at, updated_at) VALUES (?, ?, ?, ?)`,
		year, month, now, now,
	)
	if err != nil {
		return nil, fmt.Errorf("create period: %w", err)
	}
	id, _ := result.LastInsertId()
	return &domain.Period{
		ID:        id,
		Year:      year,
		Month:     month,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}, nil
}

// List returns all periods ordered by year desc, month desc.
func (r *PeriodRepo) List() ([]*domain.Period, error) {
	rows, err := r.db.Query(
		`SELECT id, year, month, closed_at, created_at, updated_at FROM periods ORDER BY year DESC, month DESC`,
	)
	if err != nil {
		return nil, fmt.Errorf("list periods: %w", err)
	}
	defer rows.Close()

	var periods []*domain.Period
	for rows.Next() {
		p := &domain.Period{}
		var closedAt sql.NullString
		var createdAt, updatedAt string
		if err := rows.Scan(&p.ID, &p.Year, &p.Month, &closedAt, &createdAt, &updatedAt); err != nil {
			return nil, fmt.Errorf("scan period: %w", err)
		}
		if closedAt.Valid {
			t, err := time.Parse("2006-01-02 15:04:05", closedAt.String)
			if err == nil {
				p.ClosedAt = &t
			}
		}
		p.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		p.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
		periods = append(periods, p)
	}
	return periods, nil
}

// Close sets the closed_at timestamp for a period.
func (r *PeriodRepo) Close(id int64) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	result, err := r.db.Exec(
		`UPDATE periods SET closed_at = ?, updated_at = ? WHERE id = ?`, now, now, id,
	)
	if err != nil {
		return fmt.Errorf("close period: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("period not found: %d", id)
	}
	return nil
}
