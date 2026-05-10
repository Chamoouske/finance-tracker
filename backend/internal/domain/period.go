package domain

import "time"

type Period struct {
	ID        int64      `json:"id"`
	Year      int        `json:"year"`
	Month     int        `json:"month"`
	ClosedAt  *time.Time `json:"closedAt,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
}
