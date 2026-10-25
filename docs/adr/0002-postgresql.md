# ADR 0002: PostgreSQL como banco de dados

Data: 25/10/2026. Status: aceita.

## Contexto
Aprovar um orçamento reserva várias peças. Se uma faltar, nenhuma pode ficar reservada. Duas OS podem disputar a última unidade ao mesmo tempo, e a API pode rodar em mais de uma instância.

## Decisão
PostgreSQL 16. Local no docker-compose, gerenciado no Supabase em produção. Reserva com `SELECT ... FOR UPDATE` por peça em ordem de UUID, dentro de uma transação, e constraint `CHECK (fisico >= reservado AND reservado >= 0)`.

## Consequências
- Atomicidade e saldo nunca negativo garantidos pelo banco, independentemente do número de instâncias.
- FKs e `UNIQUE` reforçam documento único, placa única e versão única de orçamento.
- Testes de integração precisam de PostgreSQL real (Testcontainers).
- Na Vercel, a conexão passa pelo pooler do Supabase em modo transação, sem prepared statements nomeados.

## Alternativas
- MongoDB: transação multi-documento existe, mas a constraint de saldo e as FKs teriam de ser reimplementadas na aplicação.
- MySQL: atenderia, sem vantagem sobre o PostgreSQL e sem oferta gerenciada já integrada à Vercel no plano.
