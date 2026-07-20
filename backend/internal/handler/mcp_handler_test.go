package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/chamoouske/finance-tracker/internal/domain"
)

type mcpTransactionServiceStub struct {
	listResult []*domain.Transaction
	listErr    error
	created    *domain.Transaction
	createErr  error
}

func (s *mcpTransactionServiceStub) Create(t *domain.Transaction) (*domain.Transaction, *domain.MonthlySummary, error) {
	s.created = t
	return t, &domain.MonthlySummary{}, s.createErr
}
func (s *mcpTransactionServiceStub) List(string) ([]*domain.Transaction, error) {
	return s.listResult, s.listErr
}
func (s *mcpTransactionServiceStub) Update(int64, map[string]interface{}) (*domain.Transaction, *domain.MonthlySummary, error) {
	return nil, nil, nil
}
func (s *mcpTransactionServiceStub) Delete(int64) (*domain.MonthlySummary, error) { return nil, nil }

type mcpCategoryServiceStub struct {
	groups []*domain.CategoryGroup
	err    error
}

func (s *mcpCategoryServiceStub) List() ([]*domain.CategoryGroup, error)   { return s.groups, s.err }
func (s *mcpCategoryServiceStub) Create(*domain.Category) error            { return nil }
func (s *mcpCategoryServiceStub) Update(*domain.Category) error            { return nil }
func (s *mcpCategoryServiceStub) Delete(int64) error                       { return nil }
func (s *mcpCategoryServiceStub) FindByID(int64) (*domain.Category, error) { return nil, nil }

type mcpSummaryServiceStub struct {
	summary *domain.MonthlySummary
	err     error
}

func (s *mcpSummaryServiceStub) GetByPeriod(string) (*domain.MonthlySummary, error) {
	return s.summary, s.err
}

type mcpBalanceServiceStub struct {
	snapshot *domain.BalanceSnapshot
	err      error
}

func (s *mcpBalanceServiceStub) GetBalance(context.Context) (*domain.BalanceSnapshot, error) {
	return s.snapshot, s.err
}
func (s *mcpBalanceServiceStub) RecalculateAll(context.Context) error { return nil }

func newMCPTestHandler(tx *mcpTransactionServiceStub) http.Handler {
	return NewMCPHandler(tx, &mcpCategoryServiceStub{}, &mcpSummaryServiceStub{}, &mcpBalanceServiceStub{})
}

func callMCP(t *testing.T, h http.Handler, body string) (int, map[string]interface{}) {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, "/mcp", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json, text/event-stream")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	var response map[string]interface{}
	if rec.Body.Len() > 0 && json.Unmarshal(rec.Body.Bytes(), &response) != nil {
		t.Fatalf("invalid JSON: %s", rec.Body.String())
	}
	return rec.Code, response
}

func TestMCPInitializeAndListTools(t *testing.T) {
	h := newMCPTestHandler(&mcpTransactionServiceStub{})
	status, response := callMCP(t, h, `{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18"}}`)
	if status != http.StatusOK || response["result"] == nil {
		t.Fatalf("initialize failed: %d %#v", status, response)
	}
	_, response = callMCP(t, h, `{"jsonrpc":"2.0","id":2,"method":"tools/list"}`)
	result := response["result"].(map[string]interface{})
	if len(result["tools"].([]interface{})) != 5 {
		t.Fatalf("expected five tools: %#v", result)
	}
}

func TestMCPRejectsInvalidRequests(t *testing.T) {
	h := newMCPTestHandler(&mcpTransactionServiceStub{})
	tests := []string{`{`, `{"jsonrpc":"1.0","id":1,"method":"tools/list"}`, `{"jsonrpc":"2.0","id":1,"method":"unknown"}`}
	for _, body := range tests {
		_, response := callMCP(t, h, body)
		if response["error"] == nil {
			t.Fatalf("expected protocol error for %s", body)
		}
	}
}

func TestMCPListTransactionsAndCreateTransaction(t *testing.T) {
	tx := &mcpTransactionServiceStub{listResult: []*domain.Transaction{{ID: 1, Note: "Salário"}}}
	h := newMCPTestHandler(tx)
	_, response := callMCP(t, h, `{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_transactions","arguments":{"period":"2026-07"}}}`)
	if response["result"].(map[string]interface{})["isError"] == true {
		t.Fatalf("list failed: %#v", response)
	}
	_, response = callMCP(t, h, `{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"create_transaction","arguments":{"categoryId":1,"date":"2026-07-20","amount":1000,"type":"income","note":"Salário"}}}`)
	if tx.created == nil || tx.created.Amount != 1000 {
		t.Fatalf("create was not delegated: %#v %#v", tx.created, response)
	}
}

func TestMCPToolErrorsAreReturnedAsToolResults(t *testing.T) {
	tx := &mcpTransactionServiceStub{listErr: errors.New("database unavailable"), createErr: errors.New("invalid transaction")}
	h := newMCPTestHandler(tx)
	for _, body := range []string{
		`{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_transactions","arguments":{}}}`,
		`{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_transactions","arguments":{"period":"2026-07"}}}`,
		`{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"create_transaction","arguments":{}}}`,
	} {
		_, response := callMCP(t, h, body)
		result, ok := response["result"].(map[string]interface{})
		if !ok || result["isError"] != true {
			t.Fatalf("expected tool error: %#v", response)
		}
	}
	_, response := callMCP(t, h, `{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"missing","arguments":{}}}`)
	if response["error"] == nil {
		t.Fatalf("unknown tool must be a protocol error")
	}
}

func TestMCPTransportAndLifecycleBranches(t *testing.T) {
	h := newMCPTestHandler(&mcpTransactionServiceStub{})

	req := httptest.NewRequest(http.MethodGet, "/mcp", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("GET status = %d", rec.Code)
	}

	req = httptest.NewRequest(http.MethodPost, "/mcp", bytes.NewBufferString(`{"jsonrpc":"2.0","id":1,"method":"ping"}`))
	req.Header.Set("Origin", "https://evil.example")
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("origin status = %d", rec.Code)
	}

	for _, body := range []string{
		`{"jsonrpc":"2.0","id":1,"method":"ping"}`,
		`{"jsonrpc":"2.0","method":"notifications/initialized"}`,
		`{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{}}`,
	} {
		status, _ := callMCP(t, h, body)
		if status != http.StatusOK && status != http.StatusAccepted {
			t.Fatalf("lifecycle status = %d", status)
		}
	}
	if !validMCPOrigin("http://localhost:4200") || !validMCPOrigin("http://127.0.0.1:3000") || validMCPOrigin("https://example.com") {
		t.Fatal("origin validation branches are incorrect")
	}
}

func TestMCPReadToolsSuccessAndFailure(t *testing.T) {
	tx := &mcpTransactionServiceStub{}
	categories := &mcpCategoryServiceStub{groups: []*domain.CategoryGroup{{ID: 1}}}
	summaries := &mcpSummaryServiceStub{summary: &domain.MonthlySummary{Balance: 100}}
	balances := &mcpBalanceServiceStub{snapshot: &domain.BalanceSnapshot{TotalBalance: 100}}
	h := NewMCPHandler(tx, categories, summaries, balances)

	for _, body := range []string{
		`{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_categories","arguments":{}}}`,
		`{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_summary","arguments":{"period":"2026-07"}}}`,
		`{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_balance","arguments":{}}}`,
	} {
		_, response := callMCP(t, h, body)
		if response["result"].(map[string]interface{})["isError"] != false {
			t.Fatalf("read tool failed: %#v", response)
		}
	}

	categories.err = errors.New("categories failed")
	summaries.err = errors.New("summary failed")
	balances.err = errors.New("balance failed")
	for _, body := range []string{
		`{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"list_categories","arguments":{}}}`,
		`{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"get_summary","arguments":{"period":"2026-07"}}}`,
		`{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"get_balance","arguments":{}}}`,
		`{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"get_summary","arguments":{}}}`,
	} {
		_, response := callMCP(t, h, body)
		if response["result"].(map[string]interface{})["isError"] != true {
			t.Fatalf("expected read error: %#v", response)
		}
	}
}

func TestTransactionFromArgumentsDecisionBranches(t *testing.T) {
	valid := map[string]interface{}{"categoryId": float64(1), "date": "2026-07-20", "amount": float64(100), "type": "income", "note": "ok"}
	if _, err := transactionFromArguments(valid); err != nil {
		t.Fatalf("valid arguments: %v", err)
	}
	for _, key := range []string{"categoryId", "date", "amount", "type", "note"} {
		invalid := map[string]interface{}{}
		for k, value := range valid {
			invalid[k] = value
		}
		delete(invalid, key)
		if _, err := transactionFromArguments(invalid); err == nil {
			t.Fatalf("missing %s should fail", key)
		}
	}
}
