# Integração MCP

O Finance Tracker expõe um servidor MCP stateless por Streamable HTTP em:

```text
POST http://localhost:8080/mcp
```

O transporte usa JSON-RPC 2.0 e negocia a revisão `2025-06-18`. O cliente deve enviar `Accept: application/json, text/event-stream`. Origens HTTP são aceitas somente quando ausentes ou locais (`localhost` e `127.0.0.1`).

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

Erros de protocolo usam o objeto `error` do JSON-RPC. Erros de validação, banco de dados ou regras financeiras são resultados de ferramenta com `isError: true`, permitindo que o cliente MCP apresente ou corrija a chamada.
