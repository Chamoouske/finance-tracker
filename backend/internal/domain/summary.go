package domain

import "time"

// MonthlySummary represents the consolidated financial summary for a period.
type MonthlySummary struct {
	ID                    int64     `json:"id"`
	PeriodID              int64     `json:"periodId"`
	RevenueTotal          int64     `json:"revenueTotal"`
	InvestmentTotal       int64     `json:"investmentTotal"`
	FixedExpenseTotal     int64     `json:"fixedExpenseTotal"`
	VariableExpenseTotal  int64     `json:"variableExpenseTotal"`
	ExtraExpenseTotal     int64     `json:"extraExpenseTotal"`
	AdditionalExpenseTotal int64    `json:"additionalExpenseTotal"`
	Balance               int64     `json:"balance"`
	CreatedAt             time.Time `json:"createdAt"`
	UpdatedAt             time.Time `json:"updatedAt"`
}

// SummaryRepository defines the interface for summary persistence.
type SummaryRepository interface {
	FindByPeriod(periodID int64) (*MonthlySummary, error)
	Recalculate(periodID int64) error
}
