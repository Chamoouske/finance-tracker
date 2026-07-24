# Integração MCP

O Finance Tracker expõe um servidor MCP TypeScript stateless por Streamable HTTP em:

```text
POST http://localhost:3001/mcp
```

O serviço usa o SDK TypeScript oficial do MCP. Ele não se conecta ao PostgreSQL nem ao SQLite:
todas as ferramentas chamam a API REST Go definida por `GO_API_URL` (padrão local:
`http://localhost:8080`; no Compose: `http://backend:8080`). Assim, validações, períodos,
resumos e persistência continuam exclusivamente no backend Go.

O transporte usa JSON-RPC 2.0 sobre Streamable HTTP. O cliente deve enviar
`Accept: application/json, text/event-stream`.

## Ferramentas

| Ferramenta | Finalidade | Argumentos |
|---|---|---|
| `list_transactions` | Lista transações mensais | `period` (`YYYY-MM`) |
| `list_categories` | Lista grupos e categorias | nenhum |
| `get_summary` | Consulta o resumo mensal | `period` (`YYYY-MM`) |
| `get_balance` | Consulta o balanço consolidado | nenhum |
| `create_transaction` | Cria uma transação | `categoryId`, `date`, `amount`, `type`, `note` |

## Inicialização

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": {},
    "clientInfo": { "name": "example", "version": "1.0.0" }
  }
}
```

## Chamada de ferramenta

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "list_transactions",
    "arguments": { "period": "2026-07" }
  }
}
```

O SDK negocia a versão do protocolo com o cliente; o exemplo acima usa a revisão `2025-06-18`, que permanece suportada. Erros de protocolo usam o objeto `error` do JSON-RPC. Erros de validação, comunicação com a API Go ou regras financeiras retornados pela API são resultados de ferramenta com `isError: true`, permitindo que o cliente MCP apresente ou corrija a chamada.
