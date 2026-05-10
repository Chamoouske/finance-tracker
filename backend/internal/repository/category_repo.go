package repository

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/chamoouske/finance-tracker/internal/domain"
)

type CategoryRepository interface {
	FindAll() ([]*domain.CategoryGroup, error)
	FindByID(id int64) (*domain.Category, error)
	FindByGroupID(groupID int64) ([]*domain.Category, error)
	Create(c *domain.Category) error
	Update(c *domain.Category) error
	Delete(id int64) error
}

type sqliteCategoryRepository struct {
	db *sql.DB
}

func NewCategoryRepository(db *sql.DB) CategoryRepository {
	return &sqliteCategoryRepository{db: db}
}

func (r *sqliteCategoryRepository) FindAll() ([]*domain.CategoryGroup, error) {
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
		g.CreatedAt, _ = parseTime(createdAt)
		groups = append(groups, g)
	}

	if len(groups) == 0 {
		return groups, nil
	}

	catRows, err := r.db.Query(
		`SELECT c.id, c.group_id, c.name, c.expense_type, c.sort_order, c.active, c.created_at, c.updated_at
		 FROM categories c ORDER BY c.sort_order`,
	)
	if err != nil {
		return nil, fmt.Errorf("list categories: %w", err)
	}
	defer catRows.Close()

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
		cat.CreatedAt, _ = parseTime(createdAt)
		cat.UpdatedAt, _ = parseTime(updatedAt)

		if g, ok := groupMap[cat.GroupID]; ok {
			g.Categories = append(g.Categories, cat)
		}
	}

	return groups, nil
}

func (r *sqliteCategoryRepository) FindByID(id int64) (*domain.Category, error) {
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
	cat.CreatedAt, _ = parseTime(createdAt)
	cat.UpdatedAt, _ = parseTime(updatedAt)
	return cat, nil
}

func (r *sqliteCategoryRepository) FindByGroupID(groupID int64) ([]*domain.Category, error) {
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
		cat.CreatedAt, _ = parseTime(createdAt)
		cat.UpdatedAt, _ = parseTime(updatedAt)
		categories = append(categories, cat)
	}
	return categories, nil
}

func (r *sqliteCategoryRepository) Create(c *domain.Category) error {
	now := formatTime(time.Now())
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
	c.CreatedAt, _ = parseTime(now)
	c.UpdatedAt = c.CreatedAt
	return nil
}

func (r *sqliteCategoryRepository) Update(c *domain.Category) error {
	now := formatTime(time.Now())
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
	c.UpdatedAt, _ = parseTime(now)
	return nil
}

func (r *sqliteCategoryRepository) Delete(id int64) error {
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
