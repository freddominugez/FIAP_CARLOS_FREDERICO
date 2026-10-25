# Roteiro do vídeo (até 15 minutos)

Tela gravada com narração, sem câmera. Publicar no YouTube como **público** ou **não listado** e conferir em janela anônima. O vídeo mostra o mesmo commit informado no PDF.

## Antes de gravar

1. Banco de produção limpo, só com os 3 usuários de demonstração. Assim a primeira OS aparece como `OS-2026-000001`.
2. Abas abertas, nesta ordem:
   - portal: https://oficina-fiap-soat.vercel.app
   - Swagger: https://oficina-fiap-soat.vercel.app/api/docs
   - GitHub, no commit da entrega
   - `docs/arquitetura/c4.pdf` e `docs/ddd/event-storming.pdf`
   - terminal em `oficina-api/`
3. Fazer uma chamada ao health antes de gravar, para a função sair da partida a frio (cerca de 3 s).
4. Dados sintéticos, nunca documento real:
   - CPF `529.982.247-25`
   - CNPJ alfanumérico `12.ABC.345/01DE-35`, exemplo da própria Receita
   - placa `BRA2E19`

## Blocos

| Tempo | Na tela | Pontos de fala |
|---|---|---|
| 0:00 a 1:00 | portal, topo | nome, curso SOAT, Fase 1, grupo 144. Problema da oficina: anotação à mão, estoque sem controle, cliente sem visibilidade. O que foi construído: back-end com OS, orçamento, aprovação e estoque |
| 1:00 a 3:00 | C4 níveis 1 e 2, depois `oficina-api/src` no editor | monólito em quatro camadas (`domain`, `application`, `infrastructure`, `interfaces/http`). Domínio sem dependência externa, verificado pelo `npm run arch`. PostgreSQL porque aprovar reserva várias peças numa transação, com lock por linha e constraint de saldo (ADR 0002) |
| 3:00 a 5:00 | Event Storming, linguagem ubíqua, mapa de contexto | os três fluxos. Quatro contextos. Termos da oficina com o mesmo nome no código: `OrdemServico`, `Orcamento`, `reservarOrcamento`. Máquina de 6 status |
| 5:00 a 10:00 | Swagger | jornada real, sequência abaixo |
| 10:00 a 12:00 | Swagger | segurança, sequência abaixo |
| 12:00 a 14:00 | terminal e `docs/evidencias/README.md` | `npm run coverage` (189 testes, 100% das linhas em domínio e aplicação). Teste de duas aprovações simultâneas pela última peça. Trivy, ZAP, SonarQube e Gitleaks: o que acharam e como foi corrigido, com o caractere nulo que derrubava a API com 500 |
| 14:00 a 15:00 | terminal e GitHub | `docker compose up --build` sobe tudo do zero. Swagger local. Commit da entrega e link do PDF |

## Sequência no Swagger (5:00 a 10:00)

No Swagger, cada login devolve um `token`. Clicar em **Authorize** e colar o token (sem a palavra Bearer). Trocar de token ao trocar de perfil.

1. **ADMIN** (`admin@oficina.local`):
   - `POST /services`: `{"nome":"Revisão","precoCentavos":20000}`
   - `POST /parts`: `{"sku":"FLT-01","nome":"Filtro de óleo","tipo":"PECA","unidade":"UN","precoCentavos":3500}`
   - `POST /parts/{id}/movements`: `{"tipo":"ENTRADA","quantidade":5}`
2. **ATENDENTE**:
   - `POST /customers`: `{"documento":"12.ABC.345/01DE-35","nome":"Frota Demo"}`. Mostrar o documento gravado sem pontuação
   - `POST /vehicles` com a placa `bra-2e19`. Mostrar a placa normalizada
   - `POST /customers/{id}/user`: `{"email":"frota@cliente.com","senha":"senha-cliente"}`
   - `POST /orders`: `{"clienteId":"...","veiculoId":"...","solicitacao":"Revisão dos 30 mil km"}`. Status `RECEBIDA`, número público, `versao` 1
3. **TECNICO**:
   - `POST /orders/{id}/diagnosis` com `{"versao":1}`
   - incluir o serviço e 2 filtros (`POST /orders/{id}/services` e `/parts`)
   - `POST /orders/{id}/quotes` com a versão atual. Orçamento versão 1, R$ 270,00, preços congelados
4. **CLIENTE** (`frota@cliente.com`):
   - `POST /quotes/{id}/decision` com `{"decisao":"APROVADO"}`
   - `GET /parts/{id}`: reservado 2, disponível 3
   - `GET /me/orders/{id}`: o cliente vê o orçamento e o histórico
5. **TECNICO**:
   - `/start`, depois `/consumptions` com a linha do filtro
   - `/services/{itemId}/complete` e `/finish`
6. **ATENDENTE**: `/deliver`. Histórico com os 6 status.
7. **ADMIN**: `GET /metrics/execution-time` com o dia de hoje, por exemplo `de=2026-11-02T00:00:00-03:00` e `ate=2026-11-03T00:00:00-03:00`. Amostra 1.

## Segurança (10:00 a 12:00)

- sem token: `GET /customers` devolve 401
- token de TECNICO em `POST /orders`: 403
- versão antiga em `/quotes`: 409 `VERSAO_DESATUALIZADA`
- CPF com dígito errado: 400 `DOCUMENTO_INVALIDO`
- criar um segundo cliente com acesso e pedir `GET /me/orders/{id}` da OS do primeiro: 404, sem revelar que a OS existe
- repetir a aprovação: mesmo resultado, sem reservar de novo
- opcional: `node scripts/roteiro-ponta-a-ponta.mjs`, que mostra duas OS disputando a última unidade (200 e 409)

## Depois de gravar

- conferir duração (até 15:00), áudio e legibilidade do texto na tela
- publicar e testar o link em janela anônima
- preencher `youtubeId` em `portal/assets/js/config.js`
- zerar o banco de produção de novo, se a gravação criou dados
