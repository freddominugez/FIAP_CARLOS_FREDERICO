# ADR 0001: monólito em camadas com módulos por contexto

Data: 25/10/2026. Status: aceita.

## Contexto
O enunciado pede back-end monolítico e aceita arquitetura em camadas para o MVP. O domínio tem quatro contextos (Cadastros, Atendimento, Catálogo e Estoque, Identidade) e a aprovação do orçamento precisa reservar estoque na mesma transação.

## Decisão
Um processo único em TypeScript com quatro camadas (interface, aplicação, domínio, infraestrutura, conforme DDD aula 5). Dentro de `domain` e `application`, uma pasta por contexto. A aplicação depende de portas, e a infraestrutura as implementa.

## Consequências
- Uma transação cobre aprovação e reserva, sem coordenação distribuída.
- Um deploy e um banco para operar.
- A fronteira entre contextos depende de disciplina. Um teste com dependency-cruiser quebra o build quando `domain` importa algo de fora ou quando um contexto acessa o repositório de outro.

## Alternativas
- Microsserviços: fora do enunciado, exigiria saga para reservar estoque.
- Vertical slice (Arquitetura aula 1): bom para CRUD, mas espalha as regras da OS em vários handlers.
