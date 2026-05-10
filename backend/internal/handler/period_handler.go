package handler

import (
	"net/http"
	"strings"

	"github.com/chamoouske/finance-tracker/internal/service"
)

// PeriodHandler handles HTTP requests for periods.
type PeriodHandler struct {
	service *service.PeriodService
}

// NewPeriodHandler creates a new PeriodHandler.
func NewPeriodHandler(service *service.PeriodService) *PeriodHandler {
	return &PeriodHandler{service: service}
}

// List handles GET /api/periods.
func (h *PeriodHandler) List(w http.ResponseWriter, r *http.Request) {
	periods, err := h.service.List()
	if err != nil {
		respondError(w, 500, "Erro ao listar períodos: "+err.Error())
		return
	}

	respondSuccess(w, 200, map[string]interface{}{
		"periods": periods,
	})
}

// Close handles POST /api/periods/close.
func (h *PeriodHandler) Close(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Year  int `json:"year"`
		Month int `json:"month"`
	}

	if err := decodeJSON(r, &req); err != nil {
		respondError(w, 400, "Erro ao decodificar JSON: "+err.Error())
		return
	}

	// Validate year and month
	if req.Year < 2020 || req.Year > 2100 {
		respondError(w, 400, "ano inválido. Use um ano entre 2020 e 2100")
		return
	}
	if req.Month < 1 || req.Month > 12 {
		respondError(w, 400, "mês inválido. Use um valor entre 1 e 12")
		return
	}

	period, err := h.service.Close(req.Year, req.Month)
	if err != nil {
		msg := err.Error()
		status := 400
		if strings.Contains(msg, "já está fechado") {
			status = 409
		}
		if strings.Contains(msg, "nenhuma transação") {
			status = 404
		}
		respondError(w, status, msg)
		return
	}

	respondSuccess(w, 200, map[string]interface{}{
		"message": "Período fechado com sucesso",
		"period":  period,
	})
}
