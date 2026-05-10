package domain

import "time"

type TransactionType string

const (
	TransactionIncome     TransactionType = "income"
	TransactionInvestment TransactionType = "investment"
	TransactionExpense    TransactionType = "expense"
)

type Transaction struct {
	ID         int64            `json:"id"`
	PeriodID   int64            `json:"periodId"`
	CategoryID int64            `json:"categoryId"`
	Date       string           `json:"date"`
	Amount     int64            `json:"amount"`
	Note       string           `json:"note"`
	Type       TransactionType  `json:"type"`
	CreatedAt  time.Time        `json:"createdAt"`
	UpdatedAt  time.Time        `json:"updatedAt"`
	Period     *Period          `json:"period,omitempty"`
	Category   *Category        `json:"category,omitempty"`
}
