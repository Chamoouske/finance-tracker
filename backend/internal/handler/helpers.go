package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
)

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *APIError   `json:"error,omitempty"`
}

type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

var errorCodes = map[int]string{
	400: "INVALID_REQUEST",
	404: "NOT_FOUND",
	409: "CONFLICT",
	422: "VALIDATION_ERROR",
	500: "INTERNAL_ERROR",
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		if err := json.NewEncoder(w).Encode(data); err != nil {
			log.Printf("Error encoding response: %v", err)
		}
	}
}

func respondSuccess(w http.ResponseWriter, status int, data interface{}) {
	respondJSON(w, status, APIResponse{
		Success: true,
		Data:    data,
	})
}

func respondError(w http.ResponseWriter, status int, message string) {
	code := errorCodes[status]
	if code == "" {
		code = "INTERNAL_ERROR"
	}
	respondJSON(w, status, APIResponse{
		Success: false,
		Error: &APIError{
			Code:    code,
			Message: message,
		},
	})
}

func extractID(r *http.Request) (int64, error) {
	idStr := r.PathValue("id")
	if idStr == "" {
		parts := strings.Split(r.URL.Path, "/")
		for i, p := range parts {
			if p == "{id}" && i+1 < len(parts) {
				idStr = parts[i+1]
				break
			}
		}
	}
	return strconv.ParseInt(idStr, 10, 64)
}

func decodeJSON(r *http.Request, v interface{}) error {
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(v)
}
