# Plano construtivo do Tech Challenge Fase 1

Carlos Frederico Ribeiro de Almeida Dominguez. SOAT, Software Architecture. Fase 1, grupo 144.
Versão 1.2, 25/10/2026. Prazo da entrega: 03/11/2026 às 23h59.

Base: enunciado "Fase 1 - Tech Challenge" e "FIAP_Plano_Construtivo" v1.0, ambos em `referencias/`. A v1.1 mudou duas decisões da v1.0 (seção 3). A v1.2 incorpora o que as aulas e o fórum da turma pedem, resumido em `referencias/curso/resumo-materiais-fase1.pdf`.

## 1. O que precisa ser entregue

O produto é o back-end (MVP) de uma oficina mecânica: ordens de serviço, clientes, veículos, serviços, peças, estoque e orçamento, com DDD, monólito em camadas, API REST documentada, JWT nas rotas administrativas, testes com cobertura mínima de 80% nos domínios críticos, Dockerfile e docker-compose.

A FIAP avalia um único PDF com identificação, links clicáveis, branch e hash do commit final. O PDF aponta para quatro coisas que precisam estar públicas durante toda a correção:

| Item | Onde fica | Estado |
|---|---|---|
| Código do back-end | GitHub público, branch `main` protegida, merge só por PR | no GitHub (`freddominugez/FIAP_CARLOS_FREDERICO`), ainda privado. Tornar público até a entrega |
| Vídeo de até 15 minutos | YouTube público | roteiro pronto em `docs/video/roteiro.md`. Falta gravar |
| Documentação DDD | FigJam (equivalente ao Miro, aceito pelo enunciado) com acesso sem pedido de permissão, exportada em `docs/ddd/` | Event Storming montado e exportado. Falta liberar o link público |
| Diagramas C4 | níveis 1, 2 e 3, exportados em `docs/arquitetura/` | feito: fontes PlantUML em `docs/arquitetura/c4/`, PNG, SVG e `c4.pdf`, conferidos contra o código |
| Evidências | cobertura e análise de vulnerabilidades em `docs/evidencias/` | feito na D+7, com SHA-256 |

O portal na Vercel reúne esses links, os diagramas, a bibliografia e o PDF. Ele complementa a entrega e não substitui o PDF enviado na plataforma.

Diagramas exigidos, confirmados pelo professor Gabriel Ribeiro no fórum da turma (23/09, 05/10 e 19/10/2026): Event Storming, linguagem ubíqua e C4 até o nível 3. O C4 pode cobrir um único cenário, e o escolhido é a aprovação do orçamento com reserva de peças, porque passa por todas as camadas e pelo banco.

Regras da turma: trabalho individual é permitido, deixando só o próprio nome no grupo. Atraso de até 3 dias corridos perde 30% da nota, e depois disso a entrega não é aceita.

Pendências: RM e username do Discord.

## 2. Estrutura do repositório

```
TECH_CHALENGER/
├── oficina-api/          produto exigido (back-end monolítico)
│   ├── src/domain/       entidades, objetos de valor, regras puras
│   ├── src/application/  casos de uso e portas (interfaces de repositório)
│   ├── src/infrastructure/  PostgreSQL, JWT, logs
│   ├── src/interfaces/http/ rotas, schemas OpenAPI, plugins Fastify
│   ├── src/main/         montagem da aplicação e servidor local
│   ├── api/              entrada da função Node na Vercel
│   ├── db/migrations, db/seeds
│   └── tests/unit, tests/integration
├── portal/               site estático publicado na Vercel
│   ├── index.html        visão geral, vídeo, diagramas, entrega
│   ├── plano.html        passo a passo, stack, regras de negócio
│   ├── referencias.html  bibliografia, vídeos, materiais
│   ├── assets/           css, js, config.js com links reais
│   └── pdfs/             plano e PDF oficial da entrega
├── docs/
│   ├── PLANO_CONSTRUTIVO.md  este documento
│   ├── adr/              decisões de arquitetura, uma por arquivo
│   ├── arquitetura/      C4 níveis 1 a 3 (workspace.dsl e exportações)
│   ├── requisitos/       requisitos, matriz de rastreabilidade, DoR e DoD
│   ├── ddd/              event-storming, mapa de contexto, linguagem ubíqua
│   └── evidencias/       testes, cobertura, vulnerabilidades
├── entrega/              PDF oficial final
├── referencias/          enunciado, plano v1.0, resumo do curso (fora do Git)
└── vercel.json
```

Esta pasta ainda não está em Git. O repositório existente é `../FIAP_CARLOS_FREDERICO`. O conteúdo de `TECH_CHALENGER/` deve ser copiado para lá, sem criar `.git` aninhado, e o caminho escolhido não deve ter espaço, porque o painel da Vercel lê o diretório raiz pelo nome.

## 3. Stack e justificativa

| Camada | Escolha | Por quê |
|---|---|---|
| Linguagem | TypeScript sobre Node.js 24 LTS | contratos tipados entre domínio, casos de uso e HTTP |
| HTTP | Fastify 5 | schema por rota gera a validação e o OpenAPI do mesmo lugar, e roda tanto em container quanto como função Node na Vercel |
| Validação e contrato | TypeBox + `@fastify/swagger` + `@fastify/swagger-ui` | um schema serve para validar entrada e para documentar |
| Banco | PostgreSQL 16 (local no Compose, Supabase em produção) | OS, orçamento e estoque dependem de FK, constraint, lock por linha e transação no mesmo banco |
| Acesso a dados | `pg` com SQL escrito à mão e `node-pg-migrate` | o SQL de reserva com `SELECT ... FOR UPDATE` fica visível e testável, sem ORM escondendo o lock |
| Autenticação | JWT emitido pela própria API (`@fastify/jwt`), senha com bcrypt | atende "JWT nas APIs administrativas" e o Compose sobe sem depender de conta externa |
| Testes | Vitest, `@vitest/coverage-v8`, Testcontainers com PostgreSQL real | atomicidade e concorrência só se provam contra banco real |
| Segurança | `npm audit`, SonarCloud, OWASP ZAP (baseline), Trivy na imagem, Gitleaks | npm audit, SonarQube e ZAP são as ferramentas das aulas de Desenvolvimento Seguro. Trivy e Gitleaks cobrem imagem e segredo |
| Qualidade | ESLint, Prettier, Husky com lint e teste no pre-push | PR para `main` só passa com CI verde |
| CI | GitHub Actions: lint, testes, cobertura com corte em 80%, SonarCloud, Trivy | evidência associada ao hash |
| Hospedagem | Vercel (portal estático + função Node com a API) | um projeto só, como pedido |

Mudanças em relação à v1.0:

1. **Autenticação.** A v1.0 usava Supabase Auth como emissor do JWT. A v1.1 emite o token na própria API. Motivo: o enunciado exige execução local simples com docker-compose, e o Supabase Auth local exige a CLI do Supabase e mais seis containers. O Supabase continua como PostgreSQL gerenciado em produção.
2. **Projeto Vercel único.** A v1.0 previa dois projetos. A v1.1 publica portal e API no mesmo projeto: o portal sai de `portal/` como estático e `/api/*` é reescrito para a função em `oficina-api/api/`. Se o build combinado falhar, volta-se ao modelo de dois projetos apontando para o mesmo repositório.

Conexão com o Supabase a partir da Vercel: usar a URL do pooler em modo transação (porta 6543), pool pequeno por instância (`max: 1` a `3`) e sem prepared statements nomeados. Estado e locks ficam no banco, nunca na memória da função.

Banco de documentos (MongoDB) ficou fora porque a aprovação reserva várias peças ao mesmo tempo e precisa falhar inteira se uma faltar. No PostgreSQL isso é uma transação com lock por linha e a constraint `fisico >= reservado`, garantida pelo banco mesmo com várias instâncias da API.

Outras alternativas descartadas: microsserviços (o enunciado pede monólito), acesso direto do navegador ao banco (contorna as regras), ORM com migração automática (esconde o SQL de concorrência).

Versões exatas são fixadas no D+2, com `package-lock.json` versionado e conferidas na documentação oficial antes de instalar.

## 4. Arquitetura do monólito

As quatro camadas seguem DDD aula 5 (interface, aplicação, domínio, infraestrutura). As portas entre aplicação e infraestrutura vêm da arquitetura hexagonal de Arquitetura de Software aula 1.

Fluxo de uma chamada: cliente HTTP, rota Fastify (valida schema e JWT), caso de uso (abre transação, aplica autorização por recurso), agregado do domínio (aplica regra), repositório PostgreSQL (persiste), resposta.

Regra de dependência: `domain` não importa nada de fora dele. `application` conhece `domain` e as portas. `infrastructure` implementa as portas. `interfaces` só chama casos de uso. Um teste de arquitetura (dependency-cruiser) quebra o build se essa direção for violada.

Contextos delimitados, todos módulos do mesmo processo:

| Contexto | Responsável por |
|---|---|
| Cadastros | Cliente, Veículo |
| Atendimento | OrdemServico, Orcamento, histórico de status |
| Catálogo e Estoque | ServicoCatalogo, Peca, MovimentoEstoque, reservas |
| Identidade e Acesso | usuários, perfis, emissão de token |

Classificação (DDD aula 1): Atendimento e Estoque formam o subdomínio principal, Cadastros é de suporte e Identidade é genérico. Relações entre contextos no mapa de contexto (DDD aula 4) em `docs/ddd/mapa-de-contexto.md`.

Agregados: `OrdemServico` (status, itens, versão para concorrência, histórico), `Orcamento` (versão, preços congelados, total, decisão), `Peca` (saldo físico, reservado, movimentos).
Objetos de valor: `DocumentoFiscal` (CPF ou CNPJ), `Placa`, `Dinheiro` (centavos, BRL), `Quantidade` (com unidade e escala).

## 5. Máquina de estados da OS

| De | Comando | Para | Quem | Pré-condição |
|---|---|---|---|---|
| (nova) | abrir OS | Recebida | atendente | cliente, veículo e ao menos uma solicitação |
| Recebida | iniciar diagnóstico | Em diagnóstico | técnico | |
| Em diagnóstico | publicar orçamento | Aguardando aprovação | técnico ou atendente | ao menos um item, total calculado |
| Aguardando aprovação | aprovar | Aguardando aprovação (decisão APROVADA) | cliente | versão atual, reserva de todas as peças |
| Aguardando aprovação | rejeitar | Aguardando aprovação (decisão REJEITADA) | cliente | versão atual |
| Aguardando aprovação | reabrir diagnóstico | Em diagnóstico | técnico ou atendente | libera reservas, invalida a versão |
| Aguardando aprovação | iniciar execução | Em execução | técnico | decisão APROVADA e reservas suficientes |
| Em execução | finalizar | Finalizada | técnico | serviços concluídos, reservas consumidas ou liberadas |
| Finalizada | entregar | Entregue | atendente | |

Qualquer outra transição retorna 409. A rejeição não cria um sétimo status: a OS fica em Aguardando aprovação com a execução bloqueada até a reabertura do diagnóstico.

Eventos de domínio: `OrdemRecebida`, `DiagnosticoIniciado`, `OrcamentoDisponibilizado`, `OrcamentoAprovado`, `OrcamentoRejeitado`, `DiagnosticoReaberto`, `ExecucaoIniciada`, `ServicoFinalizado`, `VeiculoEntregue`, `PecaReservada`, `PecaConsumida`, `ReservaLiberada`, `EstoqueAjustado`.

## 6. Regras de negócio

**RN01 Cliente.** CPF ou CNPJ validado por dígito verificador e normalizado sem pontuação. Documento único. O validador de CNPJ aceita o formato alfanumérico que a Receita Federal anunciou para 2026, e isso é conferido na norma vigente antes de implementar. Seed e vídeo só com documentos sintéticos.

**RN02 Veículo.** Placa no padrão antigo (`AAA9999`) ou Mercosul (`AAA9A99`), normalizada em maiúsculas sem hífen, única entre veículos ativos. Marca e modelo obrigatórios. Ano entre 1900 e o ano corrente mais um. Trocar o dono do veículo não altera o cliente gravado nas OS antigas.

**RN03 Ordem de serviço.** Exige cliente, veículo do mesmo cliente e ao menos uma solicitação. Tem número público sequencial (`OS-2026-000123`) separado do UUID interno. Serviço ou peça inativa não entra em OS nova. Excluir cadastro nunca apaga histórico.

**RN04 Valores.** Dinheiro em centavos inteiros (`bigint`). Total = soma de quantidade × preço unitário de serviços e peças. Preço e descrição são copiados para a versão do orçamento no momento da publicação e não mudam depois. Desconto fica fora do MVP.

**RN05 Aprovação.** A decisão grava versão, cliente e instante. Decidir sobre versão antiga retorna 409. Repetir a mesma aprovação devolve o mesmo resultado sem segunda reserva. Rejeição bloqueia a execução.

**RN06 Estoque.** Disponível = físico − reservado. Aprovar reserva todas as peças da versão ou nenhuma. Locks por peça são tomados em ordem de UUID para evitar deadlock, e a constraint `fisico >= reservado >= 0` impede saldo negativo. Duas OS disputando a última unidade: só uma aprova, a outra recebe 409.

**RN07 Consumo.** Na execução, cada reserva vira baixa física uma única vez, ligada ao item da OS. Correção é um novo movimento de estorno. Movimento gravado não é editado nem apagado. Entrada e ajuste manual são do ADMIN: ENTRADA soma ao físico, AJUSTE é baixa por perda ou inventário, exige observação e não pode tirar o que está reservado.

**RN08 Transições.** Só as da tabela da seção 5. Status, versão e pré-condições são revalidados dentro da transação. Toda mudança grava autor, status de origem, status de destino e data.

**RN09 Concorrência e idempotência.** Alterar uma OS exige a versão esperada (`If-Match` ou campo `version`), e divergência retorna 409. Criar OS, aprovar e consumir aceitam `Idempotency-Key`, ligada ao usuário e ao hash do corpo. Mesma chave com corpo diferente retorna 409.

**RN10 Tempo médio.** Entram só OS finalizadas no período. Duração = `finalizada_em − execucao_iniciada_em`, em tempo corrido, sem descontar pausas. A resposta traz média, tamanho da amostra e período. OS aberta não conta como zero.

**RN11 Perfis.**

| Perfil | Pode |
|---|---|
| ADMIN | catálogo de serviços e peças, usuários, ajuste de estoque |
| ATENDENTE | clientes, veículos, abrir OS, publicar orçamento, entregar |
| TECNICO | diagnóstico, itens do orçamento, execução, finalização |
| CLIENTE | consultar e decidir só sobre as próprias OS |

O perfil fica no banco e vai no token assinado. O vínculo entre usuário CLIENTE e cliente cadastrado é criado pelo atendente, nunca pelo próprio cliente.

**RN12 Auditoria e exclusão.** Logs sem CPF, senha ou token. OS entregue não pode ser excluída. CRUD apaga fisicamente só registro sem referência. Com referência, o `DELETE` devolve 409 `CADASTRO_COM_HISTORICO` explicando que o caminho é inativar com `PATCH { "ativo": false }`. A recusa não altera nada, para que um erro nunca mude estado.

**RN13 Falhas.** Aprovação com reserva e consumo fazem rollback completo em qualquer erro. Nenhuma chamada externa acontece com lock aberto. O orçamento é disponibilizado pela API (`GET /me/orders/{id}`), e envio por e-mail fica como extensão.

## 7. Dados e API

Tabelas: `customers`, `vehicles`, `service_catalog`, `parts`, `service_orders`, `order_service_items`, `order_part_items`, `quotes`, `quote_items`, `quote_decisions`, `stock_movements`, `status_history`, `users`, `idempotency_keys`.

Constraints principais: FK em todas as relações, `quantity > 0`, `price_cents >= 0`, `physical >= reserved AND reserved >= 0`, `UNIQUE(order_id, version)` em `quotes`, `UNIQUE(order_part_item_id)` no consumo. Índices por cliente e data, status e data, peça e data.

Rotas em `/api/v1`:

| Grupo | Rotas | Perfil |
|---|---|---|
| Autenticação | `POST /auth/login` | público |
| Cadastros | CRUD `/customers`, `/vehicles` | ATENDENTE, ADMIN |
| Catálogo | CRUD `/services`, `/parts`. Leitura também por ATENDENTE e TECNICO | ADMIN |
| Estoque | `POST /parts/{id}/movements`, `POST /parts/{id}/movements/{movimentoId}/reversal`, `GET /parts/{id}/movements` | ADMIN escreve, equipe lê |
| OS | `GET/POST /orders`, `GET /orders/{id}` | ATENDENTE, TECNICO, ADMIN |
| Fluxo da OS | `POST /orders/{id}/diagnosis`, `/services`, `/parts`, `/quotes`, `/reopen`, `/start`, `/consumptions`, `/services/{itemId}/complete`, `/finish`, `/deliver` | conforme a tabela da seção 5 |
| Decisão | `POST /quotes/{id}/decision` | CLIENTE |
| Cliente | `GET /me/orders`, `GET /me/orders/{id}` | CLIENTE |
| Indicador | `GET /metrics/execution-time?de=&ate=` | ADMIN, ATENDENTE |

Erros: 400 entrada inválida, 401 sem token, 403 perfil sem permissão, 404 recurso ausente ou de outro cliente, 409 conflito de regra ou versão, 500 sem detalhe interno. Todo erro traz `code` estável e `request_id`.

## 8. Etapas

Calendário com D+0 em 25/10/2026. Cada etapa só fecha quando o critério de saída passa.

| Dia | Data | Etapa | Critério de saída |
|---|---|---|---|
| D+0 | 25/10 | Requisitos e estrutura | checklist do enunciado com responsável e artefato por item, pastas criadas, portal no ar com o plano |
| D+1 ✅ | 25/10 | Domínio | Event Storming dos três fluxos no FigJam com a legenda de cores da aula 6, incluindo exceções. Linguagem ubíqua, mapa de contexto, C4 níveis 1 a 3, ADRs, matriz de requisitos, DoR e DoD. Rascunhos em texto já prontos em `docs/` |
| D+2 ✅ | 25/10 | Base técnica | versões fixadas, lockfile, Fastify com `/health`, migrações, login JWT, Dockerfile, Compose, CI rodando. Um clone novo sobe com `docker compose up` e passa um teste de integração |
| D+3 ✅ | 28/10 | Cadastros | CRUD de clientes, veículos, serviços e peças com validação de CPF, CNPJ e placa. Usuário sem perfil recebe 403 |
| D+4 ✅ | 29/10 | OS e orçamento | abertura, itens, cálculo, publicação com preço congelado e versão, histórico de status |
| D+5 ✅ | 30/10 | Aprovação e estoque | reserva atômica, rejeição, reabertura, idempotência. Teste com duas transações simultâneas pela última peça aprova só uma |
| D+6 ✅ | 31/10 | Execução e entrega | consumo, finalização, entrega, consulta do cliente, tempo médio. Cliente A recebe 404 na OS do cliente B |
| D+7 ✅ | 01/11 | Qualidade | cobertura ≥ 80% em `domain` e `application`, `npm audit`, SonarQube (no lugar do SonarCloud), OWASP ZAP, Trivy e Gitleaks rodados e achados tratados. Relatórios com hash em `docs/evidencias/` |
| D+8 (em andamento) | 02/11 | Documentação e vídeo | exportação DDD, README validado em máquina limpa, Swagger publicado, vídeo gravado e publicado |
| D+9 | 03/11 | Fechamento | PDF oficial com identificação, links testados em janela anônima, tag `v1.0-fase1`, submissão na FIAP até 23h59 |

Portal, em paralelo:

| Passo | Quando | Entrega |
|---|---|---|
| P1 ✅ | D+0 | `portal/` publicado na Vercel com plano, diagramas e referências |
| P2 | D+2 | domínio próprio configurado na Vercel, DNS e HTTPS conferidos |
| P3 ✅ | D+6 | `/api/v1` respondendo no mesmo projeto, Swagger em `/api/docs`. No ar em https://oficina-fiap-soat.vercel.app com banco no Supabase |
| P4 | D+8 | ID do vídeo, link do Miro, link do GitHub e hash em `portal/assets/js/config.js` |
| P5 | D+9 | PDF oficial em `portal/pdfs/` e link no topo da página inicial |

## 9. Testes e evidências

| Código | Teste | Tipo |
|---|---|---|
| T01 | CPF, CNPJ e placa válidos e inválidos | unitário |
| T02 | cálculo do orçamento, centavos, versão, preço congelado | unitário |
| T03 | todas as transições permitidas e todas as recusadas | unitário |
| T04 | versão obsoleta, decisão repetida, rejeição | integração |
| T05 | saldo insuficiente, rollback, estorno, duas aprovações simultâneas | integração com PostgreSQL real |
| T06 | JWT ausente, expirado, assinatura errada, perfil errado | integração |
| T07 | cliente A tenta ler e aprovar OS de B | integração |
| T08 | idempotência: mesma chave, mesmo efeito, corpo diferente dá 409 | integração |
| T09 | tempo médio sem amostra, com OS aberta, com OS finalizada | unitário e integração |
| T10 | jornada completa do cadastro à entrega | integração |
| T11 | instalação limpa com Compose, migração, seed e Swagger | manual, com roteiro |

A cobertura é medida em `src/domain` e `src/application`, com `thresholds` de 80% no Vitest. Exclusões ficam listadas no README. Cada relatório registra comando, data e hash.

Matriz de rastreabilidade em `docs/requisitos/matriz-rastreabilidade.md`, no formato de Arquitetura de Software aula 3: ID, descrição, caso de uso, critério de teste, ADR. A coluna de evidência e commit é preenchida no D+7.

Cada funcionalidade passa pela DoR antes de começar e pela DoD antes de fechar (DDD aula 9), conforme `docs/requisitos/dor-dod.md`.

## 10. DDD e vídeo

Entregáveis confirmados pelo professor: Event Storming, linguagem ubíqua e C4 até o nível 3.

| Artefato | Rascunho | Exportação final |
|---|---|---|
| Event Storming (3 fluxos) | `docs/ddd/event-storming.md` | FigJam `NKQrpQI2vGYRkX8YnBAZMN`, exportado em `docs/ddd/event-storming.pdf` |
| Linguagem ubíqua | `docs/ddd/linguagem-ubiqua.md` | o próprio arquivo |
| Mapa de contexto | `docs/ddd/mapa-de-contexto.md` | o próprio arquivo, com diagrama Mermaid renderizado pelo GitHub |
| C4 níveis 1, 2 e 3 | `docs/arquitetura/c4/*.puml` (PlantUML com C4-PlantUML) | `docs/arquitetura/c4.pdf`, PNG e SVG. O C4 desenhado no FigJam antes da implementação fica como rascunho |
| ADRs | `docs/adr/` | os próprios arquivos |

Cada termo da linguagem ubíqua aponta para o nome no código e no banco. O vídeo não precisa de câmera: tela gravada com narração, começando por nome, curso, fase e grupo.

Roteiro de até 15 minutos, detalhado com a sequência no Swagger em `docs/video/roteiro.md`:

| Tempo | Conteúdo |
|---|---|
| 0:00 a 1:00 | identificação e proposta |
| 1:00 a 3:00 | arquitetura, camadas, banco e por que PostgreSQL |
| 3:00 a 5:00 | Event Storming e elementos de DDD |
| 5:00 a 10:00 | jornada real: OS, serviços, peças, orçamento, aprovação, status |
| 10:00 a 12:00 | JWT, perfis, isolamento entre clientes, erros |
| 12:00 a 14:00 | testes, cobertura, análise de vulnerabilidades |
| 14:00 a 15:00 | execução local, Swagger, commit da entrega |

## 11. Checklist final

- [ ] RM e Discord preenchidos no PDF
- [ ] GitHub público, `main` protegida, tag e hash informados
- [x] README com todos os itens que o enunciado lista, validado num clone limpo
- [ ] YouTube público, até 15 minutos, mesmo commit do PDF
- [ ] FigJam com link público de visualização e exportado em `docs/ddd/`
- [x] C4 níveis 1, 2 e 3 exportados
- [ ] Atraso evitado: depois de 03/11 a nota perde 30%
- [x] Cobertura ≥ 80% e relatório de vulnerabilidades com hash
- [x] Nenhum segredo no Git, `.env.example` só com valores fictícios
- [ ] Links do PDF testados em janela anônima
- [ ] PDF enviado na plataforma FIAP antes de 03/11/2026 às 23h59
