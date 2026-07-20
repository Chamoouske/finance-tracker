# API REST — Sistema de Controle Financeiro Mensal

> **Base URL**: `http://localhost:8080/api`
> **Content-Type**: `application/json`

> **Convenção JSON**: requests e responses usam `camelCase`. A única exceção é o objeto
> `BalanceSnapshot` de `GET /api/balance`, que preserva `snake_case` por corresponder
> diretamente à tabela materializada.
>
> A integração Model Context Protocol usa o endpoint `POST /mcp`, fora do prefixo `/api`.
> Consulte [`MCP.md`](MCP.md) para inicialização, descoberta e chamadas de ferramentas.

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
5. [Balanço](#5-balanço)
   - [Obter Snapshot do Balanço](#51-obter-snapshot-do-balanço)
6. [Tratamento de Erros](#6-tratamento-de-erros)
7. [Exemplos de Uso (curl)](#7-exemplos-de-uso-curl)
8. [Estrutura de Rotas (Go Router)](#8-estrutura-de-rotas-go-router)

---

## 1. Transações

### 1.1 Criar Transação

Cria um novo lançamento financeiro. O período é criado automaticamente ao inserir a primeira transação do mês.

**Endpoint**: `POST /api/transactions`

**Request Body**:

```json
{
  "categoryId": 1,
  "date": "2026-05-10",
  "amount": 150000,
  "type": "expense",
  "note": "Aluguel referente a maio/2026"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `categoryId` | integer | sim | ID da categoria |
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
      "periodId": 5,
      "categoryId": 1,
      "date": "2026-05-10",
      "amount": 150000,
      "type": "expense",
      "note": "Aluguel referente a maio/2026",
      "createdAt": "2026-05-09T22:00:00Z",
      "updatedAt": "2026-05-09T22:00:00Z",
      "categoryName": "Aluguel",
      "periodLabel": "2026-05"
    },
    "summary": {
      "id": 1,
      "periodId": 5,
      "revenueTotal": 0,
      "investmentTotal": 0,
      "fixedExpenseTotal": 150000,
      "variableExpenseTotal": 0,
      "extraExpenseTotal": 0,
      "additionalExpenseTotal": 0,
      "balance": -150000,
      "createdAt": "2026-05-09T22:00:00Z",
      "updatedAt": "2026-05-09T22:00:00Z"
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
        "periodId": 5,
        "categoryId": 1,
        "date": "2026-05-10",
        "amount": 150000,
        "type": "expense",
        "note": "Aluguel referente a maio/2026",
        "createdAt": "2026-05-09T22:00:00Z",
        "updatedAt": "2026-05-09T22:00:00Z",
        "categoryName": "Aluguel",
        "periodLabel": "2026-05"
      },
      {
        "id": 43,
        "periodId": 5,
        "categoryId": 2,
        "date": "2026-05-11",
        "amount": 45000,
        "type": "expense",
        "note": "Conta de luz",
        "createdAt": "2026-05-10T08:30:00Z",
        "updatedAt": "2026-05-10T08:30:00Z",
        "categoryName": "Energia Elétrica",
        "periodLabel": "2026-05"
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
  "categoryId": 3,
  "amount": 160000,
  "date": "2026-05-15",
  "note": "Aluguel ajustado - maio/2026"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `type` | string | não | `income`, `investment` ou `expense` |
| `categoryId` | integer | não | ID da categoria |
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
      "periodId": 5,
      "categoryId": 3,
      "date": "2026-05-15",
      "amount": 160000,
      "type": "income",
      "note": "Aluguel ajustado - maio/2026",
      "createdAt": "2026-05-09T22:00:00Z",
      "updatedAt": "2026-05-10T10:00:00Z",
      "categoryName": "Aluguel + Condomínio",
      "periodLabel": "2026-05"
    },
    "summary": {
      "id": 1,
      "periodId": 5,
      "revenueTotal": 160000,
      "investmentTotal": 0,
      "fixedExpenseTotal": 0,
      "variableExpenseTotal": 0,
      "extraExpenseTotal": 0,
      "additionalExpenseTotal": 0,
      "balance": 160000,
      "createdAt": "2026-05-09T22:00:00Z",
      "updatedAt": "2026-05-10T10:00:00Z"
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
      "periodId": 5,
      "revenueTotal": 0,
      "investmentTotal": 0,
      "fixedExpenseTotal": 0,
      "variableExpenseTotal": 0,
      "extraExpenseTotal": 0,
      "additionalExpenseTotal": 0,
      "balance": 0,
      "createdAt": "2026-05-09T22:00:00Z",
      "updatedAt": "2026-05-10T10:00:00Z"
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
        "sortOrder": 1,
        "categories": [
          {
            "id": 1,
            "groupId": 1,
            "name": "Salário",
            "expenseType": null,
            "sortOrder": 1,
            "active": true,
            "createdAt": "2026-01-01T00:00:00Z",
            "updatedAt": "2026-01-01T00:00:00Z"
          },
          {
            "id": 2,
            "groupId": 1,
            "name": "Freelance",
            "expenseType": null,
            "sortOrder": 2,
            "active": true,
            "createdAt": "2026-01-01T00:00:00Z",
            "updatedAt": "2026-01-01T00:00:00Z"
          }
        ]
      },
      {
        "id": 2,
        "name": "Despesas Fixas",
        "type": "expense",
        "sortOrder": 2,
        "categories": [
          {
            "id": 3,
            "groupId": 2,
            "name": "Aluguel",
            "expenseType": "fixed",
            "sortOrder": 1,
            "active": true,
            "createdAt": "2026-01-01T00:00:00Z",
            "updatedAt": "2026-01-01T00:00:00Z"
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
  "groupId": 2,
  "name": "Internet",
  "expenseType": "fixed",
  "sortOrder": 3
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `groupId` | integer | sim | ID do grupo (deve existir) |
| `name` | string | sim | Nome da categoria |
| `expenseType` | string | condicional | `fixed`, `variable`, `extra`, `additional`. Obrigatório se o grupo for `expense` |
| `sortOrder` | integer | não | Ordem de exibição (default: 0) |

**Response** `201 Created`:

```json
{
  "success": true,
  "data": {
    "id": 10,
    "groupId": 2,
    "name": "Internet",
    "expenseType": "fixed",
    "sortOrder": 3,
    "active": true,
    "createdAt": "2026-05-09T22:00:00Z",
    "updatedAt": "2026-05-09T22:00:00Z"
  }
}
```

**Response** `400 Bad Request`:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "expenseType é obrigatório para categorias do tipo 'expense'"
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
    "groupId": 2,
    "name": "Internet Fibra",
    "expenseType": "fixed",
    "sortOrder": 3,
    "active": false,
    "createdAt": "2026-05-09T22:00:00Z",
    "updatedAt": "2026-05-10T10:00:00Z"
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

### 2.4 Excluir Categoria

Exclui uma categoria existente. A exclusão é recusada quando ainda existem transações vinculadas.

**Endpoint**: `DELETE /api/categories/:id`

**Response** `200 OK`:

```json
{
  "success": true,
  "data": { "message": "Categoria excluída com sucesso" }
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
        "closedAt": null,
        "balance": 350000,
        "revenueTotal": 500000,
        "investmentTotal": 0,
        "fixedExpenseTotal": 150000,
        "variableExpenseTotal": 0,
        "extraExpenseTotal": 0,
        "additionalExpenseTotal": 0,
        "createdAt": "2026-05-01T00:00:00Z",
        "updatedAt": "2026-05-10T10:00:00Z"
      },
      {
        "id": 4,
        "year": 2026,
        "month": 4,
        "label": "2026-04",
        "closedAt": "2026-05-01T00:00:00Z",
        "balance": 270000,
        "revenueTotal": 500000,
        "investmentTotal": 100000,
        "fixedExpenseTotal": 180000,
        "variableExpenseTotal": 100000,
        "extraExpenseTotal": 50000,
        "additionalExpenseTotal": 0,
        "createdAt": "2026-04-01T00:00:00Z",
        "updatedAt": "2026-05-01T00:00:00Z"
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
      "closedAt": "2026-05-09T22:00:00Z",
      "createdAt": "2026-04-01T00:00:00Z",
      "updatedAt": "2026-05-09T22:00:00Z"
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
      "periodId": 5,
      "revenueTotal": 500000,
      "investmentTotal": 200000,
      "fixedExpenseTotal": 150000,
      "variableExpenseTotal": 120000,
      "extraExpenseTotal": 40000,
      "additionalExpenseTotal": 0,
      "balance": 390000,
      "createdAt": "2026-05-01T00:00:00Z",
      "updatedAt": "2026-05-10T10:00:00Z"
    },
    "period": "2026-05"
  }
}
```

**Regra de cálculo do balance**:

```
balance = revenueTotal + investmentTotal - fixedExpenseTotal - variableExpenseTotal - extraExpenseTotal - additionalExpenseTotal
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

## 5. Balanço

### 5.1 Obter Snapshot do Balanço

Retorna o snapshot atual do balanço geral (soma agregada de todos os períodos).

**Endpoint:** `GET /api/balance`

**Response** `200 OK`:

```json
{
  "success": true,
  "data": {
    "balance": {
      "id": "0194f2d1-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "total_balance": 15000.00,
      "total_income": 50000.00,
      "total_expense": 35000.00,
      "total_credit": 20000.00,
      "total_debit": 15000.00,
      "month_count": 12,
      "calculated_at": "2026-05-12T10:00:00-03:00",
      "created_at": "2026-05-12T10:00:00-03:00"
    }
  }
}
```

**Campos do `balance`:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string (UUID) | UUID do snapshot (PostgreSQL) ou ID auto-increment (SQLite) |
| `total_balance` | number | Balanço geral (total_income - total_expense) |
| `total_income` | number | Soma total de receitas + investimentos |
| `total_expense` | number | Soma total de despesas (fixas + variáveis + extras + adicionais) |
| `total_credit` | number | Soma total de crédito (reservado, atualmente 0) |
| `total_debit` | number | Soma total de débito (reservado, atualmente 0) |
| `month_count` | integer | Quantidade de meses considerados no cálculo |
| `calculated_at` | string | Data/hora do último cálculo (ISO 8601) |
| `created_at` | string | Data/hora de criação do registro (ISO 8601) |

**Response** `500 Internal Server Error`:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "get latest balance snapshot: ..."
  }
}
```

---

## 6. Tratamento de Erros

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
| Transação | `categoryId` | Deve referenciar uma categoria ativa existente |
| Categoria | `name` | String não vazia, única por grupo |
| Categoria | `expenseType` | Obrigatório se group.type = `expense` |
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
    "categoryId": 1,
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

#### Obter snapshot do balanço geral

```bash
curl "http://localhost:8080/api/balance"
```

Resposta esperada: `200 OK`

```json
{
  "success": true,
  "data": {
    "balance": {
      "id": "1",
      "total_balance": 380000.00,
      "total_income": 500000.00,
      "total_expense": 120000.00,
      "total_credit": 0,
      "total_debit": 0,
      "month_count": 1,
      "calculated_at": "2026-05-12T10:00:00Z",
      "created_at": "2026-05-12T10:00:00Z"
    }
  }
}
```

### Cenários de Erro

#### 422 - Validação (campo obrigatório ausente)

```bash
curl -X POST http://localhost:8080/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": 1,
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
| `DELETE` | `/api/categories/{id}` | `category_handler.Delete` |
| `GET` | `/api/periods` | `period_handler.List` |
| `POST` | `/api/periods/close` | `period_handler.Close` |
| `GET` | `/api/summary` | `summary_handler.Get` |
| `GET` | `/api/balance` | `balance_handler.GetBalance` |
| `GET` | `/api/health` | inline (health check) |

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
- **Valores monetários**: Todos os valores são expressos em **centavos** (int64) nas tabelas `transactions` e `monthly_summaries`. Exemplo: R$ 1.500,00 → `150000`. No snapshot `balance_snapshots`, os valores são `REAL`/`NUMERIC` (float).
- **Datas**: O formato de data utilizado é `YYYY-MM-DD` (ISO 8601).
- **Fechamento de período**: Uma vez que um período é fechado (`POST /api/periods/close`), nenhuma transação pode ser criada, alterada ou excluída naquele período.
