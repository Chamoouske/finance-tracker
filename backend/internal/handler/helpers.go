package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
)

// APIResponse represents a standardized API response.
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *APIError   `json:"error,omitempty"`
}

// APIError represents an API error.
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

var errorCodes = map[int]string{
	400: "validation_error",
	404: "not_found",
	409: "already_closed",
	422: "validation_error",
	500: "internal_error",
}

// respondJSON sends a JSON response.
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		if err := json.NewEncoder(w).Encode(data); err != nil {
			log.Printf("Error encoding response: %v", err)
		}
	}
}

// respondSuccess sends a success response.
func respondSuccess(w http.ResponseWriter, status int, data interface{}) {
	respondJSON(w, status, APIResponse{
		Success: true,
		Data:    data,
	})
}

// respondError sends an error response.
func respondError(w http.ResponseWriter, status int, message string) {
	code := errorCodes[status]
	if code == "" {
		code = "internal_error"
	}
	respondJSON(w, status, APIResponse{
		Success: false,
		Error: &APIError{
			Code:    code,
			Message: message,
		},
	})
}

// extractID extracts an ID from the path using the pattern {id}.
func extractID(r *http.Request) (int64, error) {
	idStr := r.PathValue("id")
	if idStr == "" {
		// Try to extract from path as fallback
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

// decodeJSON decodes JSON body into the given value.
func decodeJSON(r *http.Request, v interface{}) error {
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(v)
}
