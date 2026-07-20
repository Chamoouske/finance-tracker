package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/chamoouske/finance-tracker/internal/domain"
	"github.com/chamoouske/finance-tracker/internal/service"
)

const mcpProtocolVersion = "2025-06-18"

type mcpHandler struct {
	transactions service.TransactionService
	categories   service.CategoryService
	summaries    service.SummaryService
	balances     service.BalanceService
}

type mcpRequest struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      interface{}     `json:"id,omitempty"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params,omitempty"`
}

type mcpCallParams struct {
	Name      string                 `json:"name"`
	Arguments map[string]interface{} `json:"arguments"`
}

func NewMCPHandler(transactions service.TransactionService, categories service.CategoryService, summaries service.SummaryService, balances service.BalanceService) http.Handler {
	return &mcpHandler{transactions: transactions, categories: categories, summaries: summaries, balances: balances}
}

func (h *mcpHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	if !validMCPOrigin(r.Header.Get("Origin")) {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	var request mcpRequest
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&request); err != nil {
		h.protocolError(w, nil, -32700, "Parse error")
		return
	}
	if request.JSONRPC != "2.0" || request.Method == "" {
		h.protocolError(w, request.ID, -32600, "Invalid Request")
		return
	}

	switch request.Method {
	case "initialize":
		h.result(w, request.ID, map[string]interface{}{
			"protocolVersion": mcpProtocolVersion,
			"capabilities":    map[string]interface{}{"tools": map[string]bool{"listChanged": false}},
			"serverInfo":      map[string]string{"name": "finance-tracker", "version": "1.0.0"},
		})
	case "notifications/initialized":
		w.WriteHeader(http.StatusAccepted)
	case "ping":
		h.result(w, request.ID, map[string]interface{}{})
	case "tools/list":
		h.result(w, request.ID, map[string]interface{}{"tools": mcpTools()})
	case "tools/call":
		h.callTool(w, r, request)
	default:
		h.protocolError(w, request.ID, -32601, "Method not found")
	}
}

func validMCPOrigin(origin string) bool {
	return origin == "" || strings.HasPrefix(origin, "http://localhost") || strings.HasPrefix(origin, "http://127.0.0.1")
}

func (h *mcpHandler) callTool(w http.ResponseWriter, r *http.Request, request mcpRequest) {
	var params mcpCallParams
	if err := json.Unmarshal(request.Params, &params); err != nil || params.Name == "" {
		h.protocolError(w, request.ID, -32602, "Invalid tool parameters")
		return
	}

	var value interface{}
	var err error
	switch params.Name {
	case "list_transactions":
		period, ok := stringArgument(params.Arguments, "period")
		if !ok {
			h.toolError(w, request.ID, "period is required")
			return
		}
		value, err = h.transactions.List(period)
	case "list_categories":
		value, err = h.categories.List()
	case "get_summary":
		period, ok := stringArgument(params.Arguments, "period")
		if !ok {
			h.toolError(w, request.ID, "period is required")
			return
		}
		value, err = h.summaries.GetByPeriod(period)
	case "get_balance":
		value, err = h.balances.GetBalance(r.Context())
	case "create_transaction":
		transaction, decodeErr := transactionFromArguments(params.Arguments)
		if decodeErr != nil {
			h.toolError(w, request.ID, decodeErr.Error())
			return
		}
		var summary *domain.MonthlySummary
		value, summary, err = h.transactions.Create(transaction)
		if err == nil {
			value = map[string]interface{}{"transaction": value, "summary": summary}
		}
	default:
		h.protocolError(w, request.ID, -32602, "Unknown tool: "+params.Name)
		return
	}
	if err != nil {
		h.toolError(w, request.ID, err.Error())
		return
	}
	h.toolResult(w, request.ID, value)
}

func stringArgument(arguments map[string]interface{}, name string) (string, bool) {
	value, ok := arguments[name].(string)
	return value, ok && strings.TrimSpace(value) != ""
}

func transactionFromArguments(arguments map[string]interface{}) (*domain.Transaction, error) {
	categoryID, categoryOK := arguments["categoryId"].(float64)
	date, dateOK := arguments["date"].(string)
	amount, amountOK := arguments["amount"].(float64)
	typeName, typeOK := arguments["type"].(string)
	note, noteOK := arguments["note"].(string)
	if !categoryOK || categoryID <= 0 || !dateOK || date == "" || !amountOK || amount <= 0 || !typeOK || typeName == "" || !noteOK || strings.TrimSpace(note) == "" {
		return nil, fmt.Errorf("categoryId, date, amount, type and note are required")
	}
	return &domain.Transaction{CategoryID: int64(categoryID), Date: date, Amount: int64(amount), Type: domain.TransactionType(typeName), Note: note}, nil
}

func (h *mcpHandler) result(w http.ResponseWriter, id interface{}, result interface{}) {
	respondJSON(w, http.StatusOK, map[string]interface{}{"jsonrpc": "2.0", "id": id, "result": result})
}

func (h *mcpHandler) protocolError(w http.ResponseWriter, id interface{}, code int, message string) {
	respondJSON(w, http.StatusOK, map[string]interface{}{"jsonrpc": "2.0", "id": id, "error": map[string]interface{}{"code": code, "message": message}})
}

func (h *mcpHandler) toolResult(w http.ResponseWriter, id interface{}, value interface{}) {
	data, _ := json.Marshal(value)
	h.result(w, id, map[string]interface{}{"content": []map[string]string{{"type": "text", "text": string(data)}}, "structuredContent": map[string]interface{}{"data": value}, "isError": false})
}

func (h *mcpHandler) toolError(w http.ResponseWriter, id interface{}, message string) {
	h.result(w, id, map[string]interface{}{"content": []map[string]string{{"type": "text", "text": message}}, "isError": true})
}

func mcpTools() []map[string]interface{} {
	periodSchema := map[string]interface{}{"type": "object", "properties": map[string]interface{}{"period": map[string]string{"type": "string", "pattern": "^\\d{4}-(0[1-9]|1[0-2])$"}}, "required": []string{"period"}}
	emptySchema := map[string]interface{}{"type": "object", "properties": map[string]interface{}{}}
	return []map[string]interface{}{
		{"name": "list_transactions", "description": "Lista transações de um período mensal", "inputSchema": periodSchema},
		{"name": "list_categories", "description": "Lista grupos e categorias", "inputSchema": emptySchema},
		{"name": "get_summary", "description": "Obtém o resumo financeiro mensal", "inputSchema": periodSchema},
		{"name": "get_balance", "description": "Obtém o balanço consolidado", "inputSchema": emptySchema},
		{"name": "create_transaction", "description": "Cria uma transação financeira", "inputSchema": map[string]interface{}{"type": "object", "properties": map[string]interface{}{"categoryId": map[string]string{"type": "integer"}, "date": map[string]string{"type": "string", "format": "date"}, "amount": map[string]string{"type": "integer"}, "type": map[string]interface{}{"type": "string", "enum": []string{"income", "investment", "expense"}}, "note": map[string]string{"type": "string"}}, "required": []string{"categoryId", "date", "amount", "type", "note"}}},
	}
}
