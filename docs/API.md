# API REST — Sistema de Controle Financeiro Mensal

> **Base URL**: `http://localhost:8080/api`
> **Content-Type**: `application/json`

---

## Índice

1. [Transações](#1-transações)
   - [Criar Transação](#11-criar-transação)
   - [Listar Transações](#12-listar-transações)
   - [Atualizar Transação](#13-atualizar-transação)
   - [Excluir Transação](#14-excluir-transação)
2. [Categorias](#2-categorias)
   - [Listar Categorias](#21-listar-categorias)
   - [Criar Categoria](#22-criar-categoria)
   - [Atualizar Categoria](#23-atualizar-categoria)
3. [Períodos](#3-períodos)
   - [Listar Períodos](#31-listar-períodos)
   - [Fechar Período](#32-fechar-período)
4. [Summary](#4-summary)
   - [Obter Resumo Mensal](#41-obter-resumo-mensal)
5. [Tratamento de Erros](#5-tratamento-de-erros)
6. [Exemplos de Uso (curl)](#6-exemplos-de-uso-curl)
7. [Estrutura de Rotas (Go Router)](#7-estrutura-de-rotas-go-router)

---

## 1. Transações

### 1.1 Criar Transação

Cria um novo lançamento financeiro. O período é criado automaticamente ao inserir a primeira transação do mês.

**Endpoint**: `POST /api/transactions`

**Request Body**:

```json
{
  "category_id": 1,
  "date": "2026-05-10",
  "amount": 150000,
  "type": "expense",
  "note": "Aluguel referente a maio/2026"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `category_id` | integer | sim | ID da categoria |
| `date` | string | sim | Data ISO 8601 (YYYY-MM-DD) |
| `amount` | integer | sim | Valor em centavos (R$ 1.500,00 → 150000) |
| `type` | string | sim | `income`, `investment` ou `expense` |
| `note` | string | sim | Descrição/observação (mín. 1 caractere) |

**Response** `201 Created`:

```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": 42,
      "period_id": 5,
      "category_id": 1,
      "date": "2026-05-10",
      "amount": 150000,
      "type": "expense",
      "note": "Aluguel referente a maio/2026",
      "created_at": "2026-05-09T22:00:00Z",
      "updated_at": "2026-05-09T22:00:00Z",
      "category_name": "Aluguel",
      "period_label": "2026-05"
    },
    "summary": {
      "id": 1,
      "period_id": 5,
      "revenue_total": 0,
      "investment_total": 0,
      "fixed_expense_total": 150000,
      "variable_expense_total": 0,
      "extra_expense_total": 0,
      "additional_expense_total": 0,
      "balance": -150000,
      "created_at": "2026-05-09T22:00:00Z",
      "updated_at": "2026-05-09T22:00:00Z"
    }
  }
}
```

**Response** `422 Unprocessable Entity` (validação):

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "O campo 'note' é obrigatório e deve ter pelo menos 1 caractere"
  }
}
```

**Response** `422 Unprocessable Entity` (período fechado):

```json
{
  "success": false,
  "error": {
    "code": "PERIOD_CLOSED",
    "message": "O período 2026-05 já está fechado. Não é possível adicionar transações."
  }
}
```

---

### 1.2 Listar Transações

Retorna transações filtradas por período.

**Endpoint**: `GET /api/transactions?period=YYYY-MM`

**Query Parameters**:

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `period` | string | sim | Período no formato `YYYY-MM` |

**Response** `200 OK`:

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 42,
        "period_id": 5,
        "category_id": 1,
        "date": "2026-05-10",
        "amount": 150000,
        "type": "expense",
        "note": "Aluguel referente a maio/2026",
        "created_at": "2026-05-09T22:00:00Z",
        "updated_at": "2026-05-09T22:00:00Z",
        "category_name": "Aluguel",
        "period_label": "2026-05"
      },
      {
        "id": 43,
        "period_id": 5,
        "category_id": 2,
        "date": "2026-05-11",
        "amount": 45000,
        "type": "expense",
        "note": "Conta de luz",
        "created_at": "2026-05-10T08:30:00Z",
        "updated_at": "2026-05-10T08:30:00Z",
        "category_name": "Energia Elétrica",
        "period_label": "2026-05"
      }
    ],
    "total": 2,
    "period": "2026-05"
  }
}
```

**Response** `400 Bad Request` (período inválido):

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Formato de período inválido. Use YYYY-MM (ex: 2026-05)"
  }
}
```

---

### 1.3 Atualizar Transação

Atualiza parcialmente uma transação existente. O período é recalculado se a `date` for alterada.

**Endpoint**: `PATCH /api/transactions/:id`

**Request Body** (todos os campos são opcionais):

```json
{
  "type": "income",
  "category_id": 3,
  "amount": 160000,
  "date": "2026-05-15",
  "note": "Aluguel ajustado - maio/2026"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `type` | string | não | `income`, `investment` ou `expense` |
| `category_id` | integer | não | ID da categoria |
| `amount` | integer | não | Valor em centavos |
| `date` | string | não | Data ISO 8601 (YYYY-MM-DD) |
| `note` | string | não | Descrição/observação |

**Response** `200 OK`:

```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": 42,
      "period_id": 5,
      "category_id": 3,
      "date": "2026-05-15",
      "amount": 160000,
      "type": "income",
      "note": "Aluguel ajustado - maio/2026",
      "created_at": "2026-05-09T22:00:00Z",
      "updated_at": "2026-05-10T10:00:00Z",
      "category_name": "Aluguel + Condomínio",
      "period_label": "2026-05"
    },
    "summary": {
      "id": 1,
      "period_id": 5,
      "revenue_total": 160000,
      "investment_total": 0,
      "fixed_expense_total": 0,
      "variable_expense_total": 0,
      "extra_expense_total": 0,
      "additional_expense_total": 0,
      "balance": 160000,
      "created_at": "2026-05-09T22:00:00Z",
      "updated_at": "2026-05-10T10:00:00Z"
    }
  }
}
```

**Response** `404 Not Found`:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Transação com ID 999 não encontrada"
  }
}
```

**Response** `409 Conflict` (período fechado):

```json
{
  "success": false,
  "error": {
    "code": "PERIOD_CLOSED",
    "message": "O período 2026-05 já está fechado. Não é possível alterar transações."
  }
}
```

---

### 1.4 Excluir Transação

Remove uma transação e recalcula o summary do período.

**Endpoint**: `DELETE /api/transactions/:id`

**Response** `200 OK`:

```json
{
  "success": true,
  "data": {
    "message": "Transação excluída com sucesso",
    "summary": {
      "id": 1,
      "period_id": 5,
      "revenue_total": 0,
      "investment_total": 0,
      "fixed_expense_total": 0,
      "variable_expense_total": 0,
      "extra_expense_total": 0,
      "additional_expense_total": 0,
      "balance": 0,
      "created_at": "2026-05-09T22:00:00Z",
      "updated_at": "2026-05-10T10:00:00Z"
    }
  }
}
```

**Response** `404 Not Found`:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Transação com ID 999 não encontrada"
  }
}
```

**Response** `422 Unprocessable Entity` (período fechado):

```json
{
  "success": false,
  "error": {
    "code": "PERIOD_CLOSED",
    "message": "O período 2026-05 já está fechado. Não é possível excluir transações."
  }
}
```

---

## 2. Categorias

### 2.1 Listar Categorias

Retorna todas as categorias ativas e inativas, agrupadas por grupo.

**Endpoint**: `GET /api/categories`

**Response** `200 OK`:

```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "id": 1,
        "name": "Receitas",
        "type": "revenue",
        "sort_order": 1,
        "categories": [
          {
            "id": 1,
            "group_id": 1,
            "name": "Salário",
            "expense_type": null,
            "sort_order": 1,
            "active": true,
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z"
          },
          {
            "id": 2,
            "group_id": 1,
            "name": "Freelance",
            "expense_type": null,
            "sort_order": 2,
            "active": true,
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z"
          }
        ]
      },
      {
        "id": 2,
        "name": "Despesas Fixas",
        "type": "expense",
        "sort_order": 2,
        "categories": [
          {
            "id": 3,
            "group_id": 2,
            "name": "Aluguel",
            "expense_type": "fixed",
            "sort_order": 1,
            "active": true,
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z"
          }
        ]
      }
    ]
  }
}
```

---

### 2.2 Criar Categoria

Cria uma nova categoria dentro de um grupo existente.

**Endpoint**: `POST /api/categories`

**Request Body**:

```json
{
  "group_id": 2,
  "name": "Internet",
  "expense_type": "fixed",
  "sort_order": 3
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `group_id` | integer | sim | ID do grupo (deve existir) |
| `name` | string | sim | Nome da categoria |
| `expense_type` | string | condicional | `fixed`, `variable`, `extra`, `additional`. Obrigatório se o grupo for `expense` |
| `sort_order` | integer | não | Ordem de exibição (default: 0) |

**Response** `201 Created`:

```json
{
  "success": true,
  "data": {
    "id": 10,
    "group_id": 2,
    "name": "Internet",
    "expense_type": "fixed",
    "sort_order": 3,
    "active": true,
    "created_at": "2026-05-09T22:00:00Z",
    "updated_at": "2026-05-09T22:00:00Z"
  }
}
```

**Response** `400 Bad Request`:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "expense_type é obrigatório para categorias do tipo 'expense'"
  }
}
```

---

### 2.3 Atualizar Categoria

Atualiza parcialmente uma categoria.

**Endpoint**: `PATCH /api/categories/:id`

**Request Body**:

```json
{
  "name": "Internet Fibra",
  "active": false
}
```

**Response** `200 OK`:

```json
{
  "success": true,
  "data": {
    "id": 10,
    "group_id": 2,
    "name": "Internet Fibra",
    "expense_type": "fixed",
    "sort_order": 3,
    "active": false,
    "created_at": "2026-05-09T22:00:00Z",
    "updated_at": "2026-05-10T10:00:00Z"
  }
}
```

**Response** `404 Not Found`:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Categoria com ID 999 não encontrada"
  }
}
```

---

## 3. Períodos

### 3.1 Listar Períodos

Retorna todos os meses que possuem lançamentos, ordenados do mais recente para o mais antigo.

**Endpoint**: `GET /api/periods`

**Response** `200 OK`:

```json
{
  "success": true,
  "data": {
    "periods": [
      {
        "id": 5,
        "year": 2026,
        "month": 5,
        "label": "2026-05",
        "closed_at": null,
        "balance": 350000,
        "revenue_total": 500000,
        "investment_total": 0,
        "fixed_expense_total": 150000,
        "variable_expense_total": 0,
        "extra_expense_total": 0,
        "additional_expense_total": 0,
        "created_at": "2026-05-01T00:00:00Z",
        "updated_at": "2026-05-10T10:00:00Z"
      },
      {
        "id": 4,
        "year": 2026,
        "month": 4,
        "label": "2026-04",
        "closed_at": "2026-05-01T00:00:00Z",
        "balance": 270000,
        "revenue_total": 500000,
        "investment_total": 100000,
        "fixed_expense_total": 180000,
        "variable_expense_total": 100000,
        "extra_expense_total": 50000,
        "additional_expense_total": 0,
        "created_at": "2026-04-01T00:00:00Z",
        "updated_at": "2026-05-01T00:00:00Z"
      }
    ]
  }
}
```

---

### 3.2 Fechar Período

Fecha um período mensal, impedindo novas alterações. Todas as transações existentes são mantidas.

**Endpoint**: `POST /api/periods/close`

**Request Body**:

```json
{
  "year": 2026,
  "month": 4
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `year` | integer | sim | Ano (ex: 2026) |
| `month` | integer | sim | Mês (1-12) |

**Response** `200 OK`:

```json
{
  "success": true,
  "data": {
    "message": "Período fechado com sucesso",
    "period": {
      "id": 4,
      "year": 2026,
      "month": 4,
      "closed_at": "2026-05-09T22:00:00Z",
      "created_at": "2026-04-01T00:00:00Z",
      "updated_at": "2026-05-09T22:00:00Z"
    }
  }
}
```

**Response** `404 Not Found`:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Nenhuma transação encontrada para o período 2026-04. Crie ao menos uma transação antes de fechar o período."
  }
}
```

**Response** `409 Conflict`:

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "O período 2026-04 já está fechado desde 2026-05-01T00:00:00Z"
  }
}
```

---

## 4. Summary

### 4.1 Obter Resumo Mensal

Retorna o resumo financeiro consolidado de um mês específico.

**Endpoint**: `GET /api/summary?period=YYYY-MM`

**Query Parameters**:

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `period` | string | sim | Período no formato `YYYY-MM` |

**Response** `200 OK`:

```json
{
  "success": true,
  "data": {
    "summary": {
      "id": 1,
      "period_id": 5,
      "revenue_total": 500000,
      "investment_total": 200000,
      "fixed_expense_total": 150000,
      "variable_expense_total": 120000,
      "extra_expense_total": 40000,
      "additional_expense_total": 0,
      "balance": 390000,
      "created_at": "2026-05-01T00:00:00Z",
      "updated_at": "2026-05-10T10:00:00Z"
    },
    "period": "2026-05"
  }
}
```

**Regra de cálculo do balance**:

```
balance = revenue_total + investment_total - fixed_expense_total - variable_expense_total - extra_expense_total - additional_expense_total
```

**Response** `400 Bad Request` (período inválido):

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Formato de período inválido. Use YYYY-MM (ex: 2026-05)"
  }
}
```

**Response** `500 Internal Server Error`:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Erro ao buscar período: ..."
  }
}
```

---

## 5. Tratamento de Erros

Todos os endpoints seguem o mesmo formato de erro:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descrição legível do erro"
  }
}
```

### Códigos de Erro

| Código | HTTP Status | Significado |
|--------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | Erro de validação de campos (campos obrigatórios, formato incorreto) |
| `NOT_FOUND` | 404 | Recurso não encontrado |
| `CONFLICT` | 409 | Conflito (ex: período já fechado, duplicata) |
| `PERIOD_CLOSED` | 409 | Tentativa de modificar um período já fechado |
| `INVALID_REQUEST` | 400 | Requisição mal formatada (JSON inválido, parâmetros ausentes) |
| `INTERNAL_ERROR` | 500 | Erro interno do servidor |

### Validações por Campo

| Recurso | Campo | Validação |
|---------|-------|-----------|
| Transação | `date` | Formato ISO YYYY-MM-DD, data válida |
| Transação | `amount` | Deve ser positivo (> 0) |
| Transação | `type` | Deve ser `income`, `investment` ou `expense` |
| Transação | `note` | String não vazia (mín. 1 caractere) |
| Transação | `category_id` | Deve referenciar uma categoria ativa existente |
| Categoria | `name` | String não vazia, única por grupo |
| Categoria | `expense_type` | Obrigatório se group.type = `expense` |
| Período | `year` | Deve ser >= 2020 |
| Período | `month` | Deve estar entre 1 e 12 |
| Período | close | Período deve existir e ter transações |

---

## 6. Exemplos de Uso (curl)

### Cenários de Sucesso

#### Criar uma transação

```bash
curl -X POST http://localhost:8080/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": 1,
    "date": "2026-05-10",
    "amount": 500000,
    "type": "income",
    "note": "Salário maio/2026"
  }'
```

#### Listar transações do mês

```bash
curl "http://localhost:8080/api/transactions?period=2026-05"
```

#### Obter resumo do mês

```bash
curl "http://localhost:8080/api/summary?period=2026-05"
```

#### Fechar um mês

```bash
curl -X POST http://localhost:8080/api/periods/close \
  -H "Content-Type: application/json" \
  -d '{"year": 2026, "month": 4}'
```

### Cenários de Erro

#### 422 - Validação (campo obrigatório ausente)

```bash
curl -X POST http://localhost:8080/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": 1,
    "date": "2026-05-10",
    "amount": 500000,
    "type": "income"
  }'
```

Resposta esperada: `422 Unprocessable Entity`

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "O campo 'note' é obrigatório e deve ter pelo menos 1 caractere"
  }
}
```

#### 404 - Recurso não encontrado

```bash
curl -X PATCH http://localhost:8080/api/transactions/999 \
  -H "Content-Type: application/json" \
  -d '{"amount": 100000}'
```

Resposta esperada: `404 Not Found`

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Transação com ID 999 não encontrada"
  }
}
```

#### 409 - Período fechado

```bash
curl -X POST http://localhost:8080/api/periods/close \
  -H "Content-Type: application/json" \
  -d '{"year": 2026, "month": 4}'
```

Resposta esperada (se o período já estiver fechado): `409 Conflict`

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "O período 2026-04 já está fechado desde 2026-05-01T00:00:00Z"
  }
}
```

#### 500 - Erro interno do servidor

```bash
curl "http://localhost:8080/api/categories"
```

Em caso de falha no banco de dados, resposta: `500 Internal Server Error`

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Erro ao listar categorias: ..."
  }
}
```

---

## 7. Estrutura de Rotas (Go Router)

| Método | Path | Handler |
|--------|------|---------|
| `POST` | `/api/transactions` | `transaction_handler.Create` |
| `GET` | `/api/transactions` | `transaction_handler.List` |
| `PATCH` | `/api/transactions/{id}` | `transaction_handler.Update` |
| `DELETE` | `/api/transactions/{id}` | `transaction_handler.Delete` |
| `GET` | `/api/categories` | `category_handler.List` |
| `POST` | `/api/categories` | `category_handler.Create` |
| `PATCH` | `/api/categories/{id}` | `category_handler.Update` |
| `GET` | `/api/periods` | `period_handler.List` |
| `POST` | `/api/periods/close` | `period_handler.Close` |
| `GET` | `/api/summary` | `summary_handler.Get` |

No Go 1.22+, o `http.ServeMux` suporta pattern matching nativo:

```go
mux.HandleFunc("POST /api/transactions", h.transactionHandler.Create)
mux.HandleFunc("GET /api/transactions", h.transactionHandler.List)
mux.HandleFunc("PATCH /api/transactions/{id}", h.transactionHandler.Update)
mux.HandleFunc("DELETE /api/transactions/{id}", h.transactionHandler.Delete)
```

---

## Notas Importantes

- **Criação automática de períodos**: Períodos (meses) são criados automaticamente pelo backend ao inserir a primeira transação de um determinado mês/ano. Não existe um endpoint `POST /api/periods` para criação manual de períodos.
- **Valores monetários**: Todos os valores são expressos em **centavos** (int64). Exemplo: R$ 1.500,00 → `150000`.
- **Datas**: O formato de data utilizado é `YYYY-MM-DD` (ISO 8601).
- **Fechamento de período**: Uma vez que um período é fechado (`POST /api/periods/close`), nenhuma transação pode ser criada, alterada ou excluída naquele período.
