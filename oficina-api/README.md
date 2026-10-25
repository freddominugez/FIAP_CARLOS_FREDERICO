# Oficina API

Back-end (MVP) de uma oficina mecânica: ordens de serviço, clientes, veículos, serviços, peças, estoque e orçamento. Tech Challenge Fase 1, FIAP SOAT.

> Fluxo completo da OS, do cadastro à entrega, com qualidade e segurança verificadas (D+7). Visão geral da entrega no [README da raiz](../README.md).

## Objetivo e solução

Substituir anotações e planilhas por um sistema que controla a ordem de serviço do recebimento à entrega, gera orçamento versionado, registra a aprovação do cliente e reserva o estoque na mesma transação.

## Arquitetura

Monólito em quatro camadas (DDD aula 5), com portas entre aplicação e infraestrutura.

```
src/
├── domain/           regras puras: erros, perfis, agregados (sem dependência externa)
├── application/      casos de uso e portas (interfaces de repositório)
├── infrastructure/   PostgreSQL, bcrypt, repositórios
├── interfaces/http/  rotas Fastify, schemas, plugins (JWT, erros)
└── main/             composição, servidor, configuração, seed
```

A direção das dependências é verificada por `npm run arch` (dependency-cruiser) e quebra o CI se for violada. Decisões em [docs/adr](../docs/adr).

## Tecnologias

TypeScript 6, Node.js 24, Fastify 5, TypeBox, PostgreSQL 16, `pg`, node-pg-migrate, @fastify/jwt, bcryptjs, Vitest 5, Testcontainers, ESLint, dependency-cruiser, Docker.

## Banco de dados

PostgreSQL. Aprovar um orçamento reserva várias peças, e se uma faltar nenhuma pode ficar reservada. Isso pede transação, lock por linha e constraint de saldo (`physical >= reserved >= 0`) garantidos pelo banco, mesmo com várias instâncias da API. Justificativa completa em [ADR 0002](../docs/adr/0002-postgresql.md).

## Pré-requisitos

- Docker com Compose
- Node.js 22.12 ou superior, só para rodar fora do container

## Execução

```bash
docker compose up --build
```

A API sobe em `http://localhost:3000`, aplica as migrações e cria os usuários de demonstração.

| Recurso | URL |
|---|---|
| Health | `GET /api/v1/health` |
| Swagger | `http://localhost:3000/api/docs` |
| OpenAPI JSON | `http://localhost:3000/api/docs/json` |

Fora do container:

```bash
cp .env.example .env      # ajustar DATABASE_URL
npm ci
npm run migrate
npm run seed
npm run dev
```

## Autenticação e usuários de demonstração

`POST /api/v1/auth/login` com e-mail e senha devolve um JWT. Nas demais rotas, enviar `Authorization: Bearer <token>`. O token expira em 1 hora.

| Perfil | E-mail | Senha |
|---|---|---|
| ADMIN | admin@oficina.local | Oficina@2026 |
| ATENDENTE | atendente@oficina.local | Oficina@2026 |
| TECNICO | tecnico@oficina.local | Oficina@2026 |

Dados fictícios, criados só quando `SEED_DEMO=true`. O usuário CLIENTE é criado pelo atendente em `POST /api/v1/customers/{id}/user`, um por cliente.

## Rotas

Todas sob `/api/v1`. Contrato completo no Swagger.

| Recurso | Rotas | Perfis |
|---|---|---|
| Autenticação | `POST /auth/login`, `GET /auth/me` | todos |
| Clientes | `POST`, `GET /customers`, `GET`, `PATCH`, `DELETE /customers/{id}`, `POST /customers/{id}/user` | ATENDENTE, ADMIN |
| Veículos | `POST`, `GET /vehicles`, `GET`, `PATCH`, `DELETE /vehicles/{id}` | ATENDENTE, ADMIN |
| Serviços | `POST`, `GET /services`, `GET`, `PATCH`, `DELETE /services/{id}` | escrita ADMIN, leitura também ATENDENTE e TECNICO |
| Peças e insumos | `POST`, `GET /parts`, `GET`, `PATCH`, `DELETE /parts/{id}` | escrita ADMIN, leitura também ATENDENTE e TECNICO |
| Ordens de serviço | `POST /orders` | ATENDENTE, ADMIN |
| | `GET /orders`, `GET /orders/{id}` | ATENDENTE, TECNICO, ADMIN |
| | `POST /orders/{id}/diagnosis`, `POST`, `DELETE /orders/{id}/services`, `POST`, `DELETE /orders/{id}/parts` | TECNICO |
| | `POST /orders/{id}/quotes`, `POST /orders/{id}/reopen` | TECNICO, ATENDENTE |
| | `POST /orders/{id}/start`, `/consumptions`, `/services/{itemId}/complete`, `/finish` | TECNICO |
| | `POST /orders/{id}/deliver` | ATENDENTE |
| Decisão do orçamento | `POST /quotes/{id}/decision` | CLIENTE, só nas próprias OS |
| Cliente | `GET /me/orders`, `GET /me/orders/{id}` | CLIENTE |
| Indicador | `GET /metrics/execution-time?de=&ate=` | ADMIN, ATENDENTE |
| Estoque | `POST /parts/{id}/movements`, `POST /parts/{id}/movements/{movimentoId}/reversal` | ADMIN |
| | `GET /parts/{id}/movements` | ADMIN, ATENDENTE, TECNICO |

Regras dos cadastros:

- CPF e CNPJ validados pelo dígito verificador, aceitos com ou sem pontuação e gravados sem ela. O CNPJ aceita o formato alfanumérico da IN RFB 2.229/2024, por exemplo `12.ABC.345/01DE-35`.
- Placa antiga (`ABC1234`) ou Mercosul (`ABC1D23`), gravada em maiúsculas e sem hífen. Não se repete entre veículos ativos.
- Preço sempre em centavos inteiros. Peça nasce com saldo zero, e o saldo só muda por movimento de estoque.
- `DELETE` de registro com histórico devolve 409 `CADASTRO_COM_HISTORICO` e não altera nada. Para tirar de uso, `PATCH { "ativo": false }`.
- Listagens aceitam `limite` (1 a 100) e `deslocamento`. A URL vai para o log sem a query string, para não registrar CPF ou placa.

Regras da OS até o orçamento:

- A OS nasce em `RECEBIDA`, com número público `OS-AAAA-NNNNNN`. O veículo precisa ser do cliente informado, e os dois precisam estar ativos.
- `POST /orders` aceita o cabeçalho `Idempotency-Key`. A mesma chave com o mesmo corpo devolve a mesma OS, com `idempotent-replayed: true`. A mesma chave com outro corpo devolve 409.
- Toda mudança de status leva `versao` no corpo. Se a OS mudou depois da leitura, a resposta é 409 `VERSAO_DESATUALIZADA`. Incluir ou remover item também incrementa a versão.
- Itens só entram em `EM_DIAGNOSTICO`. Peça é inteira, insumo aceita até 3 casas. O total da linha é calculado em centavos, com meio centavo arredondado para cima.
- A publicação copia descrição e preço para uma nova versão do orçamento e leva a OS para `AGUARDANDO_APROVACAO`. Mudar o catálogo depois disso não altera o orçamento publicado.
- Transição fora da tabela devolve 409 `TRANSICAO_INVALIDA`. Toda mudança de status entra no histórico com autor e data.

Regras de aprovação e estoque:

- O cliente aprova ou rejeita a versão publicada. A OS continua em `AGUARDANDO_APROVACAO`: a aprovação libera o início da execução, e a rejeição o bloqueia até a reabertura do diagnóstico.
- Aprovar reserva todas as peças e insumos da versão na mesma transação. Se faltar uma, nada é reservado e a resposta é 409 `ESTOQUE_INSUFICIENTE`, com a lista do que falta.
- As peças são bloqueadas sempre em ordem de UUID. Duas OS disputando a última unidade: uma aprova e a outra recebe 409. Duas OS pedindo as mesmas peças em ordem inversa não travam.
- Repetir a mesma decisão devolve o mesmo resultado sem reservar de novo. Mudar a decisão dá 409 `DECISAO_JA_REGISTRADA`. Decidir sobre versão invalidada dá 409 `ORCAMENTO_OBSOLETO`.
- Orçamento de outro cliente responde 404, sem revelar que existe.
- A reabertura invalida a versão pendente ou aprovada e libera as reservas, cada liberação apontando para a reserva que desfaz. A versão rejeitada fica no histórico como estava.
- Saldo só muda por movimento, e movimento não é editado nem apagado. ENTRADA soma ao físico. AJUSTE é baixa por perda ou inventário, exige observação e não pode tirar o que está reservado.

Regras da execução à entrega:

- A execução só começa com a versão atual do orçamento aprovada. Pendente ou rejeitada dá 409 `ORCAMENTO_NAO_APROVADO`.
- Cada linha de peça é consumida uma vez: a reserva vira baixa física. Repetir devolve o mesmo resultado, sem nova baixa.
- Finalizar exige todos os serviços concluídos. Peça reservada e não usada volta ao disponível com uma liberação.
- Só o atendente registra a entrega. O histórico mostra os seis status com autor e data.
- O cliente vê as próprias OS em `/me/orders`, sem itens de rascunho nem identificação de quem operou. OS de outro cliente responde 404.
- Erro de estoque se corrige com estorno de entrada, ajuste ou consumo. O estorno é um movimento novo que aponta para o original, uma vez por movimento.
- Tempo médio: média de (finalização menos início da execução) das OS finalizadas em `[de, ate)`, com o tamanho da amostra. Sem amostra, a média é `null`, nunca zero. Período máximo de um ano.

## Publicação na Vercel

Produção: https://oficina-fiap-soat.vercel.app (portal), https://oficina-fiap-soat.vercel.app/api/docs (Swagger). Os usuários de demonstração da tabela acima valem também lá.

O `vercel.json` na raiz do repositório publica portal e API no mesmo projeto, com Vercel Services ([ADR 0005](../docs/adr/0005-hospedagem-vercel-supabase.md)). `/api/*` vai para este app, e o resto para `portal/`.

**Banco.** Schema `oficina` no projeto Supabase `fdjquokigoupvqrgtqmt` (região São Paulo), acessado só pelo usuário `oficina_app`. Esse usuário tem `search_path = oficina`, cria objetos só nesse schema e não tem permissão em nenhum outro. Os papéis `anon` e `authenticated` do Supabase não enxergam o schema. A senha fica em `.env.supabase`, fora do Git.

| Uso | Endereço | Porta |
|---|---|---|
| API (Vercel) | `aws-1-sa-east-1.pooler.supabase.com`, modo transação | 6543 |
| Migrações e seed | `aws-1-sa-east-1.pooler.supabase.com`, modo sessão | 5432 |

O usuário de conexão no pooler é `oficina_app.fdjquokigoupvqrgtqmt`. A conexão usa TLS verificado contra a CA do Supabase, salva em `certs/supabase-root-2021-ca.crt` (SHA-256 `80:70:25:AD:...:72:E6:CA:FA`, válida até 2031).

Migrações (modo sessão, porque o `node-pg-migrate` usa lock de sessão):

```bash
set -a; . ./.env.supabase; set +a
DATABASE_URL="postgres://oficina_app.$SUPABASE_REF:$OFICINA_DB_PASSWORD@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=verify-full&sslrootcert=certs/supabase-root-2021-ca.crt" \
  npx node-pg-migrate up --migrations-dir db/migrations --migration-file-language sql --schema oficina
```

Variáveis no painel da Vercel (serviço `api`):

| Variável | Valor |
|---|---|
| `DATABASE_URL` | `postgres://oficina_app.fdjquokigoupvqrgtqmt:<senha>@aws-1-sa-east-1.pooler.supabase.com:6543/postgres`, sem `sslmode` |
| `DATABASE_SSL_CA` | conteúdo de `certs/supabase-root-2021-ca.crt` |
| `DATABASE_POOL_MAX` | `3` |
| `JWT_SECRET` | 32 caracteres ou mais, diferente do local |

Dois cuidados que o deploy exigiu, explicados no ADR 0005: o `overrides` de `content-disposition` no `package.json` e o `server.listen()` direto quando `VERCEL` está definida. `npm run build && npm run check:carga` confere o primeiro localmente.

O seed de demonstração não roda na Vercel. Os 3 usuários de demonstração já foram criados no Supabase. Para recriar, rodar `npm run seed` localmente com a URL do modo sessão e `DATABASE_SSL_CA`.

## Qualidade e segurança

Relatórios da D+7 em [docs/evidencias](../docs/evidencias/README.md), com SHA-256 de cada arquivo: testes, cobertura, npm audit, Gitleaks, Trivy, OWASP ZAP e SonarQube. Resumo: 0 vulnerabilidades abertas, quality gate do SonarQube aprovado, cobertura de 100% das linhas em domínio e aplicação. Os achados e o tratamento de cada um estão no mesmo arquivo.

Proteções na borda HTTP que saíram dessas varreduras:

- caractere nulo no corpo ou na URL devolve 400, em vez de chegar ao banco;
- cabeçalhos `X-Content-Type-Options`, `Cross-Origin-Resource-Policy`, `X-Frame-Options`, `Referrer-Policy` e `Cache-Control: no-store` nas respostas da API;
- a imagem final não tem npm nem corepack, só `node`.

## Testes

```bash
npm test              # unitários e integração
npm run coverage      # com cobertura e corte de 80% em domain e application
npm run lint
npm run typecheck
npm run arch
```

Os testes de integração usam PostgreSQL real. Por padrão sobem um container com Testcontainers. Se o Docker local não encaminhar portas para o host (caso de algumas instalações do Colima), aponte para um servidor já em execução:

```bash
TEST_DATABASE_URL=postgres://postgres:teste@localhost:5432/postgres npm test
```

Cada suíte cria e apaga um banco próprio nesse servidor.

## Links

- Plano construtivo: [docs/PLANO_CONSTRUTIVO.md](../docs/PLANO_CONSTRUTIVO.md)
- Documentação DDD: [docs/ddd](../docs/ddd), quadro FigJam https://www.figma.com/board/NKQrpQI2vGYRkX8YnBAZMN
- C4 níveis 1 a 3: [docs/arquitetura/c4.pdf](../docs/arquitetura/c4.pdf)
- Evidências de qualidade e segurança: [docs/evidencias](../docs/evidencias/README.md)
- Roteiro do vídeo: [docs/video/roteiro.md](../docs/video/roteiro.md)
- Vídeo da entrega: pendente
