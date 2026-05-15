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

type categoryRepository struct {
	db *sql.DB
}

func NewCategoryRepository(db *sql.DB) CategoryRepository {
	return &categoryRepository{db: db}
}

func (r *categoryRepository) FindAll() ([]*domain.CategoryGroup, error) {
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
		var createdAt time.Time
		if err := groupRows.Scan(&g.ID, &g.Name, &g.Type, &g.SortOrder, &createdAt); err != nil {
			return nil, fmt.Errorf("scan category group: %w", err)
		}
		g.CreatedAt = createdAt
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
		var createdAt, updatedAt time.Time
		var active int
		if err := catRows.Scan(&cat.ID, &cat.GroupID, &cat.Name, &expenseType, &cat.SortOrder, &active, &createdAt, &updatedAt); err != nil {
			return nil, fmt.Errorf("scan category: %w", err)
		}
		if expenseType.Valid {
			et := domain.ExpenseType(expenseType.String)
			cat.ExpenseType = &et
		}
		cat.Active = active == 1
		cat.CreatedAt = createdAt
		cat.UpdatedAt = updatedAt

		if g, ok := groupMap[cat.GroupID]; ok {
			g.Categories = append(g.Categories, cat)
		}
	}

	return groups, nil
}

func (r *categoryRepository) FindByID(id int64) (*domain.Category, error) {
	cat := &domain.Category{}
	var expenseType sql.NullString
	var createdAt, updatedAt time.Time
	var active int
	err := r.db.QueryRow(
		`SELECT id, group_id, name, expense_type, sort_order, active, created_at, updated_at
		 FROM categories WHERE id = $1`, id,
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
	cat.CreatedAt = createdAt
	cat.UpdatedAt = updatedAt
	return cat, nil
}

func (r *categoryRepository) FindByGroupID(groupID int64) ([]*domain.Category, error) {
	rows, err := r.db.Query(
		`SELECT id, group_id, name, expense_type, sort_order, active, created_at, updated_at
		 FROM categories WHERE group_id = $1 ORDER BY sort_order`, groupID,
	)
	if err != nil {
		return nil, fmt.Errorf("find categories by group: %w", err)
	}
	defer rows.Close()

	var categories []*domain.Category
	for rows.Next() {
		cat := &domain.Category{}
		var expenseType sql.NullString
		var createdAt, updatedAt time.Time
		var active int
		if err := rows.Scan(&cat.ID, &cat.GroupID, &cat.Name, &expenseType, &cat.SortOrder, &active, &createdAt, &updatedAt); err != nil {
			return nil, fmt.Errorf("scan category: %w", err)
		}
		if expenseType.Valid {
			et := domain.ExpenseType(expenseType.String)
			cat.ExpenseType = &et
		}
		cat.Active = active == 1
		cat.CreatedAt = createdAt
		cat.UpdatedAt = updatedAt
		categories = append(categories, cat)
	}
	return categories, nil
}

func (r *categoryRepository) Create(c *domain.Category) error {
	now := time.Now()
	nowStr := formatTime(now)
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
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		c.GroupID, c.Name, expenseType, c.SortOrder, active, nowStr, nowStr,
	)
	if err != nil {
		return fmt.Errorf("create category: %w", err)
	}
	id, _ := result.LastInsertId()
	c.ID = id
	c.CreatedAt = now
	c.UpdatedAt = now
	return nil
}

func (r *categoryRepository) Update(c *domain.Category) error {
	now := time.Now()
	nowStr := formatTime(now)
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
		`UPDATE categories SET name = $1, expense_type = $2, sort_order = $3, active = $4, updated_at = $5
		 WHERE id = $6`,
		c.Name, expenseType, c.SortOrder, active, nowStr, c.ID,
	)
	if err != nil {
		return fmt.Errorf("update category: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("category not found: %d", c.ID)
	}
	c.UpdatedAt = now
	return nil
}

func (r *categoryRepository) Delete(id int64) error {
	result, err := r.db.Exec(`DELETE FROM categories WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete category: %w", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("category not found: %d", id)
	}
	return nil
}
