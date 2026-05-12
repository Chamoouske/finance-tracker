package handler

import (
	"net/http"

	"github.com/chamoouske/finance-tracker/internal/service"
)

type balanceHandler struct {
	service service.BalanceService
}

func NewBalanceHandler(service service.BalanceService) *balanceHandler {
	return &balanceHandler{service: service}
}

func (h *balanceHandler) GetBalance(w http.ResponseWriter, r *http.Request) {
	balance, err := h.service.GetBalance(r.Context())
	if err != nil {
		respondError(w, 500, err.Error())
		return
	}

	if balance == nil {
		respondSuccess(w, 200, map[string]interface{}{
			"balance": nil,
		})
		return
	}

	respondSuccess(w, 200, map[string]interface{}{
		"balance": balance,
	})
}
