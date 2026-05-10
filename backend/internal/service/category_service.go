package service

import (
	"fmt"
	"strings"

	"github.com/chamoouske/finance-tracker/internal/domain"
	"github.com/chamoouske/finance-tracker/internal/repository"
)

type CategoryService interface {
	List() ([]*domain.CategoryGroup, error)
	Create(c *domain.Category) error
	Update(c *domain.Category) error
	Delete(id int64) error
	FindByID(id int64) (*domain.Category, error)
}

type categoryService struct {
	categoryRepo repository.CategoryRepository
}

func NewCategoryService(categoryRepo repository.CategoryRepository) CategoryService {
	return &categoryService{categoryRepo: categoryRepo}
}

func (s *categoryService) List() ([]*domain.CategoryGroup, error) {
	return s.categoryRepo.FindAll()
}

func (s *categoryService) Create(c *domain.Category) error {
	c.Name = strings.TrimSpace(c.Name)
	if c.Name == "" {
		return fmt.Errorf("o nome da categoria é obrigatório")
	}

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
		c.ExpenseType = nil
	}

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

func (s *categoryService) Update(c *domain.Category) error {
	c.Name = strings.TrimSpace(c.Name)
	if c.Name == "" {
		return fmt.Errorf("o nome da categoria é obrigatório")
	}

	existing, err := s.categoryRepo.FindByID(c.ID)
	if err != nil {
		return err
	}

	c.GroupID = existing.GroupID

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

func (s *categoryService) Delete(id int64) error {
	return s.categoryRepo.Delete(id)
}

func (s *categoryService) FindByID(id int64) (*domain.Category, error) {
	return s.categoryRepo.FindByID(id)
}
