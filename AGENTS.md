# Regras de desenvolvimento

## TDD obrigatório

Toda mudança de comportamento deve seguir Red–Green–Refactor:

1. Escrever primeiro um teste que descreva o comportamento e confirmar que ele falha pelo motivo esperado.
2. Implementar apenas o necessário para tornar o teste verde.
3. Refatorar mantendo toda a suíte verde.

Correções de bugs devem incluir um teste de regressão. Não é permitido reduzir, ignorar ou excluir testes apenas para fazer a suíte passar.

## Cobertura de código novo

- No mínimo 90% das linhas executáveis adicionadas ou alteradas devem ser cobertas por testes.
- Toda decisão nova (`if`, `switch`, validação, retorno antecipado e tratamento de erro) deve ter os caminhos relevante, alternativo e de erro exercitados.
- A cobertura percentual não substitui a matriz de decisões: branches sem teste devem ser tratados como falha mesmo quando o percentual superar 90%.
- Código gerado e declarações sem comportamento podem ser excluídos apenas com justificativa documentada.

## Verificação

Backend:

```bash
cd backend
go test ./... -coverprofile=coverage.out
```

Frontend:

```bash
cd frontend
npm test -- --watch=false --coverage
```

MCP TypeScript:

```bash
cd mcp
npm test
npm run build
```

Pull requests executam a verificação diferencial configurada em `.github/workflows/tdd-coverage.yml`.
