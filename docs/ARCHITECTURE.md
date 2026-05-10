# Arquitetura do Sistema de Controle Financeiro Mensal

> **Visão Geral**: Aplicação web single-user para substituir planilha de controle financeiro mensal, com categorias configuráveis, observações em lançamentos e totais automáticos.

---

## 1. Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | Angular (Standalone Components) + TypeScript | 17+ |
| Estilização | Tailwind CSS | 3.x |
| Formulários | Reactive Forms (nativo) | — |
| HTTP | Angular HttpClient | — |
| Backend | Go (Golang) | 1.22+ |
| Database | SQLite (dev) / PostgreSQL (produção) | 3.x / 16+ |
| MCP | Model Context Protocol | 1.x |

---

## 2. Estrutura de Diretórios

```
finance-tracker/
│
├── backend/                          # API REST em Go
│   ├── cmd/
│   │   └── server/
│   │       └── main.go               # Entry point, wire dependencies, rotas, CORS
│   │
│   ├── internal/
│   │   ├── domain/                   # Entidades e interfaces (Clean Architecture)
│   │   │   ├── period.go
│   │   │   ├── category.go           # CategoryGroup + Category
│   │   │   ├── transaction.go
│   │   │   └── summary.go
│   │   │
│   │   ├── repository/               # Implementação SQLite/PostgreSQL das interfaces
│   │   │   ├── helpers.go            # parseTime, formatTime
│   │   │   ├── category_repo.go      # CategoryRepository + implementação
│   │   │   ├── period_repo.go        # PeriodRepository + implementação
│   │   │   ├── transaction_repo.go   # TransactionRepository + implementação
│   │   │   └── summary_repo.go       # SummaryRepository + implementação
│   │   │
│   │   ├── service/                  # Lógica de negócio
│   │   │   ├── transaction_service.go
│   │   │   ├── category_service.go
│   │   │   ├── period_service.go
│   │   │   └── summary_service.go
│   │   │
│   │   └── handler/                  # Handlers HTTP (controllers)
│   │       ├── helpers.go            # respondJSON, respondSuccess, respondError
│   │       ├── transaction_handler.go
│   │       ├── category_handler.go
│   │       ├── period_handler.go
│   │       └── summary_handler.go
│   │
│   ├── migrations/
│   │   ├── 001_initial.sql           # Schema SQLite
│   │   └── 001_initial.postgres.sql  # Schema PostgreSQL
│   │
│   ├── seeds/
│   │   ├── categories.sql            # Categorias padrão (SQLite)
│   │   └── categories.postgres.sql   # Categorias padrão (PostgreSQL)
│   │
│   ├── data/                         # Banco SQLite (gerado em runtime)
│   │   └── finance.db
│   │
│   ├── go.mod
│   └── go.sum
│
├── frontend/                         # Aplicação Angular
│   ├── src/
│   │   ├── index.html                # HTML entry point
│   │   ├── main.ts                   # Bootstrap do Angular
│   │   ├── styles.scss               # Diretivas Tailwind + estilos globais
│   │   │
│   │   └── app/
│   │       ├── app.config.ts         # Configuração do Angular (providers)
│   │       ├── app.routes.ts         # Rotas com lazy loading
│   │       ├── app.ts                # Root component standalone
│   │       ├── app.html              # Template root
│   │       │
│   │       ├── core/                 # Singleton, services, interfaces
│   │       │   ├── interfaces/       # Interfaces TypeScript
│   │       │   │   ├── api.interface.ts
│   │       │   │   ├── category.interface.ts
│   │       │   │   ├── transaction.interface.ts
│   │       │   │   ├── period.interface.ts
│   │       │   │   ├── summary.interface.ts
│   │       │   │   └── index.ts
│   │       │   │
│   │       │   ├── services/         # Serviços HTTP + estado
│   │       │   │   ├── base-api.service.ts          # Classe abstrata base
│   │       │   │   ├── category.service.ts
│   │       │   │   ├── transaction.service.ts
│   │       │   │   ├── period.service.ts
│   │       │   │   ├── summary.service.ts
│   │       │   │   ├── period-navigation.service.ts # BehaviorSubject
│   │       │   │   └── index.ts
│   │       │   │
│   │       │   ├── interceptors/     # Interceptores HTTP funcionais
│   │       │   │   └── api-error.interceptor.ts
│   │       │   │
│   │       │   ├── layouts/          # Layouts compartilhados
│   │       │   │   └── main-layout.ts
│   │       │   │
│   │       │   └── utils/            # Utilitários
│   │       │       ├── currency.utils.ts
│   │       │       ├── date.utils.ts
│   │       │       └── index.ts
│   │       │
│   │       ├── features/             # Módulos de funcionalidade (lazy)
│   │       │   ├── dashboard/
│   │       │   │   └── dashboard.ts
│   │       │   ├── transactions/
│   │       │   │   ├── transaction-form.ts
│   │       │   │   └── transactions-list.ts
│   │       │   ├── categories/
│   │       │   │   └── categories.ts
│   │       │   └── periods/
│   │       │       └── periods.ts
│   │       │
│   │       └── shared/               # Componentes reutilizáveis
│   │           ├── components/
│   │           │   ├── confirm-dialog.ts
│   │           │   ├── empty-state.ts
│   │           │   ├── error-alert.ts
│   │           │   ├── loading-spinner.ts
│   │           │   └── page-header.ts
│   │           └── pipes/
│   │               └── currency.pipe.ts
│   │
│   ├── angular.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── proxy.conf.json              # Proxy dev para backend
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── package.json
│   ├── Dockerfile
│   └── docker-entrypoint.sh
│
├── docs/
│   ├── ARCHITECTURE.md              # Este documento
│   ├── API.md                       # Especificação da API
│   ├── frontend-architecture-angular.md
│   └── VALIDATION.md
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 3. Database Schema

### 3.1 Diagrama ER

```mermaid
erDiagram
    periods ||--o{ transactions : contains
    periods ||--o{ monthly_summaries : summarizes
    category_groups ||--o{ categories : groups
    categories ||--o{ transactions : categorizes

    periods {
        id INTEGER PK
        year INTEGER "NOT NULL"
        month INTEGER "NOT NULL 1-12"
        closed_at TEXT "NULL se aberto"
        created_at TEXT "DEFAULT CURRENT_TIMESTAMP"
        updated_at TEXT "DEFAULT CURRENT_TIMESTAMP"
        UNIQUE(year, month)
    }

    category_groups {
        id INTEGER PK
        name TEXT "NOT NULL ex: Receitas"
        type TEXT "NOT NULL revenue|investment|expense"
        sort_order INTEGER "NOT NULL DEFAULT 0"
        created_at TEXT "DEFAULT CURRENT_TIMESTAMP"
        categories "[]Category (opcional, carregado em memória)"
    }

    categories {
        id INTEGER PK
        group_id INTEGER FK "NOT NULL"
        name TEXT "NOT NULL"
        expense_type TEXT "NULL|fixed|variable|extra|additional"
        sort_order INTEGER "NOT NULL DEFAULT 0"
        active INTEGER "NOT NULL DEFAULT 1"
        created_at TEXT "DEFAULT CURRENT_TIMESTAMP"
        updated_at TEXT "DEFAULT CURRENT_TIMESTAMP"
        FOREIGN KEY group_id REFERENCES category_groups(id)
    }

    transactions {
        id INTEGER PK
        period_id INTEGER FK "NOT NULL"
        category_id INTEGER FK "NOT NULL"
        date TEXT "NOT NULL ISO YYYY-MM-DD"
        amount INTEGER "NOT NULL em centavos"
        type TEXT "NOT NULL income|investment|expense"
        note TEXT "NOT NULL DEFAULT ''"
        created_at TEXT "DEFAULT CURRENT_TIMESTAMP"
        updated_at TEXT "DEFAULT CURRENT_TIMESTAMP"
        FOREIGN KEY period_id REFERENCES periods(id)
        FOREIGN KEY category_id REFERENCES categories(id)
    }

    monthly_summaries {
        id INTEGER PK
        period_id INTEGER FK "NOT NULL UNIQUE"
        revenue_total INTEGER "NOT NULL DEFAULT 0"
        investment_total INTEGER "NOT NULL DEFAULT 0"
        fixed_expense_total INTEGER "NOT NULL DEFAULT 0"
        variable_expense_total INTEGER "NOT NULL DEFAULT 0"
        extra_expense_total INTEGER "NOT NULL DEFAULT 0"
        additional_expense_total INTEGER "NOT NULL DEFAULT 0"
        balance INTEGER "NOT NULL DEFAULT 0"
        created_at TEXT "DEFAULT CURRENT_TIMESTAMP"
        updated_at TEXT "DEFAULT CURRENT_TIMESTAMP"
        FOREIGN KEY period_id REFERENCES periods(id)
    }
```

### 3.2 SQL de Migração Inicial

```sql
-- migrations/001_initial.sql

CREATE TABLE IF NOT EXISTS periods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK(month >= 1 AND month <= 12),
    closed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(year, month)
);

CREATE TABLE IF NOT EXISTS category_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('revenue', 'investment', 'expense')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL REFERENCES category_groups(id),
    name TEXT NOT NULL,
    expense_type TEXT CHECK(expense_type IN ('fixed', 'variable', 'extra', 'additional') OR expense_type IS NULL),
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(group_id, name)
);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_id INTEGER NOT NULL REFERENCES periods(id),
    category_id INTEGER NOT NULL REFERENCES categories(id),
    date TEXT NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'investment', 'expense')),
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS monthly_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_id INTEGER NOT NULL UNIQUE REFERENCES periods(id),
    revenue_total INTEGER NOT NULL DEFAULT 0,
    investment_total INTEGER NOT NULL DEFAULT 0,
    fixed_expense_total INTEGER NOT NULL DEFAULT 0,
    variable_expense_total INTEGER NOT NULL DEFAULT 0,
    extra_expense_total INTEGER NOT NULL DEFAULT 0,
    additional_expense_total INTEGER NOT NULL DEFAULT 0,
    balance INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_period ON transactions(period_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_categories_group ON categories(group_id);
```

### 3.3 Seed de Categorias Padrão

O arquivo [`seeds/categories.sql`](backend/seeds/categories.sql) contém 6 grupos de categorias (Receitas, Investimentos, Despesas Fixas, Despesas Variáveis, Despesas Extras, Despesas Adicionais) com 30 categorias no total. O seed é executado automaticamente na inicialização do backend se não houver grupos cadastrados.

### 3.4 Suporte Dual SQLite + PostgreSQL

O backend suporta ambos os drivers de forma transparente, definido pela variável de ambiente `DATABASE_URL`:

| Variável | Efeito | Exemplo |
|----------|--------|---------|
| `DATABASE_URL` não definida | Usa SQLite em `./data/finance.db` | — |
| `DATABASE_URL` definida | Usa PostgreSQL | `postgres://user:pass@host:5432/dbname` |

O SQL usa o arquivo [`migrations/001_initial.sql`](backend/migrations/001_initial.sql) para SQLite e [`migrations/001_initial.postgres.sql`](backend/migrations/001_initial.postgres.sql) para PostgreSQL. O mesmo padrão se aplica aos seeds.

### 3.5 Regras de Negócio do Schema

| Regra | Descrição |
|-------|-----------|
| **amount em centavos** | `R$ 1.234,56` → `123456` (INTEGER). Evita problemas de arredondamento. |
| **type em transactions** | Deve ser compatível com o `type` do `category_groups` da categoria vinculada. |
| **expense_type** | Só aplicável se a categoria pertence a um grupo do tipo `expense`. |
| **period** | Determinado automaticamente pela `date` no momento da criação da transação. |
| **monthly_summaries** | Tabela materializada para leitura rápida. Atualizada via trigger ou serviço. |
| **closed_at** | Período fechado não pode receber novas transações (validação em serviço). |

---

## 4. Backend — Clean Architecture em Go

### 4.1 Camadas e Responsabilidades

```mermaid
flowchart TD
    subgraph "Handler HTTP"
        H[handler.Handler]
    end
    
    subgraph "Service (Business Logic)"
        S[service.Service]
    end
    
    subgraph "Repository (Data Access)"
        R[repository.Repository]
    end
    
    subgraph "Domain (Entities)"
        D[domain.Entities + Interfaces]
    end
    
    subgraph "External"
        DB[(SQLite / PostgreSQL)]
    end
    
    HTTP[HTTP Request/Response] --> H
    H --> S
    S --> R
    R --> DB
    S --> D
    R --> D
    H --> D
```

### 4.2 Fluxo de Dados (Exemplo: Criar Transação)

```mermaid
sequenceDiagram
    participant C as Client (Angular)
    participant H as Handler
    participant S as Service
    participant R as Repository
    participant DB as SQLite / PostgreSQL
    
    C->>H: POST /api/transactions
    H->>H: Parse JSON body
    H->>S: CreateTransaction(req)
    S->>S: Validar período aberto
    S->>S: Validar categoria ativa
    S->>S: Calcular period_id from date
    S->>R: Create(transaction)
    R->>DB: INSERT INTO transactions
    R-->>S: transaction with ID
    S->>S: Atualizar monthly_summary
    S->>R: Recalculate(period_id)
    R->>DB: UPSERT monthly_summaries
    R-->>S: summary
    S-->>H: transaction + summary
    H-->>C: 201 Created JSON
```

### 4.3 Pacote `domain/` — Entidades

```go
// domain/transaction.go
type TransactionType string

const (
    TransactionIncome     TransactionType = "income"
    TransactionInvestment TransactionType = "investment"
    TransactionExpense    TransactionType = "expense"
)

type Transaction struct {
    ID         int64            `json:"id"`
    PeriodID   int64            `json:"periodId"`
    CategoryID int64            `json:"categoryId"`
    Date       string           `json:"date"`       // ISO YYYY-MM-DD
    Amount     int64            `json:"amount"`     // em centavos
    Note       string           `json:"note"`
    Type       TransactionType  `json:"type"`
    CreatedAt  time.Time        `json:"createdAt"`
    UpdatedAt  time.Time        `json:"updatedAt"`
    Period     *Period          `json:"period,omitempty"`
    Category   *Category        `json:"category,omitempty"`
}

// domain/category.go
type CategoryGroupType string

const (
    GroupTypeRevenue    CategoryGroupType = "revenue"
    GroupTypeInvestment CategoryGroupType = "investment"
    GroupTypeExpense    CategoryGroupType = "expense"
)

type ExpenseType string

const (
    ExpenseTypeFixed      ExpenseType = "fixed"
    ExpenseTypeVariable   ExpenseType = "variable"
    ExpenseTypeExtra      ExpenseType = "extra"
    ExpenseTypeAdditional ExpenseType = "additional"
)

type CategoryGroup struct {
    ID         int64             `json:"id"`
    Name       string            `json:"name"`
    Type       CategoryGroupType `json:"type"`
    SortOrder  int               `json:"sortOrder"`
    CreatedAt  time.Time         `json:"createdAt"`
    Categories []Category        `json:"categories,omitempty"`
}

type Category struct {
    ID          int64        `json:"id"`
    GroupID     int64        `json:"groupId"`
    Name        string       `json:"name"`
    ExpenseType *ExpenseType `json:"expenseType,omitempty"`
    SortOrder   int          `json:"sortOrder"`
    Active      bool         `json:"active"`
    CreatedAt   time.Time    `json:"createdAt"`
    UpdatedAt   time.Time    `json:"updatedAt"`
}

// domain/period.go
type Period struct {
    ID        int64      `json:"id"`
    Year      int        `json:"year"`
    Month     int        `json:"month"`
    ClosedAt  *time.Time `json:"closedAt,omitempty"`
    CreatedAt time.Time  `json:"createdAt"`
    UpdatedAt time.Time  `json:"updatedAt"`
}

// domain/summary.go
type MonthlySummary struct {
    ID                     int64     `json:"id"`
    PeriodID               int64     `json:"periodId"`
    RevenueTotal           int64     `json:"revenueTotal"`
    InvestmentTotal        int64     `json:"investmentTotal"`
    FixedExpenseTotal      int64     `json:"fixedExpenseTotal"`
    VariableExpenseTotal   int64     `json:"variableExpenseTotal"`
    ExtraExpenseTotal      int64     `json:"extraExpenseTotal"`
    AdditionalExpenseTotal int64     `json:"additionalExpenseTotal"`
    Balance                int64     `json:"balance"`
    CreatedAt              time.Time `json:"createdAt"`
    UpdatedAt              time.Time `json:"updatedAt"`
}
```

### 4.4 Interfaces de Repositório

As interfaces de repositório estão definidas dentro dos próprios arquivos no pacote `repository/` (não em um arquivo `interfaces.go` separado).

```go
// repository/transaction_repo.go
type TransactionRepository interface {
    Create(t *domain.Transaction) error
    FindByID(id int64) (*domain.Transaction, error)
    FindByPeriod(periodID int64) ([]*domain.Transaction, error)
    FindByPeriodStr(year, month int) ([]*domain.Transaction, error)
    Update(t *domain.Transaction) error
    Delete(id int64) error
}

// repository/category_repo.go
type CategoryRepository interface {
    FindAll() ([]*domain.CategoryGroup, error)
    FindByID(id int64) (*domain.Category, error)
    FindByGroupID(groupID int64) ([]*domain.Category, error)
    Create(c *domain.Category) error
    Update(c *domain.Category) error
    Delete(id int64) error
}

// repository/period_repo.go
type PeriodRepository interface {
    FindByID(id int64) (*domain.Period, error)
    FindByYearMonth(year, month int) (*domain.Period, error)
    GetOrCreate(year, month int) (*domain.Period, error)
    List() ([]*domain.Period, error)
    Close(id int64) error
}

// repository/summary_repo.go
type SummaryRepository interface {
    FindByPeriod(periodID int64) (*domain.MonthlySummary, error)
    Recalculate(periodID int64) error
}
```

### 4.5 Handlers HTTP e Rotas

As rotas são configuradas diretamente no [`main.go`](backend/cmd/server/main.go) usando o `http.ServeMux` nativo do Go 1.22+ com pattern matching. CORS é aplicado via middleware inline no mesmo arquivo.

| Método | Rota | Handler | Descrição |
|--------|------|---------|-----------|
| `POST` | `/api/transactions` | `transactionHandler.Create` | Criar transação |
| `GET` | `/api/transactions` | `transactionHandler.List` | Listar transações (query: `?period=YYYY-MM`) |
| `PATCH` | `/api/transactions/{id}` | `transactionHandler.Update` | Atualizar transação |
| `DELETE` | `/api/transactions/{id}` | `transactionHandler.Delete` | Excluir transação |
| `GET` | `/api/categories` | `categoryHandler.List` | Listar grupos com categorias |
| `POST` | `/api/categories` | `categoryHandler.Create` | Criar categoria |
| `PATCH` | `/api/categories/{id}` | `categoryHandler.Update` | Atualizar categoria |
| `DELETE` | `/api/categories/{id}` | `categoryHandler.Delete` | Excluir categoria |
| `GET` | `/api/periods` | `periodHandler.List` | Listar períodos |
| `POST` | `/api/periods/close` | `periodHandler.Close` | Fechar período |
| `GET` | `/api/summary` | `summaryHandler.Get` | Obter resumo mensal (query: `?period=YYYY-MM`) |
| `GET` | `/api/health` | inline | Health check |

### 4.6 Formato da Resposta da API

Todas as respostas seguem o envelope padronizado em [`handler.helpers.go`](backend/internal/handler/helpers.go):

```json
// Sucesso
{
  "success": true,
  "data": { ... }
}

// Erro
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "Descrição do erro"
  }
}
```

| HTTP Status | Código | Significado |
|-------------|--------|-------------|
| 400 | `validation_error` | Dados inválidos ou campos obrigatórios |
| 404 | `not_found` | Recurso não encontrado |
| 409 | `already_closed` | Período já fechado |
| 422 | `validation_error` | Erro de validação (ex.: período fechado) |
| 500 | `internal_error` | Erro interno do servidor |

---

## 5. Frontend — Angular 17+ Standalone Components

### 5.1 Árvore de Componentes

```mermaid
flowchart TD
    subgraph Layout
        A[AppComponent]
        ML[MainLayoutComponent]
    end
    
    subgraph Shared
        PH[PageHeaderComponent]
        LS[LoadingSpinnerComponent]
        ES[EmptyStateComponent]
        CD[ConfirmDialogComponent]
        EA[ErrorAlertComponent]
    end
    
    subgraph Dashboard
        D[DashboardComponent]
    end
    
    subgraph Transactions
        TC[TransactionsListComponent]
        TF[TransactionFormComponent]
    end
    
    subgraph Categories
        CC[CategoriesComponent]
    end
    
    subgraph Periods
        PC[PeriodsComponent]
    end
    
    A --> ML
    ML --> |router-outlet| D
    ML --> |router-outlet| TC
    ML --> |router-outlet| TF
    ML --> |router-outlet| CC
    ML --> |router-outlet| PC
```

### 5.2 Fluxo de Dados

```mermaid
sequenceDiagram
    participant U as Usuário
    participant C as Component
    participant S as Service
    participant API as Backend (Go)
    participant DB as Database
    
    U->>C: Interage com a UI
    C->>S: Chama método do serviço
    S->>API: HTTP request (HttpClient)
    API->>DB: Operação no banco
    DB-->>API: Resultado
    API-->>S: JSON { success, data }
    S-->>C: Observable<T> (data extraído)
    C->>C: Atualiza template (async pipe)
```

### 5.3 Interfaces TypeScript

#### ApiResponse (`core/interfaces/api.interface.ts`)

```typescript
export interface ApiError {
    code: string;
    message: string;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
}
```

#### Category (`core/interfaces/category.interface.ts`)

```typescript
export type CategoryGroupType = 'revenue' | 'investment' | 'expense';
export type ExpenseType = 'fixed' | 'variable' | 'extra' | 'additional';

export interface CategoryGroup {
    id: number;
    name: string;
    type: CategoryGroupType;
    sortOrder: number;
    createdAt: string;
    categories: Category[];
}

export interface Category {
    id: number;
    groupId: number;
    name: string;
    expenseType: ExpenseType | null;
    sortOrder: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCategoryPayload {
    groupId: number;
    name: string;
    expenseType?: ExpenseType | null;
    sortOrder?: number;
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload> & {
    active?: boolean;
};
```

#### Transaction (`core/interfaces/transaction.interface.ts`)

```typescript
export type TransactionType = 'income' | 'investment' | 'expense';

export interface Transaction {
    id: number;
    periodId: number;
    categoryId: number;
    date: string;
    amount: number;
    type: TransactionType;
    note: string;
    createdAt: string;
    updatedAt: string;
    categoryName?: string;
    periodLabel?: string;
}

export interface CreateTransactionPayload {
    categoryId: number;
    date: string;
    amount: number;
    type: TransactionType;
    note: string;
}

export type UpdateTransactionPayload = Partial<CreateTransactionPayload>;
```

#### Period (`core/interfaces/period.interface.ts`)

```typescript
export interface Period {
    id: number;
    year: number;
    month: number;
    label?: string;
    closedAt: string | null;
    createdAt: string;
    updatedAt: string;
    transactionCount?: number;
    balance?: number;
}

export interface ClosePeriodPayload {
    year: number;
    month: number;
}
```

#### MonthlySummary (`core/interfaces/summary.interface.ts`)

```typescript
export interface MonthlySummary {
    id: number;
    periodId: number;
    revenueTotal: number;
    investmentTotal: number;
    fixedExpenseTotal: number;
    variableExpenseTotal: number;
    extraExpenseTotal: number;
    additionalExpenseTotal: number;
    balance: number;
    createdAt: string;
    updatedAt: string;
}

export interface DetailedSummary {
    period: string;
    periodId: number;
    closed: boolean;
    revenue: RevenueSummary;
    investments: InvestmentsSummary;
    expenses: ExpensesSummary;
    balance: number;
    summary: MonthlySummary;
}
```

### 5.4 Services

#### BaseApiService (`core/services/base-api.service.ts`)

Classe abstrata que centraliza o acesso HTTP. Todas as responses da API seguem o envelope `{ success, data?, error? }`.

```typescript
export abstract class BaseApiService {
    protected readonly http = inject(HttpClient);
    protected abstract readonly basePath: string;

    protected get<T>(path?: string, params?: HttpParams): Observable<T> { ... }
    protected post<T>(body: unknown, path?: string): Observable<T> { ... }
    protected patch<T>(id: number, body: unknown): Observable<T> { ... }
    protected deleteRequest<T>(id: number): Observable<T> { ... }
}
```

Serviços concretos que estendem `BaseApiService`:

| Serviço | `basePath` | Métodos |
|---------|-----------|---------|
| `CategoryService` | `/api/categories` | `list()`, `create()`, `update()`, `deleteCategory()` |
| `TransactionService` | `/api/transactions` | `list(period)`, `create()`, `update()`, `deleteTransaction()` |
| `PeriodService` | `/api/periods` | `list()`, `close(year, month)` |
| `SummaryService` | `/api/summary` | `getByPeriod(period)` |

#### PeriodNavigationService (`core/services/period-navigation.service.ts`)

Serviço de estado compartilhado usando `BehaviorSubject` para o período ativo (formato `YYYY-MM`).

```typescript
@Injectable({ providedIn: 'root' })
export class PeriodNavigationService {
    readonly currentPeriod$: Observable<string>;
    get currentPeriod(): string;
    previous(): void;
    next(): void;
    goTo(period: string): void;
    goToCurrent(): void;
}
```

### 5.5 HTTP Client e Interceptors

O Angular `HttpClient` é configurado no [`app.config.ts`](frontend/src/app/app.config.ts) com interceptors funcionais (`HttpInterceptorFn`):

```typescript
export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        provideHttpClient(
            withInterceptors([apiErrorInterceptor])
        ),
    ],
};
```

O interceptor [`api-error.interceptor.ts`](frontend/src/app/core/interceptors/api-error.interceptor.ts) captura erros HTTP e padroniza o tratamento:

- Erros com `error.error.error.message` do backend são extraídos
- Timeout/erros de rede são traduzidos para português
- O erro é relançado como `AppHttpError` com `status`, `code` e `message`

---

## 6. Rotas Frontend

Configuradas em [`app.routes.ts`](frontend/src/app/app.routes.ts) com lazy loading via `loadComponent`.

| Path | Component | Descrição |
|------|-----------|-----------|
| `/` | `DashboardComponent` (redirect) | Dashboard com resumo mensal |
| `/transactions` | `TransactionsListComponent` | Lista de transações do período |
| `/transactions/new` | `TransactionFormComponent` | Formulário de novo lançamento |
| `/categories` | `CategoriesComponent` | Gestão de grupos e categorias |
| `/periods` | `PeriodsComponent` | Lista de períodos com ação de fechar |
| `**` | redirectTo: `'/'` | Rota curinga |

### 6.1 Navegação (Sidebar)

A [`MainLayout`](frontend/src/app/core/layouts/main-layout.ts) contém uma sidebar com navegação e seletor de período (mês anterior/próximo):

```
📊 Dashboard        → /
💳 Transações       → /transactions
📂 Categorias       → /categories
📈 Períodos         → /periods
```

### 6.2 Seletor de Período

Presente na sidebar, o seletor de período permite navegar entre meses usando botões de anterior/próximo, atualizando o `PeriodNavigationService` que propaga o período ativo para todos os componentes.

---

## 7. Plano de Implementação

### Fase 1 — Fundação

| Etapa | Tarefa | Depende de |
|-------|--------|-----------|
| 1.1 | Setup do monorepo (pastas, .gitignore, README) | — |
| 1.2 | Backend: `go mod init`, dependências, Docker | 1.1 |
| 1.3 | Backend: migrations SQL + seed de categorias padrão | 1.2 |
| 1.4 | Backend: domain entities e interfaces de repositório | 1.3 |
| 1.5 | Frontend: `ng new` com standalone + Tailwind | 1.1 |
| 1.6 | Frontend: interfaces TypeScript + services | 1.5 |

### Fase 2 — Core Backend

| Etapa | Tarefa | Depende de |
|-------|--------|-----------|
| 2.1 | Repository: implementação SQLite/PostgreSQL de categories | 1.4 |
| 2.2 | Repository: implementação SQLite/PostgreSQL de periods | 1.4 |
| 2.3 | Repository: implementação SQLite/PostgreSQL de transactions | 1.4 |
| 2.4 | Repository: implementação SQLite/PostgreSQL de summary | 1.4 |
| 2.5 | Service: category_service (CRUD + validações) | 2.1 |
| 2.6 | Service: period_service (getOrCreate, close) | 2.2 |
| 2.7 | Service: transaction_service (CRUD + validação período aberto) | 2.3, 2.6 |
| 2.8 | Service: summary_service (cálculo de totais) | 2.4, 2.7 |
| 2.9 | Handler: handlers HTTP + helpers de resposta | 2.5, 2.6, 2.7, 2.8 |
| 2.10 | `main.go`: wiring, rotas, CORS, startup | 2.9 |

### Fase 3 — Core Frontend

| Etapa | Tarefa | Depende de |
|-------|--------|-----------|
| 3.1 | Layout: MainLayout + Sidebar com navegação de período | 1.5 |
| 3.2 | Service: CategoryService + Categories page | 2.1 |
| 3.3 | Service: TransactionService + TransactionsList + TransactionForm | 2.3, 2.7 |
| 3.4 | Service: SummaryService + Dashboard | 2.8 |
| 3.5 | Dashboard: integrar summary + transações recentes | 3.1, 3.2, 3.3, 3.4 |
| 3.6 | Transactions pages: list, new | 3.3 |
| 3.7 | Categories page: CRUD completo | 3.2 |
| 3.8 | Periods page: listar e fechar períodos | 2.6 |

### Fase 4 — Polimento

| Etapa | Tarefa | Depende de |
|-------|--------|-----------|
| 4.1 | Loading spinner + empty states + error alert | 3.5, 3.6, 3.7, 3.8 |
| 4.2 | Currency pipe (R$) + formatação de data (pt-BR) | 3.5 |
| 4.3 | Responsividade mobile (sidebar overlay) | 3.1 |
| 4.4 | Docker Compose com frontend + backend | 2.10, 1.5 |
| 4.5 | README com instruções de setup | 4.4 |

### Fase 5 — MCP e Automação (Futuro)

| Etapa | Tarefa | Depende de |
|-------|--------|-----------|
| 5.1 | Endpoints MCP para consulta de dados | 2.0 |
| 5.2 | Endpoints MCP para criação de transações | 2.0 |
| 5.3 | Documentação MCP | 5.1, 5.2 |

---

## 8. Decisões Técnicas

| Decisão | Opção Escolhida | Alternativas | Motivo |
|---------|----------------|-------------|--------|
| **Storage de valores** | INTEGER (centavos) | FLOAT, DECIMAL | Precisão absoluta, sem arredondamento |
| **Período** | Tabela `periods` gerada por demanda | Cálculo via SQL da data | Performance em consultas de summary |
| **Summary** | Tabela materializada | Cálculo sob demanda | Leitura rápida no dashboard |
| **Router Go** | `net/http` padrão + `http.ServeMux` | chi, gorilla/mux | Go 1.22+ tem pattern matching, menos dependências |
| **Driver SQLite** | `modernc.org/sqlite` (pure Go) | mattn/go-sqlite3 (CGO) | Sem necessidade de CGO, build simples |
| **Driver PostgreSQL** | `lib/pq` | pgx | Driver leve e estável |
| **Migrations** | SQL puro executado na inicialização | golang-migrate, goose | Simplicidade para single-user |
| **Estado frontend** | Services com BehaviorSubject | NgRx, Signals | Simplicidade inicial, sem over-engineering |
| **Formulários** | Reactive Forms (nativo) | Template Forms | Validação síncrona/assíncrona, tipagem forte |
| **CSS** | Tailwind CSS | SCSS Modules, Angular Material | Utilitário, rápido, responsivo |
| **Componentes** | Standalone (sem NgModules) | Módulos Ivy | Angular 17+ nativo, lazy loading |

---

## 9. Dependências Externas

### Backend (Go)

```
modernc.org/sqlite     # Driver SQLite puro Go (sem CGO)
github.com/lib/pq      # Driver PostgreSQL
```

### Frontend (Node.js)

```json
{
    "dependencies": {
        "@angular/common": "^21.0.0",
        "@angular/compiler": "^21.0.0",
        "@angular/core": "^21.0.0",
        "@angular/forms": "^21.0.0",
        "@angular/platform-browser": "^21.0.0",
        "@angular/router": "^21.0.0",
        "rxjs": "~7.8.0",
        "tslib": "^2.3.0"
    },
    "devDependencies": {
        "@angular/cli": "^21.0.0",
        "@angular/compiler-cli": "^21.0.0",
        "@angular/build": "^21.0.0",
        "typescript": "~5.5.0",
        "tailwindcss": "^3.4.0",
        "postcss": "^8.4.0",
        "autoprefixer": "^10.4.0",
        "prettier": "^3.0.0"
    }
}
```

---

## 10. Variáveis de Ambiente

### Backend (`.env`)

```env
# backend/.env
PORT=8080
DB_PATH=./data/finance.db
DATABASE_URL=                    # Opcional: postgres://user:pass@host:5432/dbname
```

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor HTTP | `8080` |
| `DB_PATH` | Caminho do arquivo SQLite | `./data/finance.db` |
| `DATABASE_URL` | URL de conexão PostgreSQL (se definida, substitui SQLite) | vazio (usa SQLite) |

### Frontend

O frontend obtém a URL da API em tempo de execução via `window.__env__.apiUrl`, substituído pelo `docker-entrypoint.sh` em produção. Em desenvolvimento (`ng serve`), o [`proxy.conf.json`](frontend/proxy.conf.json) redireciona `/api/*` para `http://localhost:8080`.
