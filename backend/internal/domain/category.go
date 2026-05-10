package domain

import "time"

// CategoryGroupType represents the type of a category group.
type CategoryGroupType string

const (
	GroupTypeRevenue    CategoryGroupType = "revenue"
	GroupTypeInvestment CategoryGroupType = "investment"
	GroupTypeExpense    CategoryGroupType = "expense"
)

// ExpenseType represents the subtype of an expense category.
type ExpenseType string

const (
	ExpenseTypeFixed      ExpenseType = "fixed"
	ExpenseTypeVariable   ExpenseType = "variable"
	ExpenseTypeExtra      ExpenseType = "extra"
	ExpenseTypeAdditional ExpenseType = "additional"
)

// CategoryGroup represents a group of categories (e.g., "Receitas", "Despesas Fixas").
type CategoryGroup struct {
	ID          int64              `json:"id"`
	Name        string             `json:"name"`
	Type        CategoryGroupType  `json:"type"`
	SortOrder   int                `json:"sortOrder"`
	CreatedAt   time.Time          `json:"createdAt"`
	Categories  []Category         `json:"categories,omitempty"`
}

// Category represents a financial category within a group.
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

// CategoryRepository defines the interface for category persistence.
type CategoryRepository interface {
	FindAll() ([]*CategoryGroup, error)
	FindByID(id int64) (*Category, error)
	FindByGroupID(groupID int64) ([]*Category, error)
	Create(c *Category) error
	Update(c *Category) error
	Delete(id int64) error
}
