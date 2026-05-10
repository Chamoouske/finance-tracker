package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/chamoouske/finance-tracker/internal/domain"
)

type PeriodRepository interface {
	FindByID(id int64) (*domain.Period, error)
	FindByYearMonth(year, month int) (*domain.Period, error)
	GetOrCreate(year, month int) (*domain.Period, error)
	List() ([]*domain.Period, error)
	Close(id int64) error
}

type sqlitePeriodRepository struct {
	db *sql.DB
}

func NewPeriodRepository(db *sql.DB) PeriodRepository {
	return &sqlitePeriodRepository{db: db}
}

func (r *sqlitePeriodRepository) FindByID(id int64) (*domain.Period, error) {
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
		t, err := parseTime(closedAt.String)
		if err == nil {
			p.ClosedAt = &t
		}
	}
	p.CreatedAt, _ = parseTime(createdAt)
	p.UpdatedAt, _ = parseTime(updatedAt)
	return p, nil
}

func (r *sqlitePeriodRepository) FindByYearMonth(year, month int) (*domain.Period, error) {
	p := &domain.Period{}
	var closedAt sql.NullString
	var createdAt, updatedAt string
	err := r.db.QueryRow(
		`SELECT id, year, month, closed_at, created_at, updated_at FROM periods WHERE year = ? AND month = ?`, year, month,
	).Scan(&p.ID, &p.Year, &p.Month, &closedAt, &createdAt, &updatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("find period by year/month: %w", err)
	}
	if closedAt.Valid {
		t, err := parseTime(closedAt.String)
		if err == nil {
			p.ClosedAt = &t
		}
	}
	p.CreatedAt, _ = parseTime(createdAt)
	p.UpdatedAt, _ = parseTime(updatedAt)
	return p, nil
}

func (r *sqlitePeriodRepository) GetOrCreate(year, month int) (*domain.Period, error) {
	p, err := r.FindByYearMonth(year, month)
	if err != nil {
		return nil, err
	}
	if p != nil {
		return p, nil
	}

	now := formatTime(time.Now())
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

func (r *sqlitePeriodRepository) List() ([]*domain.Period, error) {
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
			t, err := parseTime(closedAt.String)
			if err == nil {
				p.ClosedAt = &t
			}
		}
		p.CreatedAt, _ = parseTime(createdAt)
		p.UpdatedAt, _ = parseTime(updatedAt)
		periods = append(periods, p)
	}
	return periods, nil
}

func (r *sqlitePeriodRepository) Close(id int64) error {
	now := formatTime(time.Now())
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
