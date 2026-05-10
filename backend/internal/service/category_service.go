package service

import (
	"fmt"
	"strings"

	"github.com/ajaxl/finance-tracker/internal/domain"
)

// CategoryService handles business logic for categories.
type CategoryService struct {
	categoryRepo domain.CategoryRepository
}

// NewCategoryService creates a new CategoryService.
func NewCategoryService(categoryRepo domain.CategoryRepository) *CategoryService {
	return &CategoryService{categoryRepo: categoryRepo}
}

// List returns all category groups with categories.
func (s *CategoryService) List() ([]*domain.CategoryGroup, error) {
	return s.categoryRepo.FindAll()
}

// Create creates a new category with business validations.
func (s *CategoryService) Create(c *domain.Category) error {
	// Validate name
	c.Name = strings.TrimSpace(c.Name)
	if c.Name == "" {
		return fmt.Errorf("o nome da categoria é obrigatório")
	}

	// Validate group exists and get its type
	groups, err := s.categoryRepo.FindAll()
	if err != nil {
		return err
	}

	var groupType domain.CategoryGroupType
	groupFound := false
	for _, g := range groups {
		if g.ID == c.GroupID {
			groupFound = true
			groupType = g.Type
			break
		}
	}
	if !groupFound {
		return fmt.Errorf("grupo não encontrado: %d", c.GroupID)
	}

	// Validate expense_type is required for expense groups
	if groupType == domain.GroupTypeExpense {
		if c.ExpenseType == nil {
			return fmt.Errorf("expense_type é obrigatório para categorias do tipo 'expense'")
		}
		validExpenseTypes := map[domain.ExpenseType]bool{
			domain.ExpenseTypeFixed:      true,
			domain.ExpenseTypeVariable:   true,
			domain.ExpenseTypeExtra:      true,
			domain.ExpenseTypeAdditional: true,
		}
		if !validExpenseTypes[*c.ExpenseType] {
			return fmt.Errorf("expense_type inválido: %s", *c.ExpenseType)
		}
	} else {
		// Non-expense groups should not have expense_type
		c.ExpenseType = nil
	}

	// Check unique name within group
	existing, err := s.categoryRepo.FindByGroupID(c.GroupID)
	if err != nil {
		return err
	}
	for _, cat := range existing {
		if strings.EqualFold(cat.Name, c.Name) {
			return fmt.Errorf("já existe uma categoria com o nome '%s' neste grupo", c.Name)
		}
	}

	return s.categoryRepo.Create(c)
}

// Update updates an existing category.
func (s *CategoryService) Update(c *domain.Category) error {
	// Validate name
	c.Name = strings.TrimSpace(c.Name)
	if c.Name == "" {
		return fmt.Errorf("o nome da categoria é obrigatório")
	}

	// Check if category exists
	existing, err := s.categoryRepo.FindByID(c.ID)
	if err != nil {
		return err
	}

	// Preserve group_id from existing record
	c.GroupID = existing.GroupID

	// Validate expense_type if group is expense
	groups, err := s.categoryRepo.FindAll()
	if err != nil {
		return err
	}
	for _, g := range groups {
		if g.ID == c.GroupID && g.Type == domain.GroupTypeExpense {
			if c.ExpenseType == nil {
				return fmt.Errorf("expense_type é obrigatório para categorias do tipo 'expense'")
			}
			break
		}
	}

	return s.categoryRepo.Update(c)
}

// Delete deletes a category by ID.
func (s *CategoryService) Delete(id int64) error {
	return s.categoryRepo.Delete(id)
}

// FindByID returns a category by ID.
func (s *CategoryService) FindByID(id int64) (*domain.Category, error) {
	return s.categoryRepo.FindByID(id)
}
