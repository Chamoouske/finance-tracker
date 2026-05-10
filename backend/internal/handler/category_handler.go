package handler

import (
	"net/http"

	"github.com/ajaxl/finance-tracker/internal/domain"
	"github.com/ajaxl/finance-tracker/internal/service"
)

// CategoryHandler handles HTTP requests for categories.
type CategoryHandler struct {
	service *service.CategoryService
}

// NewCategoryHandler creates a new CategoryHandler.
func NewCategoryHandler(service *service.CategoryService) *CategoryHandler {
	return &CategoryHandler{service: service}
}

// List handles GET /api/categories.
func (h *CategoryHandler) List(w http.ResponseWriter, r *http.Request) {
	groups, err := h.service.List()
	if err != nil {
		respondError(w, 500, "Erro ao listar categorias: "+err.Error())
		return
	}

	respondSuccess(w, 200, map[string]interface{}{
		"groups": groups,
	})
}

// Create handles POST /api/categories.
func (h *CategoryHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		GroupID     int64   `json:"groupId"`
		Name        string  `json:"name"`
		ExpenseType *string `json:"expenseType,omitempty"`
		SortOrder   int     `json:"sortOrder,omitempty"`
	}

	if err := decodeJSON(r, &req); err != nil {
		respondError(w, 400, "Erro ao decodificar JSON: "+err.Error())
		return
	}

	c := &domain.Category{
		GroupID:   req.GroupID,
		Name:      req.Name,
		SortOrder: req.SortOrder,
		Active:    true,
	}

	if req.ExpenseType != nil {
		et := domain.ExpenseType(*req.ExpenseType)
		c.ExpenseType = &et
	}

	if err := h.service.Create(c); err != nil {
		respondError(w, 400, err.Error())
		return
	}

	respondSuccess(w, 201, c)
}

// Update handles PATCH /api/categories/{id}.
func (h *CategoryHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := extractID(r)
	if err != nil {
		respondError(w, 400, "ID inválido")
		return
	}

	var updates map[string]interface{}
	if err := decodeJSON(r, &updates); err != nil {
		respondError(w, 400, "Erro ao decodificar JSON: "+err.Error())
		return
	}

	// Fetch existing category
	existing, err := h.service.FindByID(id)
	if err != nil {
		respondError(w, 404, err.Error())
		return
	}

	// Apply updates
	if v, ok := updates["name"]; ok {
		existing.Name, _ = v.(string)
	}
	if v, ok := updates["expenseType"]; ok {
		if v == nil {
			existing.ExpenseType = nil
		} else if s, ok := v.(string); ok {
			et := domain.ExpenseType(s)
			existing.ExpenseType = &et
		}
	}
	if v, ok := updates["sortOrder"]; ok {
		if so, ok := v.(float64); ok {
			existing.SortOrder = int(so)
		}
	}
	if v, ok := updates["active"]; ok {
		if a, ok := v.(bool); ok {
			existing.Active = a
		}
	}

	if err := h.service.Update(existing); err != nil {
		respondError(w, 400, err.Error())
		return
	}

	respondSuccess(w, 200, existing)
}

// Delete handles DELETE /api/categories/{id}.
func (h *CategoryHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := extractID(r)
	if err != nil {
		respondError(w, 400, "ID inválido")
		return
	}

	if err := h.service.Delete(id); err != nil {
		respondError(w, 400, err.Error())
		return
	}

	respondSuccess(w, 200, map[string]string{
		"message": "Categoria excluída com sucesso",
	})
}
