package handler

import (
	"net/http"

	"github.com/ajaxl/finance-tracker/internal/service"
)

// SummaryHandler handles HTTP requests for monthly summaries.
type SummaryHandler struct {
	service *service.SummaryService
}

// NewSummaryHandler creates a new SummaryHandler.
func NewSummaryHandler(service *service.SummaryService) *SummaryHandler {
	return &SummaryHandler{service: service}
}

// Get handles GET /api/summary?period=YYYY-MM.
func (h *SummaryHandler) Get(w http.ResponseWriter, r *http.Request) {
	period := r.URL.Query().Get("period")
	if period == "" {
		respondError(w, 400, "parâmetro 'period' é obrigatório")
		return
	}

	summary, err := h.service.GetByPeriod(period)
	if err != nil {
		respondError(w, 400, err.Error())
		return
	}

	respondSuccess(w, 200, map[string]interface{}{
		"summary": summary,
		"period":  period,
	})
}
