package domain

import "time"

type CategoryGroupType string

const (
	GroupTypeRevenue    CategoryGroupType = "revenue"
	GroupTypeInvestment CategoryGroupType = "investment"
	GroupTypeExpense    CategoryGroupType = "expense"
)

type ExpenseType string

const (
	ExpenseTypeFixed      ExpenseType = "fixed"
	ExpenseTypeVariable   ExpenseType = "variable"
	ExpenseTypeExtra      ExpenseType = "extra"
	ExpenseTypeAdditional ExpenseType = "additional"
)

type CategoryGroup struct {
	ID         int64             `json:"id"`
	Name       string            `json:"name"`
	Type       CategoryGroupType `json:"type"`
	SortOrder  int               `json:"sortOrder"`
	CreatedAt  time.Time         `json:"createdAt"`
	Categories []Category        `json:"categories,omitempty"`
}

type Category struct {
	ID          int64        `json:"id"`
	GroupID     int64        `json:"groupId"`
	Name        string       `json:"name"`
	ExpenseType *ExpenseType `json:"expenseType,omitempty"`
	SortOrder   int          `json:"sortOrder"`
	Active      bool         `json:"active"`
	CreatedAt   time.Time    `json:"createdAt"`
	UpdatedAt   time.Time    `json:"updatedAt"`
}
