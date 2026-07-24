# Finance Tracker

Aplicação web para controle financeiro mensal, com transações, categorias, fechamento de períodos, resumos mensais e balanço consolidado.

O projeto é um monorepo composto por:

- Backend em Go, responsável exclusivamente pela API REST e pelas regras financeiras.
- Servidor MCP independente em TypeScript, que consome somente a API REST Go.
- Frontend em Angular e Tailwind CSS.
- SQLite para desenvolvimento local ou PostgreSQL via Docker Compose.
- Job periódico para recalcular snapshots do balanço.

## Funcionalidades

- Cadastro, consulta, atualização e exclusão de transações.
- Categorias organizadas em receitas, investimentos e despesas.
- Despesas classificadas como fixas, variáveis, extras ou adicionais.
- Criação automática de períodos mensais.
- Fechamento de períodos para impedir alterações posteriores.
- Resumo financeiro mensal materializado.
- Visão consolidada do balanço de todos os períodos.
- Integração MCP para consultas e criação de transações por agentes.
- Build e publicação automática das imagens Docker antes de cada `git push`.

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Backend | Go, `net/http`, SQLite, PostgreSQL |
| Frontend | Angular, TypeScript, RxJS, Tailwind CSS |
| Infraestrutura | Docker, Docker Compose, Nginx |
| Qualidade | Go test, Vitest, cobertura diferencial no GitHub Actions |
| Integração | REST em Go e MCP TypeScript via Streamable HTTP |

## Estrutura

```text
finance-tracker/
├── backend/
│   ├── cmd/server/              # Servidor HTTP
│   ├── cmd/publish-images/      # Publicador das imagens Docker
│   ├── internal/                # Domain, handlers, services e repositories
│   ├── migrations/              # Migrations SQLite e PostgreSQL
│   └── seeds/                   # Categorias iniciais
├── frontend/                    # Aplicação Angular
├── mcp/                         # Servidor MCP TypeScript; cliente da API Go
├── docs/                        # API, arquitetura, MCP e validação
├── .githooks/pre-push           # Build e push local das imagens
└── docker-compose.yml
```

## Início rápido com Docker

### Requisitos

- Docker Desktop com Docker Compose.
- Portas `3000` e `8080` disponíveis.

Suba toda a aplicação:

```bash
docker compose up --build
```

Serviços disponíveis:

| Serviço | Endereço |
|---|---|
| Frontend | <http://localhost:3000> |
| API REST | <http://localhost:8080/api> |
| Health check | <http://localhost:8080/api/health> |
| MCP | <http://localhost:3001/mcp> |
| Health check MCP | <http://localhost:3001/health> |

Para encerrar:

```bash
docker compose down
```

O volume `finance-tracker-pgdata` mantém os dados do PostgreSQL entre reinicializações.

## Desenvolvimento local

### Backend

Requisitos: Go 1.26 ou superior.

```bash
cd backend
go run ./cmd/server
```

Sem `DATABASE_URL`, o backend usa SQLite em `backend/data/finance.db`.

### Frontend

Requisitos: Node.js 22 ou superior e npm.

```bash
cd frontend
npm install
npm start
```

O frontend estará em <http://localhost:4200>. O proxy de desenvolvimento encaminha `/api` para o backend na porta `8080`.

## Variáveis de ambiente

### Backend

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `8080` | Porta HTTP do backend |
| `DB_PATH` | `./data/finance.db` | Arquivo SQLite local |
| `DATABASE_URL` | vazio | Conexão PostgreSQL; quando definida substitui o SQLite |
| `SYNC_INTERVAL` | `300` | Intervalo do job de balanço, em segundos |

Exemplo PostgreSQL:

```text
postgres://finance:finance_pass@localhost:5432/finance_tracker?sslmode=disable
```

### Frontend em container

| Variável | Padrão | Descrição |
|---|---|---|
| `API_URL` | vazio | URL base da API; vazio usa a mesma origem e o proxy do Nginx |

## API REST

A API usa JSON em `camelCase`, valores monetários inteiros em centavos e o envelope:

```json
{
  "success": true,
  "data": {}
}
```

Principais endpoints:

| Método | Endpoint | Finalidade |
|---|---|---|
| `POST` | `/api/transactions` | Criar transação |
| `GET` | `/api/transactions?period=YYYY-MM` | Listar transações |
| `PATCH` | `/api/transactions/{id}` | Atualizar transação |
| `DELETE` | `/api/transactions/{id}` | Excluir transação |
| `GET` | `/api/categories` | Listar categorias |
| `POST` | `/api/categories` | Criar categoria |
| `PATCH` | `/api/categories/{id}` | Atualizar categoria |
| `DELETE` | `/api/categories/{id}` | Excluir categoria |
| `GET` | `/api/periods` | Listar períodos |
| `POST` | `/api/periods/close` | Fechar período |
| `GET` | `/api/summary?period=YYYY-MM` | Consultar resumo mensal |
| `GET` | `/api/balance` | Consultar balanço consolidado |
| `GET` | `/api/health` | Verificar a saúde da aplicação |

O contrato completo, exemplos e erros estão em [docs/API.md](docs/API.md).

## Model Context Protocol

O serviço independente em `mcp/` usa o SDK TypeScript oficial. Seu endpoint `POST /mcp`,
na porta `3001`, implementa JSON-RPC 2.0 e Streamable HTTP. Ele não possui acesso ao banco:
todas as ferramentas consomem exclusivamente a API Go configurada em `GO_API_URL`.

Ferramentas disponíveis:

- `list_transactions`
- `list_categories`
- `get_summary`
- `get_balance`
- `create_transaction`

Consulte [docs/MCP.md](docs/MCP.md) para schemas, inicialização e exemplos.

## Testes e qualidade

O desenvolvimento segue TDD e exige cobertura mínima de 90% das linhas novas ou alteradas, incluindo os caminhos de decisões e erros.

Backend:

```bash
cd backend
go test ./... -coverprofile=coverage.out
go vet ./...
```

Frontend:

```bash
cd frontend
npm test -- --watch=false
npm run build
```

As regras completas estão em [AGENTS.md](AGENTS.md). O workflow `.github/workflows/tdd-coverage.yml` verifica a cobertura diferencial em pushes e pull requests.

## Hook de publicação Docker

Este clone está configurado para usar `.githooks/pre-push`. Em novos clones, ative-o uma vez:

```bash
git config core.hooksPath .githooks
docker login
```

Antes de cada `git push`, o hook executa:

```text
docker build -t chamoouske/finance-tracker-backend:latest backend
docker push chamoouske/finance-tracker-backend:latest
docker build -t chamoouske/finance-tracker-frontend:latest frontend
docker push chamoouske/finance-tracker-frontend:latest
docker build -t chamoouske/finance-tracker-mcp:latest mcp
docker push chamoouske/finance-tracker-mcp:latest
```

Se qualquer comando falhar, o envio dos commits é cancelado.

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [API REST](docs/API.md)
- [Model Context Protocol](docs/MCP.md)
- [Validação](docs/VALIDATION.md)

## Licença

Este repositório ainda não possui uma licença de uso definida.
