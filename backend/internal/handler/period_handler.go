package handler

import (
	"net/http"
	"strings"

	"github.com/chamoouske/finance-tracker/internal/service"
)

type periodHandler struct {
	service service.PeriodService
}

func NewPeriodHandler(service service.PeriodService) *periodHandler {
	return &periodHandler{service: service}
}

func (h *periodHandler) List(w http.ResponseWriter, r *http.Request) {
	periods, err := h.service.List()
	if err != nil {
		respondError(w, 500, "Erro ao listar períodos: "+err.Error())
		return
	}

	respondSuccess(w, 200, map[string]interface{}{
		"periods": periods,
	})
}

func (h *periodHandler) Close(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Year  int `json:"year"`
		Month int `json:"month"`
	}

	if err := decodeJSON(r, &req); err != nil {
		respondError(w, 400, "Erro ao decodificar JSON: "+err.Error())
		return
	}

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
