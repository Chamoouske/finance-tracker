package domain

import "time"

type BalanceSnapshot struct {
	ID           string    `json:"id"`
	TotalBalance float64   `json:"total_balance"`
	TotalIncome  float64   `json:"total_income"`
	TotalExpense float64   `json:"total_expense"`
	TotalCredit  float64   `json:"total_credit"`
	TotalDebit   float64   `json:"total_debit"`
	MonthCount   int       `json:"month_count"`
	CalculatedAt time.Time `json:"calculated_at"`
	CreatedAt    time.Time `json:"created_at"`
}
