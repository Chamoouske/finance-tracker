package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/ajaxl/finance-tracker/internal/domain"
)

// CategoryRepo implements domain.CategoryRepository.
type CategoryRepo struct {
	db *sql.DB
}

// NewCategoryRepo creates a new CategoryRepo.
func NewCategoryRepo(db *sql.DB) *CategoryRepo {
	return &CategoryRepo{db: db}
}

// FindAll returns all category groups with their categories.
func (r *CategoryRepo) FindAll() ([]*domain.CategoryGroup, error) {
	// Fetch groups
	groupRows, err := r.db.Query(
		`SELECT id, name, type, sort_order, created_at FROM category_groups ORDER BY sort_order`,
	)
	if err != nil {
		return nil, fmt.Errorf("list category groups: %w", err)
	}
	defer groupRows.Close()

	var groups []*domain.CategoryGroup
	for groupRows.Next() {
		g := &domain.CategoryGroup{}
		var createdAt string
		if err := groupRows.Scan(&g.ID, &g.Name, &g.Type, &g.SortOrder, &createdAt); err != nil {
			return nil, fmt.Errorf("scan category group: %w", err)
		}
		g.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		groups = append(groups, g)
	}

	if len(groups) == 0 {
		return groups, nil
	}

	// Fetch categories for all groups
	catRows, err := r.db.Query(
		`SELECT c.id, c.group_id, c.name, c.expense_type, c.sort_order, c.active, c.created_at, c.updated_at
		 FROM categories c ORDER BY c.sort_order`,
	)
	if err != nil {
		return nil, fmt.Errorf("list categories: %w", err)
	}
	defer catRows.Close()

	// Build a map of groupID -> categories
	groupMap := make(map[int64]*domain.CategoryGroup)
	for _, g := range groups {
		groupMap[g.ID] = g
	}

	for catRows.Next() {
		cat := domain.Category{}
		var expenseType sql.NullString
		var createdAt, updatedAt string
		var active int
		if err := catRows.Scan(&cat.ID, &cat.GroupID, &cat.Name, &expenseType, &cat.SortOrder, &active, &createdAt, &updatedAt); err != nil {
			return nil, fmt.Errorf("scan category: %w", err)
		}
		if expenseType.Valid {
			et := domain.ExpenseType(expenseType.String)
			cat.ExpenseType = &et
		}
		cat.Active = active == 1
		cat.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		cat.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)

		if g, ok := groupMap[cat.GroupID]; ok {
			g.Categories = append(g.Categories, cat)
		}
	}

	return groups, nil
}

// FindByID returns a category by its ID.
func (r *CategoryRepo) FindByID(id int64) (*domain.Category, error) {
	cat := &domain.Category{}
	var expenseType sql.NullString
	var createdAt, updatedAt string
	var active int
	err := r.db.QueryRow(
		`SELECT id, group_id, name, expense_type, sort_order, active, created_at, updated_at
		 FROM categories WHERE id = ?`, id,
	).Scan(&cat.ID, &cat.GroupID, &cat.Name, &expenseType, &cat.SortOrder, &active, &createdAt, &updatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("category not found: %d", id)
		}
		return nil, fmt.Errorf("find category by id: %w", err)
	}
	if expenseType.Valid {
		et := domain.ExpenseType(expenseType.String)
		cat.ExpenseType = &et
	}
	cat.Active = active == 1
	cat.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
	cat.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
	return cat, nil
}

// FindByGroupID returns categories belonging to a group.
func (r *CategoryRepo) FindByGroupID(groupID int64) ([]*domain.Category, error) {
	rows, err := r.db.Query(
		`SELECT id, group_id, name, expense_type, sort_order, active, created_at, updated_at
		 FROM categories WHERE group_id = ? ORDER BY sort_order`, groupID,
	)
	if err != nil {
		return nil, fmt.Errorf("find categories by group: %w", err)
	}
	defer rows.Close()

	var categories []*domain.Category
	for rows.Next() {
		cat := &domain.Category{}
		var expenseType sql.NullString
		var createdAt, updatedAt string
		var active int
		if err := rows.Scan(&cat.ID, &cat.GroupID, &cat.Name, &expenseType, &cat.SortOrder, &active, &createdAt, &updatedAt); err != nil {
			return nil, fmt.Errorf("scan category: %w", err)
		}
		if expenseType.Valid {
			et := domain.ExpenseType(expenseType.String)
			cat.ExpenseType = &et
		}
		cat.Active = active == 1
		cat.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		cat.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
		categories = append(categories, cat)
	}
	return categories, nil
}

// Create inserts a new category.
func (r *CategoryRepo) Create(c *domain.Category) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	var expenseType *string
	if c.ExpenseType != nil {
		s := string(*c.ExpenseType)
		expenseType = &s
	}

	active := 0
	if c.Active {
		active = 1
	}

	result, err := r.db.Exec(
		`INSERT INTO categories (group_id, name, expense_type, sort_order, active, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		c.GroupID, c.Name, expenseType, c.SortOrder, active, now, now,
	)
	if err != nil {
		return fmt.Errorf("create category: %w", err)
	}
	id, _ := result.LastInsertId()
	c.ID = id
	c.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", now)
	c.UpdatedAt = c.CreatedAt
	return nil
}

// Update updates an existing category.
func (r *CategoryRepo) Update(c *domain.Category) error {
	now := time.Now().Format("2006-01-02 15:04:05")
	var expenseType *string
	if c.ExpenseType != nil {
		s := string(*c.ExpenseType)
		expenseType = &s
	}

	active := 0
	if c.Active {
		active = 1
	}

	result, err := r.db.Exec(
		`UPDATE categories SET name = ?, expense_type = ?, sort_order = ?, active = ?, updated_at = ?
		 WHERE id = ?`,
		c.Name, expenseType, c.SortOrder, active, now, c.ID,
	)
	if err != nil {
		return fmt.Errorf("update category: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("category not found: %d", c.ID)
	}
	c.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", now)
	return nil
}

// Delete removes a category by ID.
func (r *CategoryRepo) Delete(id int64) error {
	result, err := r.db.Exec(`DELETE FROM categories WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete category: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("category not found: %d", id)
	}
	return nil
}
