# Evidências de qualidade e segurança (D+7)

Data: 25/10/2026. Código analisado: `oficina-api` 0.6.0, que reúne as correções desta etapa. Imagem Docker analisada: `sha256:513b955be29f`. Todas as ferramentas rodaram nesta máquina, em containers com versão fixa. O GitHub Actions não faz parte desta verificação.

## Resultado

| Verificação | Ferramenta | Resultado final |
|---|---|---|
| Testes | Vitest 5.0.5, Node 24.22.1, PostgreSQL 16 real | 189 de 189 passando |
| Cobertura dos domínios críticos (`domain` e `application`) | Vitest + V8 | linhas 100%, ramos 97,6%, funções 100%. Corte do enunciado: 80% |
| Cobertura de todo o `src/` | Vitest + V8 | linhas 95,7%, ramos 91,7% |
| Dependências | npm audit (npm 10.9.8) | 0 vulnerabilidades em 513 dependências |
| Segredos no histórico do Git | Gitleaks 8.30.1 | nenhum |
| Segredos nos arquivos da pasta | Gitleaks 8.30.1 | 4 achados, todos em arquivos fora do Git (ver abaixo) |
| Imagem Docker | Trivy 0.75.0 | 0 vulnerabilidades, 0 segredos (antes: 15) |
| Projeto e configuração (Dockerfile, compose) | Trivy 0.75.0 | 0 vulnerabilidades, 0 erros de configuração, 0 segredos |
| API, varredura ativa autenticada | OWASP ZAP 2.17.0, API scan com OpenAPI | 0 falhas, 120 regras aprovadas, 1 aviso aceito (antes: 4 avisos, 1 erro 500) |
| Portal e API em produção, varredura passiva | OWASP ZAP 2.17.0, baseline | 0 falhas, 61 regras aprovadas, 7 avisos aceitos (antes: 8) |
| Análise estática | SonarQube Community 26.9 + sonar-scanner 12.2 | quality gate aprovado. 0 bugs, 0 vulnerabilidades, 0 hotspots, 0 code smells abertos. Notas A. Duplicação 0% |
| Fluxo completo em produção | `oficina-api/scripts/roteiro-ponta-a-ponta.mjs` | 10 de 10 verificações |

O plano previa SonarCloud. Ele depende de login e integração com o GitHub, então a análise usou o SonarQube Community local, com as mesmas regras de TypeScript.

## Achados e tratamento

| # | Ferramenta | Achado | Tratamento |
|---|---|---|---|
| 1 | ZAP (API) | `POST /services` com caractere nulo (`\u0000`) num texto devolvia 500. O PostgreSQL não grava esse byte | **Corrigido.** `plugins/entrada.ts` recusa caractere nulo no corpo e na URL com 400 `ENTRADA_INVALIDA`. Teste de integração cobre os dois casos. Nova varredura: nenhum 500 no log da API |
| 2 | ZAP (API) | `X-Content-Type-Options` e `Cross-Origin-Resource-Policy` ausentes | **Corrigido.** `plugins/cabecalhos-seguranca.ts` envia `nosniff`, `same-origin`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` e `Cache-Control: no-store` nas rotas `/api/v1` |
| 3 | ZAP (API) | "Unexpected Content-Type" em `/api/docs` | **Aceito.** É a página HTML do Swagger UI. Resposta correta |
| 4 | Trivy (imagem) | 15 CVEs (5 altas) em pacotes do npm que vem na imagem `node:24-alpine` (`brace-expansion`, `undici`, `ip-address`, `http-cache-semantics`, `postcss-selector-parser`) | **Corrigido.** O estágio final do `Dockerfile` remove npm e corepack. A API roda só com `node`. Imagem final: 0 CVEs. Compose conferido: migrações, seed e health ok |
| 5 | ZAP (produção) | Portal sem cabeçalhos de segurança | **Corrigido.** `vercel.json` envia CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` e HSTS |
| 6 | ZAP (produção) | CSP com `style-src 'unsafe-inline'` | **Corrigido.** As 7 cores da legenda do Event Storming saíram de `style=` para classes CSS. A CSP libera script em linha só pelo hash SHA-256 |
| 7 | ZAP (produção) | `Access-Control-Allow-Origin: *` nos arquivos do portal | **Aceito.** A Vercel aplica esse cabeçalho a arquivos estáticos públicos, que não usam credenciais. A API não envia esse cabeçalho |
| 8 | ZAP (produção) | Sem SRI no CSS do Google Fonts | **Aceito.** O Google Fonts gera CSS diferente por navegador, o que impede um hash fixo. A CSP restringe a origem a `fonts.googleapis.com` e `fonts.gstatic.com` |
| 9 | ZAP (produção) | Sem `Cross-Origin-Embedder-Policy` | **Aceito.** `require-corp` bloquearia o vídeo do YouTube, e o portal não usa recurso que exija isolamento |
| 10 | ZAP (produção) | Avisos de cache (10015, 10049, 10050) e "Modern Web Application" | **Aceitos.** Informativos para páginas estáticas públicas servidas por CDN |
| 11 | Gitleaks (pasta) | Token OIDC da Vercel em `.env.local` e senha do banco em `oficina-api/.env.supabase`, mais as cópias na pasta local `TECH_CHALENGER/` | **Esperado.** São os segredos locais de propósito, fora do Git pelo `.gitignore`. A varredura do histórico não encontra nenhum. Relatório com valores mascarados |
| 12 | SonarQube | 22 code smells de severidade mínima | **17 corrigidos** (encadeamento opcional, `\d`, `replaceAll`, `String.raw`, `TypeError`, entre outros). Uma correção criou um template literal aninhado (S4624), que derrubou o quality gate. Foi corrigido na rodada seguinte. **4 aceitos:** S7718 pede o nome `error_` no `catch`, e o projeto usa `erro`. **1 falso positivo:** S1940 em `!(quantidade > 0)`, que é intencional porque também recusa `NaN` |
| 13 | Gitleaks (estes relatórios) | 549 alertas `generic-api-key` nos relatórios do ZAP e do SonarQube | **Falsos positivos.** São o host `api:3000` das URLs do compose e as chaves de item do SonarQube. `.gitleaks.toml` libera só esses dois padrões. Uma primeira versão da exceção, filtrada por pasta, passou a ignorar a pasta inteira: um teste de controle com uma chave AWS falsa deixou de ser detectado. A versão final não usa filtro de pasta, e o mesmo controle volta a ser detectado. Nenhum JWT aparece nos relatórios |

Os relatórios com sufixo `-antes` mostram o estado anterior às correções.

## Como reproduzir

Testes e cobertura, a partir de `oficina-api/`, com um PostgreSQL acessível:

```bash
TEST_DATABASE_URL=postgres://postgres:teste@localhost:5432/postgres npm run coverage
npx vitest run --coverage --coverage.include='src/**'   # cobertura de todo o src/
```

Dependências e segredos:

```bash
npm audit --json
gitleaks git . --redact
```

Imagem e projeto:

```bash
docker build -t oficina-api:d7 oficina-api
docker save -o imagem.tar oficina-api:d7
docker run --rm -v "$PWD:/scan" aquasec/trivy:0.75.0 image --input /scan/imagem.tar --scanners vuln,secret
docker run --rm -v "$PWD/oficina-api:/scan" aquasec/trivy:0.75.0 fs /scan --scanners vuln,secret,misconfig
```

ZAP na API (stack do compose no ar, token de um usuário ADMIN):

```bash
docker run --network oficina_default zaproxy/zap-stable:2.17.0 zap-api-scan.py \
  -t http://api:3000/api/docs/json -f openapi \
  -z "-config replacer.full_list(0).matchtype=REQ_HEADER -config replacer.full_list(0).matchstr=Authorization -config replacer.full_list(0).replacement=Bearer <token>"
```

ZAP em produção, só passivo:

```bash
docker run zaproxy/zap-stable:2.17.0 zap-baseline.py -t https://oficina-fiap-soat.vercel.app/ -m 2
```

SonarQube: subir `sonarqube:26.9.0.129388-community`, criar o projeto `oficina-api` e rodar `sonarsource/sonar-scanner-cli:12.2.0.4256_8.1.0` em `oficina-api/`, que já tem `sonar-project.properties`.

Neste Colima as pastas montadas chegam vazias aos containers. Por isso os arquivos foram copiados com `docker cp`, sem `-v`. Em Docker Desktop ou Linux, os comandos acima funcionam como estão.

## Integridade dos arquivos

SHA-256 de cada relatório, gerado depois da última execução. Conferir com `shasum -a 256 -c SHA256SUMS` dentro desta pasta.

| Arquivo | SHA-256 |
|---|---|
| `cobertura/coverage-summary.json` | `96241ea25443a46b409adc14258388c86ab7f3a551f16fbf0f6ed125d3c06c25` |
| `cobertura/lcov.info` | `1e4a720515d33a15e80f3e3b0b37fb665471dc28d4c959e787164861a2a8020c` |
| `cobertura/todo-src/coverage-summary.json` | `330bf2b444777850579f0d35c94c31d56916d04d833f870b8b38afac5b92a68e` |
| `cobertura/todo-src/lcov.info` | `f64ea393950bef4df07defe245f64a91e6114015679eb2ff752255afc5f7f08f` |
| `qualidade/sonarqube-hotspots.json` | `f0a611c778668c54b7776444d1e7c18908d5338e8524ecabb8276133674b5508` |
| `qualidade/sonarqube-metricas.json` | `aecb23d94a8cc49d04db6f4c5fcac206a3a022be61a35aa31ef6c833f33577b5` |
| `qualidade/sonarqube-problemas.json` | `3580922dc0961cb5b331bab078f474f4b9ec7506067be4690488193865afe48e` |
| `qualidade/sonarqube-quality-gate.json` | `df192982cae8824ff33794bba5c8d9fadd239df277e1e5067c81607910aecd0d` |
| `testes/producao-ponta-a-ponta.txt` | `ccfcf132c4304a424df456ff5701023c2a29dea1968818a3f97fc7dcde87a215` |
| `testes/saida-testes.txt` | `ef8b57f99abb19cf36709949209eb7344f7b2af8d0603acd75b8686e332ce0ae` |
| `testes/vitest-junit.xml` | `148438d295c9109ba1aac893145f5329ccb2891ba852789b888f1f75b7738094` |
| `vulnerabilidades/gitleaks-diretorio.json` | `519c2ad6fb4d95eb305bab20dc25bc0be2c77881c247769179de9fe855eb69fa` |
| `vulnerabilidades/gitleaks-historico.json` | `37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570` |
| `vulnerabilidades/npm-audit-producao.json` | `e3d959d5a94c387b709582c78b162a60c6da0d30804bb28b0baca5bcea00c630` |
| `vulnerabilidades/npm-audit.json` | `e3d959d5a94c387b709582c78b162a60c6da0d30804bb28b0baca5bcea00c630` |
| `vulnerabilidades/trivy-imagem-antes.json` | `ecd675888e772ac30be2a1f96721b854c01cfb46be8771aeadf2f60de322fbd5` |
| `vulnerabilidades/trivy-imagem-antes.txt` | `7087a0072a406c6df6efe93741fad939f98b832d7a2459e60dd3f490ecdac909` |
| `vulnerabilidades/trivy-imagem.json` | `45b3abdf238ceb646319182dc67dd617d1c501468c3401f38ad4ea4f76d87c0e` |
| `vulnerabilidades/trivy-imagem.txt` | `9b17627d210f74626813a1d518b03c813f7d32e1903a1750983f96e4cb84c3ec` |
| `vulnerabilidades/trivy-projeto.json` | `cd8566b59f9875316392ec54c6b97dd62d00c303d05bb2c7c4ba7629505a6254` |
| `vulnerabilidades/trivy-projeto.txt` | `4bb11502ec9d79cafcb88c56f0f3557601c51711e233d161362316e845c60144` |
| `vulnerabilidades/zap-api-antes.html` | `3268fcd59d30917a470f01825374f3e8077573ad08384e160955ab4b9c773200` |
| `vulnerabilidades/zap-api-antes.json` | `c25e40e1ae8261abffd4a65c82122c6f56c587c487a7024f14b2bbccb26f3489` |
| `vulnerabilidades/zap-api-antes.md` | `7894629b3e3d6473e8fcaccdc47f5ee869e365a35012aaaa6a5a9e408bd148db` |
| `vulnerabilidades/zap-api.html` | `fdb17fbac46ff15541e9586f2a70b3101bec0de26ecb3c6be685d2b906b74e34` |
| `vulnerabilidades/zap-api.json` | `7e8ec97a5853362dcd6b3819f967d4646bed15d52f50af236bc2bdb61ccb9a13` |
| `vulnerabilidades/zap-api.md` | `cec265c0bd8d6411995a9326de984ebe847e7ec6d53d5b80da19504114572083` |
| `vulnerabilidades/zap-producao-antes.html` | `1b4a2840b448a7bcb3c807b3bdc87b5ee2177720f6655e8fc7a9c1546db4888d` |
| `vulnerabilidades/zap-producao-antes.json` | `6934769ba153c562e32c4342c30a06c9272232d969ff8f69eb57389de9825b9b` |
| `vulnerabilidades/zap-producao-antes.md` | `d1e31523da15d393f5c9b39cf04e99f8ac211c1cd3829729da1aadf5ea06873d` |
| `vulnerabilidades/zap-producao.html` | `1f5e4a3474bfed4fc7189ab0c9ca5960ddf7966e7dc7a81df52fb4b23199d1c2` |
| `vulnerabilidades/zap-producao.json` | `2d1ac2d8b5625cdbd567e5b92af0bd6243fffd2110c5136b834122a6c76dbd1f` |
| `vulnerabilidades/zap-producao.md` | `ee94e8d767ee2d0e47be2edfd8435719ac03ce1576665548cb10a8d9ea1d84c7` |
