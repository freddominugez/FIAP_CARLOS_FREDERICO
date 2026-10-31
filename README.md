# Tech Challenge Fase 1, FIAP SOAT

Carlos Frederico Ribeiro de Almeida Dominguez. SOAT, Software Architecture, Fase 1, grupo 144.

| | |
|---|---|
| API publicada (Swagger) | https://oficina-fiap-soat.vercel.app/api/docs |
| Vídeo da entrega | pendente: o link entra aqui depois da publicação no YouTube |
| Documentação DDD | [docs/ddd/](docs/ddd/), quadro no FigJam https://www.figma.com/board/NKQrpQI2vGYRkX8YnBAZMN |

## Objetivo

Substituir as anotações à mão e as planilhas de uma oficina mecânica por um back-end que controla a ordem de serviço do recebimento à entrega. A oficina perde prioridade, promete peça que falta no estoque e não sabe dizer ao cliente em que pé está o carro.

## Solução

API REST (MVP) com cadastros de cliente, veículo, serviço e peça. Ordem de serviço com seis status, orçamento em versões com preço congelado, aprovação ou rejeição pelo próprio cliente e reserva de estoque na mesma transação da aprovação. O cliente acompanha as próprias OS pela API, e a oficina consulta o tempo médio de execução.

## Arquitetura

Monólito em quatro camadas com DDD. O domínio não depende de nada externo, e a direção das dependências é verificada por `npm run arch`. Quatro contextos: Cadastros, Catálogo e Estoque, Atendimento e Identidade.

```
oficina-api/src/
├── domain/           regras puras: documento, placa, máquina de estados, orçamento, estoque
├── application/      casos de uso e portas (interfaces de repositório e unidade de trabalho)
├── infrastructure/   PostgreSQL, repositórios, bcrypt
├── interfaces/http/  rotas Fastify, schemas, plugins de JWT, entrada e erros
└── main/             composição, configuração, servidor, seed
```

Diagramas C4 níveis 1 a 3 em [docs/arquitetura/c4.pdf](docs/arquitetura/c4.pdf). Decisões em [docs/adr/](docs/adr/).

## Tecnologias

TypeScript 6, Node.js 24, Fastify 5, TypeBox, OpenAPI com Swagger UI, PostgreSQL 16, `pg` com SQL escrito à mão, node-pg-migrate, JWT (`@fastify/jwt`), bcrypt, Vitest com cobertura V8, Testcontainers, ESLint, dependency-cruiser, Docker e Docker Compose. Publicação na Vercel com banco no Supabase.

## Banco de dados

PostgreSQL. Aprovar um orçamento reserva várias peças, e se uma faltar nenhuma pode ficar reservada. Isso pede transação, lock por linha (`SELECT ... FOR UPDATE`, em ordem de UUID para não haver deadlock) e a constraint `physical >= reserved >= 0`, que o banco garante mesmo com várias instâncias da API. Movimentos de estoque não podem ser alterados nem apagados, por trigger. Um banco de documentos não dá essas garantias entre registros diferentes. Justificativa completa em [docs/adr/0002-postgresql.md](docs/adr/0002-postgresql.md).

## Pré-requisitos

- Docker com Compose
- Node.js 22.12 ou superior, só para rodar os testes fora do container

## Execução

```bash
cd oficina-api
docker compose up --build
```

A API sobe em http://localhost:3000, aplica as migrações e cria os usuários de demonstração.

## Swagger

- local: http://localhost:3000/api/docs (JSON em `/api/docs/json`)
- publicado: https://oficina-fiap-soat.vercel.app/api/docs

Para chamar rotas protegidas: `POST /api/v1/auth/login`, copiar o `token` da resposta e colar em **Authorize**.

## Usuários de demonstração

| Perfil | E-mail | Senha |
|---|---|---|
| ADMIN | admin@oficina.local | Oficina@2026 |
| ATENDENTE | atendente@oficina.local | Oficina@2026 |
| TECNICO | tecnico@oficina.local | Oficina@2026 |

Valem no Compose e na API publicada. O usuário CLIENTE é criado pelo atendente em `POST /api/v1/customers/{id}/user`. O token JWT vale 1 hora. Cada perfil tem as rotas listadas no [README da API](oficina-api/README.md#rotas).

## Testes

Os testes de integração usam PostgreSQL real. Com Docker disponível, o Testcontainers sobe o banco sozinho:

```bash
cd oficina-api
npm ci
npm test            # 189 testes, unitários e de integração
npm run coverage    # falha se domain ou application ficarem abaixo de 80%
```

Se o Docker local não encaminhar portas (algumas instalações do Colima), apontar para um PostgreSQL já em execução com `TEST_DATABASE_URL`. Detalhes no [README da API](oficina-api/README.md#testes).

Resultados, cobertura e análise de vulnerabilidades (npm audit, Gitleaks, Trivy, OWASP ZAP, SonarQube), com SHA-256 de cada relatório: [docs/evidencias/README.md](docs/evidencias/README.md).

## Estrutura do repositório

| Pasta | Conteúdo |
|---|---|
| `oficina-api/` | o produto: código, migrações, testes, Dockerfile e docker-compose |
| `docs/adr/` | decisões de arquitetura |
| `docs/ddd/` | Event Storming, linguagem ubíqua, mapa de contexto e diagramas |
| `docs/arquitetura/` | C4 níveis 1, 2 e 3 (PlantUML, PNG, SVG e PDF) |
| `docs/evidencias/` | testes, cobertura e vulnerabilidades |

## Documentação DDD

- Event Storming dos três fluxos (criação da OS, acompanhamento, peças e insumos): [docs/ddd/event-storming.pdf](docs/ddd/event-storming.pdf) e o quadro no FigJam
- Linguagem ubíqua com o nome de cada termo no código e no banco: [docs/ddd/linguagem-ubiqua.md](docs/ddd/linguagem-ubiqua.md)
- Mapa de contexto: [docs/ddd/mapa-de-contexto.md](docs/ddd/mapa-de-contexto.md)
- C4 níveis 1 a 3: [docs/ddd/diagramas.pdf](docs/ddd/diagramas.pdf), fontes PlantUML em [docs/arquitetura/](docs/arquitetura/)

## Vídeo

Pendente. O link do YouTube entra no topo deste arquivo e no PDF da entrega.

## API publicada

A mesma API roda publicada para demonstração em https://oficina-fiap-soat.vercel.app/api/docs, com banco PostgreSQL gerenciado (Supabase). Os usuários de demonstração acima valem lá. A execução local pelo Docker Compose não depende dela.
