package handler

import (
	"net/http"
	"strings"

	"github.com/chamoouske/finance-tracker/internal/domain"
	"github.com/chamoouske/finance-tracker/internal/service"
)

type transactionHandler struct {
	service service.TransactionService
}

func NewTransactionHandler(service service.TransactionService) *transactionHandler {
	return &transactionHandler{service: service}
}

func (h *transactionHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CategoryID int64  `json:"categoryId"`
		Date       string `json:"date"`
		Amount     int64  `json:"amount"`
		Type       string `json:"type"`
		Note       string `json:"note"`
	}

	if err := decodeJSON(r, &req); err != nil {
		respondError(w, 400, "Erro ao decodificar JSON: "+err.Error())
		return
	}

	t := &domain.Transaction{
		CategoryID: req.CategoryID,
		Date:       req.Date,
		Amount:     req.Amount,
		Type:       domain.TransactionType(req.Type),
		Note:       req.Note,
	}

	transaction, summary, err := h.service.Create(t)
	if err != nil {
		msg := err.Error()
		status := 400
		if strings.Contains(msg, "fechado") || strings.Contains(msg, "obrigatório") {
			status = 422
		}
		respondError(w, status, msg)
		return
	}

	respondSuccess(w, 201, map[string]interface{}{
		"transaction": transaction,
		"summary":     summary,
	})
}

func (h *transactionHandler) List(w http.ResponseWriter, r *http.Request) {
	period := r.URL.Query().Get("period")
	if period == "" {
		respondError(w, 400, "parâmetro 'period' é obrigatório")
		return
	}

	transactions, err := h.service.List(period)
	if err != nil {
		respondError(w, 400, err.Error())
		return
	}

	respondSuccess(w, 200, map[string]interface{}{
		"transactions": transactions,
		"total":        len(transactions),
		"period":       period,
	})
}

func (h *transactionHandler) Update(w http.ResponseWriter, r *http.Request) {
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

	transaction, summary, err := h.service.Update(id, updates)
	if err != nil {
		msg := err.Error()
		status := 400
		if strings.Contains(msg, "não encontrada") {
			status = 404
		} else if strings.Contains(msg, "fechado") || strings.Contains(msg, "obrigatório") {
			status = 422
		}
		respondError(w, status, msg)
		return
	}

	respondSuccess(w, 200, map[string]interface{}{
		"transaction": transaction,
		"summary":     summary,
	})
}

func (h *transactionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := extractID(r)
	if err != nil {
		respondError(w, 400, "ID inválido")
		return
	}

	summary, err := h.service.Delete(id)
	if err != nil {
		msg := err.Error()
		status := 400
		if strings.Contains(msg, "não encontrada") {
			status = 404
		} else if strings.Contains(msg, "fechado") || strings.Contains(msg, "obrigatório") {
			status = 422
		}
		respondError(w, status, msg)
		return
	}

	respondSuccess(w, 200, map[string]interface{}{
		"message": "Transação excluída com sucesso",
		"summary": summary,
	})
}
