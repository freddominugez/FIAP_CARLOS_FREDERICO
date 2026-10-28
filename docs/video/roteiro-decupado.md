# Roteiro decupado do vídeo: narração, imagens e montagem

Documento de produção do vídeo da entrega (Tech Challenge Fase 1, FIAP SOAT, grupo 144). Complementa o [roteiro.md](roteiro.md), que continua valendo como checklist de gravação.

Serve a dois usos:

1. **Gravar a narração no ElevenLabs.** Cada cena tem um bloco `NARRAÇÃO` pronto para colar, já escrito para leitura em voz alta (números por extenso, siglas na forma falada). Cada bloco vira um arquivo de áudio `audio/A##.mp3`.
2. **Montagem por um LLM ou editor.** Cada cena diz qual imagem ou gravação de tela entra, o que acontece nela, os textos sobrepostos e a transição. No fim há um manifesto em JSON com a mesma informação.

## 1. Ficha técnica

| Item | Valor |
|---|---|
| Duração alvo | até 15 min (limite do enunciado). A narração soma cerca de 1.240 palavras, uns 8 min 30 s de áudio. Os tempos de cada cena abaixo deixam folga para as telas do Swagger, que podem ficar um pouco mais longas que a fala |
| Formato | 1920 x 1080, 30 fps, MP4 (H.264 + AAC) |
| Voz | ElevenLabs, modelo Multilingual v2, português do Brasil, voz masculina calma. Stability 50, Similarity 75, Style 0, Speaker boost ligado |
| Ritmo esperado | cerca de 150 palavras por minuto. A duração real de cada cena é a do áudio gerado |
| Trilha | opcional, instrumental neutra a -28 dB sob a voz. Sem trilha nas cenas 09 a 16 (Swagger), para não competir com a leitura da tela |
| Fonte dos textos na tela | Inter ou a do portal, branca com sombra, ou caixa escura com 80% de opacidade |
| Publicação | YouTube, público ou não listado |

## 2. Regras de montagem (para o LLM)

1. **O áudio manda no tempo.** A cena dura o tempo do seu `A##.mp3` mais a folga indicada. Se a gravação de tela for mais longa, acelerar até 2x ou cortar os trechos de espera (carregamento, digitação). Se for mais curta, congelar o último quadro.
2. **Imagem estática nunca fica parada.** Aplicar zoom lento (Ken Burns) de 100% para 110% ao longo da cena, ou o movimento indicado.
3. **Ao falar de um campo da resposta da API** (status, número, total), destacar o campo na tela com retângulo ou zoom de 150% no trecho do JSON.
4. **Transição padrão:** corte seco. Fade de 0,5 s só onde a cena indicar.
5. **Textos sobrepostos** (`TEXTO NA TELA`) entram 0,5 s depois do início da fala correspondente e ficam até o fim da frase.
6. **Nenhum dado real.** Só os dados sintéticos listados na seção 4.
7. **Soma final** deve ficar abaixo de 15:00. Se passar, cortar primeiro as folgas, depois acelerar as cenas 09 a 13.

## 3. Lista de imagens e gravações

### 3.1 Imagens que já estão no repositório

| ID | Arquivo | Conteúdo |
|---|---|---|
| IMG-C4-1 | `portal/assets/img/c4-n1-contexto.png` | C4 nível 1, contexto |
| IMG-C4-2 | `portal/assets/img/c4-n2-conteineres.png` | C4 nível 2, contêineres |
| IMG-C4-3 | `portal/assets/img/c4-n3-componentes-aprovacao.png` | C4 nível 3, componentes da aprovação |
| IMG-ES-0 | `docs/ddd/img/00-legenda.png` | legenda de cores do Event Storming |
| IMG-ES-1 | `docs/ddd/img/01-criacao-os.png` | Event Storming, criação da OS |
| IMG-ES-2 | `docs/ddd/img/02-acompanhamento-os.png` | Event Storming, acompanhamento da OS |
| IMG-ES-3 | `docs/ddd/img/03-pecas-insumos.png` | Event Storming, peças e insumos |

Versões vetoriais (para zoom sem perda): `docs/arquitetura/c4/*.svg`.

### 3.2 Capturas de tela a fazer (imagem parada)

| ID | O que capturar |
|---|---|
| CAP-PORTAL-TOPO | https://oficina-fiap-soat.vercel.app, topo da página |
| CAP-PORTAL-SOLUCAO | mesma página, rolada até a seção que descreve problema e solução |
| CAP-LINGUAGEM | `docs/ddd/linguagem-ubiqua.md` renderizado no GitHub, tabela com `StatusOS` visível |
| CAP-MAPA | `docs/ddd/mapa-de-contexto.md` renderizado no GitHub, diagrama Mermaid visível |
| CAP-ADR-0002 | `docs/adr/0002-postgresql.md` renderizado no GitHub |
| CAP-EVIDENCIAS | `docs/evidencias/README.md` no GitHub, tabela "Resultado" |
| CAP-ACHADOS | `docs/evidencias/README.md` no GitHub, tabela "Achados e tratamento", linha 1 visível |
| CAP-GITHUB-COMMIT | página do commit da entrega no GitHub |

### 3.3 Gravações de tela a fazer (vídeo)

Gravar sem áudio, em 1920 x 1080, com zoom do navegador em 125% para o JSON ficar legível. Ver a sequência exata de chamadas na seção 5 (cenas 09 a 16).

| ID | Onde | Ação gravada |
|---|---|---|
| GRV-EDITOR | editor de código | árvore `oficina-api/src` expandida: `domain`, `application`, `infrastructure`, `interfaces/http`, `main` |
| GRV-ARCH | terminal em `oficina-api/` | `npm run arch` terminando sem violações |
| GRV-SW-ADMIN-1 | Swagger publicado | login ADMIN, Authorize, criar serviço, criar peça, entrada de 5 unidades |
| GRV-SW-ATEND | Swagger | login ATENDENTE, criar cliente, veículo, acesso do cliente, abrir OS |
| GRV-SW-TEC-1 | Swagger | login TECNICO, diagnóstico, incluir serviço e 2 filtros, publicar orçamento |
| GRV-SW-CLIENTE | Swagger | login CLIENTE, aprovar orçamento, consultar peça, consultar a própria OS |
| GRV-SW-FIM | Swagger | TECNICO inicia, consome, conclui serviço, finaliza. ATENDENTE entrega. ADMIN consulta métrica |
| GRV-SEG-1 | Swagger | 401 sem token e 403 com TECNICO |
| GRV-SEG-2 | Swagger | 409 versão desatualizada e 400 documento inválido |
| GRV-SEG-3 | Swagger | 404 da OS de outro cliente e aprovação repetida |
| GRV-COVERAGE | terminal | `npm run coverage` com o resumo final (189 testes, tabela de cobertura) |
| GRV-TESTE-CONC | editor | `tests/integration/aprovacao-estoque.test.ts`, bloco `describe('concorrência')`, linha 262 em diante |
| GRV-E2E | terminal (opcional) | `node scripts/roteiro-ponta-a-ponta.mjs`, trecho das duas OS disputando a última unidade (200 e 409) |
| GRV-COMPOSE | terminal | `docker compose up --build` até a API responder, depois `http://localhost:3000/api/docs` no navegador |

## 4. Dados da demonstração

| Dado | Valor |
|---|---|
| ADMIN | `admin@oficina.local` / `Oficina@2026` |
| ATENDENTE | `atendente@oficina.local` / `Oficina@2026` |
| TECNICO | `tecnico@oficina.local` / `Oficina@2026` |
| CLIENTE | `frota@cliente.com` / `senha-cliente` (criado na demo) |
| CNPJ alfanumérico | `12.ABC.345/01DE-35` (exemplo da Receita) |
| CPF válido | `529.982.247-25` |
| CPF inválido | `529.982.247-26` |
| Placa | `bra-2e19` (vira `BRA2E19`) |
| Serviço | Revisão, R$ 200,00 |
| Peça | FLT-01, Filtro de óleo, R$ 35,00, 5 unidades em estoque |
| Orçamento | 1 revisão + 2 filtros = R$ 270,00 |

Antes de gravar: banco de produção limpo e uma chamada a `/api/v1/health` para aquecer a função.

## 5. Decupagem cena a cena

Formato de cada cena:

- **Tempo**: posição aproximada no vídeo final
- **Visual**: o que aparece e como se move
- **Texto na tela**: sobreposições
- **Narração**: texto para colar no ElevenLabs (arquivo de áudio entre colchetes)

---

### Bloco 1. Abertura (0:00 a 1:05)

#### Cena 01. Apresentação

- **Tempo:** 0:00 a 0:35
- **Visual:** CAP-PORTAL-TOPO. Fade de entrada de 1 s a partir do preto. Zoom lento 100% → 108%.
- **Texto na tela:** cartela inferior "Carlos Frederico Ribeiro de Almeida Dominguez · SOAT Fase 1 · Grupo 144" (0:02 a 0:10)
- **Narração [A01]:**

> Olá. Eu sou Carlos Frederico Ribeiro de Almeida Dominguez, do curso de Arquitetura de Software da Fiap, a pós Soat, grupo cento e quarenta e quatro. Este é o Tech Challenge da Fase um. Neste vídeo eu mostro o problema, a arquitetura, a modelagem do domínio, a API funcionando em produção, a segurança e as evidências de qualidade.

#### Cena 02. Problema e solução

- **Tempo:** 0:35 a 1:05
- **Visual:** CAP-PORTAL-SOLUCAO, rolagem lenta de cima para baixo.
- **Texto na tela:** três itens que entram um a um: "Anotação à mão" · "Estoque sem controle" · "Cliente sem visibilidade". Depois, substituídos por: "Ordem de serviço · Orçamento · Aprovação · Estoque"
- **Narração [A02]:**

> A oficina de hoje anota tudo à mão. Perde prioridade, promete peça que não tem no estoque e não consegue dizer ao cliente em que pé está o carro. O que eu construí é um back-end que controla a ordem de serviço do recebimento à entrega, com orçamento, aprovação pelo próprio cliente e reserva de estoque.

---

### Bloco 2. Arquitetura (1:05 a 3:05)

#### Cena 03. C4 contexto e contêineres

- **Tempo:** 1:05 a 1:50
- **Visual:** IMG-C4-1 por 20 s com zoom lento. Corte para IMG-C4-2, pan da esquerda para a direita.
- **Texto na tela:** "C4 · Nível 1 · Contexto" e depois "C4 · Nível 2 · Contêineres" no canto superior esquerdo
- **Narração [A03]:**

> No nível de contexto do modelo cê quatro, quatro pessoas usam o sistema: o administrador, o atendente, o técnico e o cliente da oficina. No nível de contêineres, há um portal estático e uma API em Node com Fastify, publicados na Vercel, e um banco PostgreSQL no Supabase. A mesma API sobe em Docker Compose para rodar localmente.

#### Cena 04. Camadas no código

- **Tempo:** 1:50 a 2:30
- **Visual:** GRV-EDITOR. Destacar cada pasta quando for citada. Corte para GRV-ARCH no fim da fala.
- **Texto na tela:** `domain → application → infrastructure → interfaces/http`; no corte, "npm run arch: 0 violações"
- **Narração [A04]:**

> É um monólito em quatro camadas. O domínio guarda as regras puras: documento, placa, máquina de estados, orçamento e estoque. A aplicação tem os casos de uso e as portas. A infraestrutura fala com o banco. E a camada de interface expõe as rotas HTTP. O domínio não depende de nada externo, e isso não fica só na promessa: o comando npm run arch verifica a direção das dependências e falha se alguém quebrar a regra.

#### Cena 05. Por que PostgreSQL

- **Tempo:** 2:30 a 3:05
- **Visual:** CAP-ADR-0002 por 15 s, depois IMG-C4-3 com zoom no componente de aprovação.
- **Texto na tela:** "ADR 0002 · PostgreSQL"; depois "SELECT ... FOR UPDATE · physical ≥ reserved ≥ 0"
- **Narração [A05]:**

> O banco é PostgreSQL, e a razão está registrada no registro de decisão zero zero zero dois. Aprovar um orçamento reserva várias peças de uma vez. Se faltar uma, nenhuma pode ficar reservada. Isso pede transação, trava por linha e uma restrição de saldo que o próprio banco garante, mesmo com várias instâncias da API rodando ao mesmo tempo.

---

### Bloco 3. Domínio (3:05 a 5:05)

#### Cena 06. Event Storming

- **Tempo:** 3:05 a 4:05
- **Visual:** IMG-ES-0 por 5 s. Depois IMG-ES-1, IMG-ES-2 e IMG-ES-3, cerca de 18 s cada, com pan da esquerda para a direita acompanhando a linha do tempo dos eventos.
- **Texto na tela:** título de cada quadro: "1 · Criação da OS", "2 · Acompanhamento", "3 · Peças e insumos"
- **Narração [A06]:**

> A modelagem começou pelo Event Storming, com três fluxos. O primeiro é a criação da ordem de serviço: recepção, diagnóstico e orçamento. O segundo é o acompanhamento, em que o cliente decide e vê o andamento. O terceiro é o de peças e insumos: entrada, reserva na aprovação, consumo na execução e liberação quando o orçamento muda. Cada cor é um tipo de elemento: evento, comando, ator, política e agregado.

#### Cena 07. Linguagem ubíqua e status

- **Tempo:** 4:05 a 4:35
- **Visual:** CAP-LINGUAGEM, zoom na linha de `StatusOS`.
- **Texto na tela:** cartela com a máquina de estados: `RECEBIDA → EM_DIAGNOSTICO → AGUARDANDO_APROVACAO → EM_EXECUCAO → FINALIZADA → ENTREGUE`
- **Narração [A07]:**

> Os termos da oficina têm o mesmo nome no código e no banco: ordem de serviço, orçamento, reservar orçamento. A ordem de serviço passa por seis status: recebida, em diagnóstico, aguardando aprovação, em execução, finalizada e entregue. Só as transições previstas são aceitas.

#### Cena 08. Mapa de contexto

- **Tempo:** 4:35 a 5:05
- **Visual:** CAP-MAPA, zoom no diagrama.
- **Texto na tela:** "Cadastros · Catálogo e Estoque · Atendimento · Identidade e Acesso"
- **Narração [A08]:**

> São quatro contextos delimitados: Cadastros, Catálogo e Estoque, Atendimento, e Identidade e Acesso. O Atendimento é o núcleo. Ele chama a reserva de estoque de forma síncrona, na mesma transação da decisão do cliente. Por isso não há fila nem evento assíncrono: se faltar uma peça, a aprovação inteira volta atrás.

---

### Bloco 4. Jornada completa no Swagger (5:05 a 10:05)

Sem trilha neste bloco. Rotas com prefixo `/api/v1`. Em cada perfil: `POST /auth/login`, copiar `token`, clicar em **Authorize** e colar sem a palavra Bearer. As mudanças de status pedem a `versao` atual da OS no corpo.

#### Cena 09. Administrador prepara o catálogo

- **Tempo:** 5:05 a 6:00
- **Visual:** GRV-SW-ADMIN-1.
  1. `POST /auth/login` com `admin@oficina.local`, Authorize
  2. `POST /services`: `{"nome":"Revisão","precoCentavos":20000}`
  3. `POST /parts`: `{"sku":"FLT-01","nome":"Filtro de óleo","tipo":"PECA","unidade":"UN","precoCentavos":3500}`
  4. `POST /parts/{id}/movements`: `{"tipo":"ENTRADA","quantidade":5}`
- **Texto na tela:** "Perfil: ADMIN" fixo no canto superior direito
- **Narração [A09]:**

> Agora a API publicada, pelo Swagger. Cada perfil faz login e recebe um token, que eu colo no botão Authorize. Começo como administrador. Cadastro o serviço de revisão, a duzentos reais, e o filtro de óleo, a trinta e cinco reais. Os valores vão em centavos, para não haver erro de arredondamento. Depois registro a entrada de cinco filtros no estoque.

#### Cena 10. Atendente abre a ordem de serviço

- **Tempo:** 6:00 a 7:15
- **Visual:** GRV-SW-ATEND.
  1. login `atendente@oficina.local`, Authorize
  2. `POST /customers`: `{"documento":"12.ABC.345/01DE-35","nome":"Frota Demo"}`. Destacar `"documento": "12ABC34501DE35"` e `"tipoDocumento": "CNPJ"`
  3. `POST /vehicles` com `clienteId`, placa `bra-2e19`, marca, modelo e ano. Destacar `"placa": "BRA2E19"`
  4. `POST /customers/{id}/user`: `{"email":"frota@cliente.com","senha":"senha-cliente"}`
  5. `POST /orders`: `{"clienteId":"...","veiculoId":"...","solicitacao":"Revisão dos 30 mil km"}`. Destacar `numero`, `status: RECEBIDA` e `versao: 1`
- **Texto na tela:** "Perfil: ATENDENTE"; no passo 2, "CNPJ alfanumérico (Receita Federal, 2026)"
- **Narração [A10]:**

> Troco para o atendente. Ele cadastra o cliente com um CNPJ alfanumérico, o novo formato da Receita. A API valida os dígitos e grava o documento sem pontuação. O veículo entra com a placa em letra minúscula e com hífen, e a API normaliza para o padrão Mercosul. Em seguida o atendente cria o acesso do cliente, com e-mail e senha. Por fim, abre a ordem de serviço. Ela nasce com status recebida, um número público no formato O S, ano e sequência, e a versão um, que será usada para controlar a concorrência.

#### Cena 11. Técnico diagnostica e publica o orçamento

- **Tempo:** 7:15 a 8:15
- **Visual:** GRV-SW-TEC-1.
  1. login `tecnico@oficina.local`, Authorize
  2. `POST /orders/{id}/diagnosis` com `{"versao":1}`. Destacar `status: EM_DIAGNOSTICO`
  3. `POST /orders/{id}/services`: `{"servicoId":"...","quantidade":1}`
  4. `POST /orders/{id}/parts`: `{"pecaId":"...","quantidade":2}`
  5. `POST /orders/{id}/quotes` com a versão atual. Destacar `versao: 1` do orçamento, `totalCentavos: 27000` e `status: AGUARDANDO_APROVACAO`
- **Texto na tela:** "Perfil: TECNICO"; no passo 5, "R$ 200,00 + 2 × R$ 35,00 = R$ 270,00"
- **Narração [A11]:**

> O técnico inicia o diagnóstico, informando a versão que ele leu. Inclui a revisão e dois filtros de óleo. Depois publica o orçamento. Esta é a versão um do orçamento, no valor de duzentos e setenta reais, e os preços ficam congelados nela. Se o catálogo mudar amanhã, o que o cliente aprova é este valor. A ordem de serviço passa para aguardando aprovação.

#### Cena 12. Cliente aprova e acompanha

- **Tempo:** 8:15 a 9:10
- **Visual:** GRV-SW-CLIENTE.
  1. login `frota@cliente.com`, Authorize
  2. `POST /quotes/{id}/decision`: `{"decisao":"APROVADO"}`. Destacar `status: APROVADO`
  3. `GET /me/orders/{id}`: rolar até `orcamentos` e `historico`
  4. Authorize com o token de ATENDENTE (o perfil CLIENTE não acessa o catálogo). `GET /parts/{id}`: destacar reservado 2, disponível 3
- **Texto na tela:** "Perfil: CLIENTE"; no passo 4, "Físico 5 · Reservado 2 · Disponível 3"
- **Narração [A12]:**

> Agora entro como o cliente. Ele aprova o orçamento. Na mesma transação, a API reserva as duas unidades do filtro. Pela rota do próprio cliente, ele vê a ordem de serviço, o orçamento que aprovou e todo o histórico de status. E, do lado da oficina, o estoque físico continua cinco, com dois reservados e três disponíveis.

#### Cena 13. Execução, entrega e métrica

- **Tempo:** 9:10 a 10:05
- **Visual:** GRV-SW-FIM. Acelerar até 1,5x se precisar.
  1. TECNICO: `POST /orders/{id}/start` com `{"versao":...}`
  2. `POST /orders/{id}/consumptions` com o `itemOrcamentoId` do filtro
  3. `POST /orders/{id}/services/{itemId}/complete`
  4. `POST /orders/{id}/finish` com a versão atual
  5. ATENDENTE: `POST /orders/{id}/deliver` com a versão atual. Rolar o `historico` com os 6 status
  6. ADMIN: `GET /metrics/execution-time?de=...&ate=...` com o dia da gravação. Destacar a amostra 1
- **Texto na tela:** a máquina de 6 status, com cada status acendendo à medida que é citado
- **Narração [A13]:**

> O técnico inicia a execução, dá baixa nos filtros, conclui o serviço e finaliza. Na baixa, a reserva vira consumo e o estoque físico diminui. O atendente entrega o veículo, e o histórico mostra os seis status, cada um com autor e horário. Para fechar a jornada, o administrador consulta o tempo médio de execução do dia, já com esta ordem de serviço na amostra.

---

### Bloco 5. Segurança (10:05 a 12:00)

#### Cena 14. Autenticação e perfis

- **Tempo:** 10:05 a 10:40
- **Visual:** GRV-SEG-1.
  1. Logout no Authorize. `GET /customers`. Destacar `401`
  2. Authorize com token de TECNICO. `POST /orders`. Destacar `403`
- **Texto na tela:** "401 · sem token" e "403 · perfil sem permissão"
- **Narração [A14]:**

> Agora a segurança. Sem token, a lista de clientes devolve quatrocentos e um. Com o token do técnico, tentar abrir uma ordem de serviço devolve quatrocentos e três, porque essa ação é do atendente ou do administrador. Cada rota declara quais perfis podem usá-la.

#### Cena 15. Concorrência e validação

- **Tempo:** 10:40 a 11:15
- **Visual:** GRV-SEG-2.
  1. `POST /orders/{id}/quotes` com uma `versao` antiga. Destacar `409` e `VERSAO_DESATUALIZADA`
  2. `POST /customers` com CPF `529.982.247-26`. Destacar `400` e `DOCUMENTO_INVALIDO`
- **Texto na tela:** "409 · VERSAO_DESATUALIZADA" e "400 · DOCUMENTO_INVALIDO"
- **Narração [A15]:**

> Se alguém age sobre uma versão antiga da ordem de serviço, a API recusa com quatrocentos e nove, versão desatualizada. Assim duas pessoas não sobrescrevem o trabalho uma da outra. E um CPF com dígito verificador errado é recusado com quatrocentos, documento inválido, antes de chegar ao banco.

#### Cena 16. Isolamento entre clientes e decisão repetida

- **Tempo:** 11:15 a 12:00
- **Visual:** GRV-SEG-3.
  1. ATENDENTE cria um segundo cliente com acesso. Login com esse cliente. `GET /me/orders/{id}` da OS do primeiro cliente. Destacar `404`
  2. Login do primeiro cliente. Repetir `POST /quotes/{id}/decision` com `APROVADO`. Mostrar o mesmo resultado e, em seguida, com token de ATENDENTE, `GET /parts/{id}` com reservado inalterado
- **Texto na tela:** "404 · não revela que a OS existe" e "Decisão repetida · sem nova reserva"
- **Narração [A16]:**

> Um segundo cliente tenta abrir a ordem de serviço do primeiro. A resposta é quatrocentos e quatro, e não quatrocentos e três, para não revelar nem que a ordem existe. Esse é o controle contra acesso a objeto de outro usuário. Por último, repetir a mesma aprovação devolve o mesmo resultado, sem reservar as peças de novo.

---

### Bloco 6. Qualidade e evidências (12:00 a 13:55)

#### Cena 17. Testes e cobertura

- **Tempo:** 12:00 a 12:45
- **Visual:** GRV-COVERAGE, acelerado até o resumo final. Congelar no resumo e destacar "189 passed" e as linhas de `domain` e `application`.
- **Texto na tela:** "189 testes · 100% das linhas em domain e application · corte do enunciado: 80%"
- **Narração [A17]:**

> Os testes rodam contra um PostgreSQL de verdade, que o Testcontainers sobe sozinho. São cento e oitenta e nove testes, unitários e de integração, todos passando. A cobertura de linhas no domínio e na aplicação é de cem por cento, e o comando falha se ela cair abaixo dos oitenta por cento pedidos no enunciado.

#### Cena 18. A disputa pela última peça

- **Tempo:** 12:45 a 13:10
- **Visual:** GRV-TESTE-CONC, zoom no título do teste "duas OS disputando a última unidade: só uma aprova". Se houver GRV-E2E, cortar para ele nos últimos 8 s, destacando 200 e 409.
- **Texto na tela:** "Duas aprovações simultâneas · 1 unidade · 200 e 409"
- **Narração [A18]:**

> Um dos testes dispara duas aprovações ao mesmo tempo, disputando a última unidade de uma peça. Só uma é aprovada. A outra recebe conflito, e o estoque nunca fica negativo.

#### Cena 19. Varreduras de segurança

- **Tempo:** 13:10 a 13:55
- **Visual:** CAP-EVIDENCIAS com pan pela tabela "Resultado". Corte para CAP-ACHADOS, zoom na linha 1.
- **Texto na tela:** "npm audit · Gitleaks · Trivy · OWASP ZAP · SonarQube"; depois "Antes: 15 CVEs na imagem → depois: 0"
- **Narração [A19]:**

> Também rodei cinco ferramentas de análise: npm audit, Gitleaks, Trivy, OWASP ZAP e SonarQube. O achado mais interessante veio do ZAP: um caractere nulo num texto derrubava a API com erro quinhentos, porque o PostgreSQL não grava esse byte. Hoje a entrada é recusada com quatrocentos. O Trivy achou quinze vulnerabilidades no npm que vinha dentro da imagem Docker. Removi o npm da imagem final, e ela ficou com zero. Todos os relatórios estão no repositório, com o hash de cada arquivo.

---

### Bloco 7. Execução local e encerramento (13:55 a 14:50)

#### Cena 20. Docker Compose

- **Tempo:** 13:55 a 14:25
- **Visual:** GRV-COMPOSE, acelerado na parte do build. Mostrar as migrações e o seed no log, depois o Swagger em `localhost:3000/api/docs`.
- **Texto na tela:** `cd oficina-api && docker compose up --build`
- **Narração [A20]:**

> Para rodar localmente, basta um comando: docker compose up. Ele constrói a imagem, sobe o PostgreSQL, aplica as migrações e cria os usuários de demonstração. Em seguida, o mesmo Swagger fica disponível na porta três mil.

#### Cena 21. Encerramento

- **Tempo:** 14:25 a 14:50
- **Visual:** CAP-GITHUB-COMMIT por 12 s, depois CAP-PORTAL-TOPO. Fade para preto de 1,5 s no fim.
- **Texto na tela:** "Portal: oficina-fiap-soat.vercel.app" · "Swagger: oficina-fiap-soat.vercel.app/api/docs" · "Código: github.com/freddominugez/FIAP_CARLOS_FREDERICO"
- **Narração [A21]:**

> Este é o commit da entrega, o mesmo informado no PDF. O código, os diagramas, as decisões de arquitetura e as evidências estão no repositório, e o portal reúne todos os links. Obrigado por assistir.

## 6. Narração corrida para o ElevenLabs

Mesmos textos da seção 5, só a fala, na ordem. Gerar um arquivo por bloco `A##`, com o nome indicado, para facilitar a montagem e a regravação de um trecho só. Se preferir gerar tudo de uma vez, colar na ordem e cortar nas pausas longas (a marca `<break time="1.5s" />` funciona no Multilingual v2).

**A01**
Olá. Eu sou Carlos Frederico Ribeiro de Almeida Dominguez, do curso de Arquitetura de Software da Fiap, a pós Soat, grupo cento e quarenta e quatro. Este é o Tech Challenge da Fase um. Neste vídeo eu mostro o problema, a arquitetura, a modelagem do domínio, a API funcionando em produção, a segurança e as evidências de qualidade.

**A02**
A oficina de hoje anota tudo à mão. Perde prioridade, promete peça que não tem no estoque e não consegue dizer ao cliente em que pé está o carro. O que eu construí é um back-end que controla a ordem de serviço do recebimento à entrega, com orçamento, aprovação pelo próprio cliente e reserva de estoque.

**A03**
No nível de contexto do modelo cê quatro, quatro pessoas usam o sistema: o administrador, o atendente, o técnico e o cliente da oficina. No nível de contêineres, há um portal estático e uma API em Node com Fastify, publicados na Vercel, e um banco PostgreSQL no Supabase. A mesma API sobe em Docker Compose para rodar localmente.

**A04**
É um monólito em quatro camadas. O domínio guarda as regras puras: documento, placa, máquina de estados, orçamento e estoque. A aplicação tem os casos de uso e as portas. A infraestrutura fala com o banco. E a camada de interface expõe as rotas HTTP. O domínio não depende de nada externo, e isso não fica só na promessa: o comando npm run arch verifica a direção das dependências e falha se alguém quebrar a regra.

**A05**
O banco é PostgreSQL, e a razão está registrada no registro de decisão zero zero zero dois. Aprovar um orçamento reserva várias peças de uma vez. Se faltar uma, nenhuma pode ficar reservada. Isso pede transação, trava por linha e uma restrição de saldo que o próprio banco garante, mesmo com várias instâncias da API rodando ao mesmo tempo.

**A06**
A modelagem começou pelo Event Storming, com três fluxos. O primeiro é a criação da ordem de serviço: recepção, diagnóstico e orçamento. O segundo é o acompanhamento, em que o cliente decide e vê o andamento. O terceiro é o de peças e insumos: entrada, reserva na aprovação, consumo na execução e liberação quando o orçamento muda. Cada cor é um tipo de elemento: evento, comando, ator, política e agregado.

**A07**
Os termos da oficina têm o mesmo nome no código e no banco: ordem de serviço, orçamento, reservar orçamento. A ordem de serviço passa por seis status: recebida, em diagnóstico, aguardando aprovação, em execução, finalizada e entregue. Só as transições previstas são aceitas.

**A08**
São quatro contextos delimitados: Cadastros, Catálogo e Estoque, Atendimento, e Identidade e Acesso. O Atendimento é o núcleo. Ele chama a reserva de estoque de forma síncrona, na mesma transação da decisão do cliente. Por isso não há fila nem evento assíncrono: se faltar uma peça, a aprovação inteira volta atrás.

**A09**
Agora a API publicada, pelo Swagger. Cada perfil faz login e recebe um token, que eu colo no botão Authorize. Começo como administrador. Cadastro o serviço de revisão, a duzentos reais, e o filtro de óleo, a trinta e cinco reais. Os valores vão em centavos, para não haver erro de arredondamento. Depois registro a entrada de cinco filtros no estoque.

**A10**
Troco para o atendente. Ele cadastra o cliente com um CNPJ alfanumérico, o novo formato da Receita. A API valida os dígitos e grava o documento sem pontuação. O veículo entra com a placa em letra minúscula e com hífen, e a API normaliza para o padrão Mercosul. Em seguida o atendente cria o acesso do cliente, com e-mail e senha. Por fim, abre a ordem de serviço. Ela nasce com status recebida, um número público no formato O S, ano e sequência, e a versão um, que será usada para controlar a concorrência.

**A11**
O técnico inicia o diagnóstico, informando a versão que ele leu. Inclui a revisão e dois filtros de óleo. Depois publica o orçamento. Esta é a versão um do orçamento, no valor de duzentos e setenta reais, e os preços ficam congelados nela. Se o catálogo mudar amanhã, o que o cliente aprova é este valor. A ordem de serviço passa para aguardando aprovação.

**A12**
Agora entro como o cliente. Ele aprova o orçamento. Na mesma transação, a API reserva as duas unidades do filtro. Pela rota do próprio cliente, ele vê a ordem de serviço, o orçamento que aprovou e todo o histórico de status. E, do lado da oficina, o estoque físico continua cinco, com dois reservados e três disponíveis.

**A13**
O técnico inicia a execução, dá baixa nos filtros, conclui o serviço e finaliza. Na baixa, a reserva vira consumo e o estoque físico diminui. O atendente entrega o veículo, e o histórico mostra os seis status, cada um com autor e horário. Para fechar a jornada, o administrador consulta o tempo médio de execução do dia, já com esta ordem de serviço na amostra.

**A14**
Agora a segurança. Sem token, a lista de clientes devolve quatrocentos e um. Com o token do técnico, tentar abrir uma ordem de serviço devolve quatrocentos e três, porque essa ação é do atendente ou do administrador. Cada rota declara quais perfis podem usá-la.

**A15**
Se alguém age sobre uma versão antiga da ordem de serviço, a API recusa com quatrocentos e nove, versão desatualizada. Assim duas pessoas não sobrescrevem o trabalho uma da outra. E um CPF com dígito verificador errado é recusado com quatrocentos, documento inválido, antes de chegar ao banco.

**A16**
Um segundo cliente tenta abrir a ordem de serviço do primeiro. A resposta é quatrocentos e quatro, e não quatrocentos e três, para não revelar nem que a ordem existe. Esse é o controle contra acesso a objeto de outro usuário. Por último, repetir a mesma aprovação devolve o mesmo resultado, sem reservar as peças de novo.

**A17**
Os testes rodam contra um PostgreSQL de verdade, que o Testcontainers sobe sozinho. São cento e oitenta e nove testes, unitários e de integração, todos passando. A cobertura de linhas no domínio e na aplicação é de cem por cento, e o comando falha se ela cair abaixo dos oitenta por cento pedidos no enunciado.

**A18**
Um dos testes dispara duas aprovações ao mesmo tempo, disputando a última unidade de uma peça. Só uma é aprovada. A outra recebe conflito, e o estoque nunca fica negativo.

**A19**
Também rodei cinco ferramentas de análise: npm audit, Gitleaks, Trivy, OWASP ZAP e SonarQube. O achado mais interessante veio do ZAP: um caractere nulo num texto derrubava a API com erro quinhentos, porque o PostgreSQL não grava esse byte. Hoje a entrada é recusada com quatrocentos. O Trivy achou quinze vulnerabilidades no npm que vinha dentro da imagem Docker. Removi o npm da imagem final, e ela ficou com zero. Todos os relatórios estão no repositório, com o hash de cada arquivo.

**A20**
Para rodar localmente, basta um comando: docker compose up. Ele constrói a imagem, sobe o PostgreSQL, aplica as migrações e cria os usuários de demonstração. Em seguida, o mesmo Swagger fica disponível na porta três mil.

**A21**
Este é o commit da entrega, o mesmo informado no PDF. O código, os diagramas, as decisões de arquitetura e as evidências estão no repositório, e o portal reúne todos os links. Obrigado por assistir.

### Pronúncia

Os textos acima já usam a forma falada. Se a voz errar algum termo, criar um dicionário de pronúncia no ElevenLabs com estes aliases:

| Escrito | Como deve soar | Alias sugerido |
|---|---|---|
| API | a-pê-í | `a pê i` |
| CNPJ | cê-ene-pê-jota | `cê ene pê jota` |
| CPF | cê-pê-éfe | `cê pê éfe` |
| HTTP | agá-tê-tê-pê | `agá tê tê pê` |
| npm run arch | ene-pê-eme ran árch | `ene pê eme ran árch` |
| PostgreSQL | póstgres | `póstgres` |
| Fastify | féstifai | `féstifai` |
| Supabase | súpabeis | `súpabeis` |
| Vercel | vêrcel | `vêrcel` |
| Gitleaks | guit-liks | `guit liks` |
| Trivy | trívi | `trívi` |
| OWASP ZAP | óuasp zép | `óuasp zép` |
| Testcontainers | test-contêiners | `test contêiners` |
| Soat | sô-át | `sô át` |

## 7. Manifesto para montagem automática

Mesma decupagem em formato estruturado. Tempos em segundos e aproximados: o editor deve recalcular `inicio` a partir da duração real de cada áudio.

```json
{
  "video": {
    "titulo": "Tech Challenge Fase 1 · Oficina · SOAT Grupo 144",
    "resolucao": "1920x1080",
    "fps": 30,
    "duracao_maxima_s": 900,
    "regra_tempo": "duracao_cena = duracao_audio + folga_s"
  },
  "cenas": [
    {"id": 1,  "inicio": 0,   "audio": "audio/A01.mp3", "folga_s": 1.0, "visual": [{"asset": "CAP-PORTAL-TOPO", "tipo": "imagem", "efeito": "fade_in_1s+zoom_100_108"}], "texto_tela": ["Carlos Frederico Ribeiro de Almeida Dominguez · SOAT Fase 1 · Grupo 144"]},
    {"id": 2,  "inicio": 35,  "audio": "audio/A02.mp3", "folga_s": 0.5, "visual": [{"asset": "CAP-PORTAL-SOLUCAO", "tipo": "imagem", "efeito": "pan_vertical"}], "texto_tela": ["Anotação à mão", "Estoque sem controle", "Cliente sem visibilidade", "Ordem de serviço · Orçamento · Aprovação · Estoque"]},
    {"id": 3,  "inicio": 65,  "audio": "audio/A03.mp3", "folga_s": 0.5, "visual": [{"asset": "IMG-C4-1", "tipo": "imagem", "duracao_s": 20, "efeito": "zoom_lento"}, {"asset": "IMG-C4-2", "tipo": "imagem", "efeito": "pan_horizontal"}], "texto_tela": ["C4 · Nível 1 · Contexto", "C4 · Nível 2 · Contêineres"]},
    {"id": 4,  "inicio": 110, "audio": "audio/A04.mp3", "folga_s": 0.5, "visual": [{"asset": "GRV-EDITOR", "tipo": "video"}, {"asset": "GRV-ARCH", "tipo": "video", "posicao": "fim"}], "texto_tela": ["domain → application → infrastructure → interfaces/http", "npm run arch: 0 violações"]},
    {"id": 5,  "inicio": 150, "audio": "audio/A05.mp3", "folga_s": 0.5, "visual": [{"asset": "CAP-ADR-0002", "tipo": "imagem", "duracao_s": 15}, {"asset": "IMG-C4-3", "tipo": "imagem", "efeito": "zoom_componente_aprovacao"}], "texto_tela": ["ADR 0002 · PostgreSQL", "SELECT ... FOR UPDATE · physical ≥ reserved ≥ 0"]},
    {"id": 6,  "inicio": 185, "audio": "audio/A06.mp3", "folga_s": 0.5, "visual": [{"asset": "IMG-ES-0", "tipo": "imagem", "duracao_s": 5}, {"asset": "IMG-ES-1", "tipo": "imagem", "efeito": "pan_horizontal"}, {"asset": "IMG-ES-2", "tipo": "imagem", "efeito": "pan_horizontal"}, {"asset": "IMG-ES-3", "tipo": "imagem", "efeito": "pan_horizontal"}], "texto_tela": ["1 · Criação da OS", "2 · Acompanhamento", "3 · Peças e insumos"]},
    {"id": 7,  "inicio": 245, "audio": "audio/A07.mp3", "folga_s": 0.5, "visual": [{"asset": "CAP-LINGUAGEM", "tipo": "imagem", "efeito": "zoom_linha_StatusOS"}], "texto_tela": ["RECEBIDA → EM_DIAGNOSTICO → AGUARDANDO_APROVACAO → EM_EXECUCAO → FINALIZADA → ENTREGUE"]},
    {"id": 8,  "inicio": 275, "audio": "audio/A08.mp3", "folga_s": 0.5, "visual": [{"asset": "CAP-MAPA", "tipo": "imagem", "efeito": "zoom_diagrama"}], "texto_tela": ["Cadastros · Catálogo e Estoque · Atendimento · Identidade e Acesso"]},
    {"id": 9,  "inicio": 305, "audio": "audio/A09.mp3", "folga_s": 0.5, "visual": [{"asset": "GRV-SW-ADMIN-1", "tipo": "video", "velocidade_max": 2.0}], "texto_tela": ["Perfil: ADMIN"], "trilha": false},
    {"id": 10, "inicio": 360, "audio": "audio/A10.mp3", "folga_s": 0.5, "visual": [{"asset": "GRV-SW-ATEND", "tipo": "video", "velocidade_max": 2.0, "destaques": ["documento", "tipoDocumento", "placa", "numero", "status", "versao"]}], "texto_tela": ["Perfil: ATENDENTE", "CNPJ alfanumérico (Receita Federal, 2026)"], "trilha": false},
    {"id": 11, "inicio": 435, "audio": "audio/A11.mp3", "folga_s": 0.5, "visual": [{"asset": "GRV-SW-TEC-1", "tipo": "video", "velocidade_max": 2.0, "destaques": ["status", "totalCentavos", "versao"]}], "texto_tela": ["Perfil: TECNICO", "R$ 200,00 + 2 × R$ 35,00 = R$ 270,00"], "trilha": false},
    {"id": 12, "inicio": 495, "audio": "audio/A12.mp3", "folga_s": 0.5, "visual": [{"asset": "GRV-SW-CLIENTE", "tipo": "video", "velocidade_max": 2.0, "destaques": ["status", "reservado", "disponivel", "historico"]}], "texto_tela": ["Perfil: CLIENTE", "Físico 5 · Reservado 2 · Disponível 3"], "trilha": false},
    {"id": 13, "inicio": 550, "audio": "audio/A13.mp3", "folga_s": 0.5, "visual": [{"asset": "GRV-SW-FIM", "tipo": "video", "velocidade_max": 2.0, "destaques": ["historico", "amostra"]}], "texto_tela": ["RECEBIDA → EM_DIAGNOSTICO → AGUARDANDO_APROVACAO → EM_EXECUCAO → FINALIZADA → ENTREGUE"], "trilha": false},
    {"id": 14, "inicio": 605, "audio": "audio/A14.mp3", "folga_s": 0.5, "visual": [{"asset": "GRV-SEG-1", "tipo": "video", "destaques": ["401", "403"]}], "texto_tela": ["401 · sem token", "403 · perfil sem permissão"], "trilha": false},
    {"id": 15, "inicio": 640, "audio": "audio/A15.mp3", "folga_s": 0.5, "visual": [{"asset": "GRV-SEG-2", "tipo": "video", "destaques": ["409", "VERSAO_DESATUALIZADA", "400", "DOCUMENTO_INVALIDO"]}], "texto_tela": ["409 · VERSAO_DESATUALIZADA", "400 · DOCUMENTO_INVALIDO"], "trilha": false},
    {"id": 16, "inicio": 675, "audio": "audio/A16.mp3", "folga_s": 0.5, "visual": [{"asset": "GRV-SEG-3", "tipo": "video", "destaques": ["404", "reservado"]}], "texto_tela": ["404 · não revela que a OS existe", "Decisão repetida · sem nova reserva"], "trilha": false},
    {"id": 17, "inicio": 720, "audio": "audio/A17.mp3", "folga_s": 0.5, "visual": [{"asset": "GRV-COVERAGE", "tipo": "video", "efeito": "acelerar_ate_resumo+congelar"}], "texto_tela": ["189 testes · 100% das linhas em domain e application · corte do enunciado: 80%"]},
    {"id": 18, "inicio": 765, "audio": "audio/A18.mp3", "folga_s": 0.5, "visual": [{"asset": "GRV-TESTE-CONC", "tipo": "video"}, {"asset": "GRV-E2E", "tipo": "video", "opcional": true, "duracao_s": 8, "posicao": "fim"}], "texto_tela": ["Duas aprovações simultâneas · 1 unidade · 200 e 409"]},
    {"id": 19, "inicio": 790, "audio": "audio/A19.mp3", "folga_s": 0.5, "visual": [{"asset": "CAP-EVIDENCIAS", "tipo": "imagem", "efeito": "pan_tabela"}, {"asset": "CAP-ACHADOS", "tipo": "imagem", "efeito": "zoom_linha_1"}], "texto_tela": ["npm audit · Gitleaks · Trivy · OWASP ZAP · SonarQube", "Antes: 15 CVEs na imagem → depois: 0"]},
    {"id": 20, "inicio": 835, "audio": "audio/A20.mp3", "folga_s": 0.5, "visual": [{"asset": "GRV-COMPOSE", "tipo": "video", "velocidade_max": 4.0}], "texto_tela": ["cd oficina-api && docker compose up --build"]},
    {"id": 21, "inicio": 865, "audio": "audio/A21.mp3", "folga_s": 2.0, "visual": [{"asset": "CAP-GITHUB-COMMIT", "tipo": "imagem", "duracao_s": 12}, {"asset": "CAP-PORTAL-TOPO", "tipo": "imagem", "efeito": "fade_out_1_5s"}], "texto_tela": ["Portal: oficina-fiap-soat.vercel.app", "Swagger: oficina-fiap-soat.vercel.app/api/docs", "Código: github.com/freddominugez/FIAP_CARLOS_FREDERICO"]}
  ]
}
```

## 8. Checklist final

- [ ] 21 áudios gerados (`A01` a `A21`) e ouvidos inteiros
- [ ] 8 capturas (seção 3.2) e 14 gravações (seção 3.3) feitas
- [ ] duração total abaixo de 15:00
- [ ] nenhum token, senha de banco ou dado real visível (as senhas de demonstração podem aparecer)
- [ ] commit mostrado no vídeo é o mesmo do PDF
- [ ] publicado, testado em janela anônima, `youtubeId` preenchido em `portal/assets/js/config.js` e link no README
