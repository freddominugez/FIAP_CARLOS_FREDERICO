# Mapa de contexto

Os quatro contextos são módulos do mesmo monólito. A relação entre eles segue os padrões da DDD aula 4.

```mermaid
flowchart LR
  ID[Identidade e Acesso<br/>genérico]
  CAD[Cadastros<br/>suporte]
  AT[Atendimento<br/>principal]
  EST[Catálogo e Estoque<br/>principal]

  CAD -- "U → D<br/>cliente-fornecedor" --> AT
  EST -- "U → D<br/>cliente-fornecedor" --> AT
  AT -- "evento Orçamento aprovado<br/>Published Language" --> EST
  ID -- "U → D<br/>conformista" --> AT
  ID -- "U → D<br/>conformista" --> CAD
  ID -- "U → D<br/>conformista" --> EST
```

| Upstream | Downstream | Padrão | O que passa |
|---|---|---|---|
| Cadastros | Atendimento | cliente-fornecedor | `clienteId`, `veiculoId` e dados para exibição. Atendimento grava cópia na OS para preservar o histórico |
| Catálogo e Estoque | Atendimento | cliente-fornecedor | serviço e peça ativos com preço atual, copiados para a versão do orçamento |
| Atendimento | Catálogo e Estoque | Published Language | `OrcamentoAprovado`, `DiagnosticoReaberto`, `ExecucaoIniciada` com itens e quantidades |
| Identidade e Acesso | todos | conformista | `usuarioId`, perfil e `clienteId` vindos do token |

Kernel compartilhado: `domain/shared` com `Dinheiro`, `Quantidade`, `Id` e erros de domínio. Nada de regra de negócio entra ali.

A reserva acontece na mesma transação da aprovação, chamada de forma síncrona pelo caso de uso. O evento é publicado em memória para registro e histórico, sem fila, porque o enunciado pede monólito e a reserva precisa ser atômica com a decisão.
