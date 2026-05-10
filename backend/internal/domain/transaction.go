package domain

import (
	"database/sql"
	"time"
)

// TransactionType represents the type of a transaction.
type TransactionType string

const (
	TransactionIncome     TransactionType = "income"
	TransactionInvestment TransactionType = "investment"
	TransactionExpense    TransactionType = "expense"
)

// Transaction represents a financial transaction entry.
type Transaction struct {
	ID         int64            `json:"id"`
	PeriodID   int64            `json:"periodId"`
	CategoryID int64            `json:"categoryId"`
	Date       string           `json:"date"`   // ISO 8601: YYYY-MM-DD
	Amount     int64            `json:"amount"` // em centavos
	Note       string           `json:"note"`
	Type       TransactionType  `json:"type"`
	CreatedAt  time.Time        `json:"createdAt"`
	UpdatedAt  time.Time        `json:"updatedAt"`
	// Joined fields (optional)
	Period   *Period    `json:"period,omitempty"`
	Category *Category  `json:"category,omitempty"`
}

// TransactionRepository defines the interface for transaction persistence.
type TransactionRepository interface {
	Create(tx *sql.Tx, t *Transaction) error
	FindByID(id int64) (*Transaction, error)
	FindByPeriod(periodID int64) ([]*Transaction, error)
	FindByPeriodStr(year, month int) ([]*Transaction, error)
	Update(t *Transaction) error
	Delete(id int64) error
	GetOrCreatePeriod(year, month int) (int64, error)
}
