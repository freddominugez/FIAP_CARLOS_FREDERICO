# Matriz de rastreabilidade

Formato de Arquitetura de Software aula 3: ID, descrição, caso de uso, critério de teste, ADR. Evidência e commit entram no D+7.

## Requisitos funcionais

| ID | Descrição | Caso de uso | Regra | Teste | ADR | Evidência |
|---|---|---|---|---|---|---|
| RF01 | identificar cliente por CPF/CNPJ | `GerenciarClientes.criar`, `.listar` | RN01 | T01 | | `tests/unit/documento-placa.test.ts`, `tests/integration/cadastros.test.ts` |
| RF02 | cadastrar veículo com placa, marca, modelo, ano | `GerenciarVeiculos.criar` | RN02 | T01 | | `tests/unit/documento-placa.test.ts`, `tests/integration/cadastros.test.ts` |
| RF03 | abrir OS com serviços solicitados | `GerenciarOrdens.abrir` | RN03, RN09 | T10 | | `tests/integration/ordens.test.ts` |
| RF04 | incluir peças e insumos na OS | `GerenciarOrdens.adicionarServico`, `.adicionarPeca` | RN03, RN04 | T02 | | `tests/unit/orcamento.test.ts`, `tests/integration/ordens.test.ts` |
| RF05 | gerar orçamento automático | `GerenciarOrdens.publicarOrcamento` | RN04 | T02 | 0004 | `tests/unit/orcamento.test.ts`, `tests/integration/ordens.test.ts` |
| RF06 | disponibilizar orçamento ao cliente | `ConsultarMinhasOrdens.detalhar` | RN13 | T07 | | `tests/integration/execucao-entrega.test.ts` |
| RF07 | registrar aprovação ou rejeição | `DecidirOrcamento`, `GerenciarOrdens.reabrirDiagnostico` | RN05, RN06, RN09 | T04, T05, T08 | 0002 | `tests/unit/estoque.test.ts`, `tests/integration/aprovacao-estoque.test.ts` |
| RF08 | controlar os 6 status e as transições | `transicionar` no domínio e comandos de `GerenciarOrdens` | RN08 | T03 | | `tests/unit/ordem-servico.test.ts`, `tests/integration/ordens.test.ts` |
| RF09 | cliente consulta andamento pela API | `ConsultarMinhasOrdens.listar`, `.detalhar` | RN11 | T07 | 0003 | `tests/integration/execucao-entrega.test.ts` (cliente B recebe 404 na OS do cliente A) |
| RF10 | CRUD de clientes, veículos, serviços, peças | `GerenciarClientes`, `GerenciarVeiculos`, `GerenciarServicos`, `GerenciarPecas` | RN11, RN12 | T10 | | `tests/integration/cadastros.test.ts` |
| RF11 | controle de estoque | `MovimentarEstoque`, `reservarOrcamento`, `liberarReservas`, `ExecutarOrdens.consumirPeca` | RN06, RN07 | T05 | 0002 | `tests/unit/estoque.test.ts`, `tests/integration/aprovacao-estoque.test.ts`, `tests/integration/execucao-entrega.test.ts` |
| RF12 | listar e detalhar OS | `GerenciarOrdens.listar`, `.buscar` | RN11 | T10 | | `tests/integration/ordens.test.ts` |
| RF13 | tempo médio de execução | `ExecutarOrdens.tempoMedio` | RN10 | T09 | | `tests/integration/execucao-entrega.test.ts` (2 h e 4 h dão 3 h, amostra 2) |

## Requisitos não funcionais

| ID | Descrição | Como se verifica | Teste | ADR | Evidência |
|---|---|---|---|---|---|
| RNF01 | monólito em camadas | dependency-cruiser no CI | build | 0001 | |
| RNF02 | banco justificado | ADR do banco | | 0002 | |
| RNF03 | REST documentado em OpenAPI | `/api/docs` acessível | T11 | | |
| RNF04 | JWT nas rotas administrativas | 401 e 403 nos casos inválidos | T06 | 0003 | |
| RNF05 | cobertura ≥ 80% em domínio e aplicação | threshold do Vitest falha o CI | CI | | |
| RNF06 | transação nos fluxos principais | rollback provado com banco real | T05 | 0002 | `tests/integration/aprovacao-estoque.test.ts` (falta de uma peça cancela todas) |
| RNF07 | execução local simples | clone limpo e `docker compose up` | T11 | 0003 | |
| RNF08 | sem vulnerabilidade alta aberta | npm audit, SonarCloud, ZAP, Trivy | CI | | |
| RNF09 | logs sem dado pessoal | URL registrada sem query string, cabeçalho de autorização e senha mascarados | revisão | | logs do Compose conferidos na D+3 |
