package domain

import "time"

// Period represents a monthly period for financial tracking.
type Period struct {
	ID        int64      `json:"id"`
	Year      int        `json:"year"`
	Month     int        `json:"month"`
	ClosedAt  *time.Time `json:"closedAt,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
}

// PeriodRepository defines the interface for period persistence.
type PeriodRepository interface {
	FindByID(id int64) (*Period, error)
	FindByYearMonth(year, month int) (*Period, error)
	GetOrCreate(year, month int) (*Period, error)
	List() ([]*Period, error)
	Close(id int64) error
}
