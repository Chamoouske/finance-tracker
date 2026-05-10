package handler

import (
	"net/http"

	"github.com/chamoouske/finance-tracker/internal/service"
)

type summaryHandler struct {
	service service.SummaryService
}

func NewSummaryHandler(service service.SummaryService) *summaryHandler {
	return &summaryHandler{service: service}
}

func (h *summaryHandler) Get(w http.ResponseWriter, r *http.Request) {
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
