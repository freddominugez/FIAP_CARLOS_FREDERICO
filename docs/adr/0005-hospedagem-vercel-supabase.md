# ADR 0005: portal e API no mesmo projeto Vercel

Data: 25/10/2026, revisada na D+6. Status: aceita e em produção em https://oficina-fiap-soat.vercel.app (projeto `oficina-fiap-soat`, time By Vulcan Projects).

## Contexto
O projeto terá um domínio próprio com o portal de documentação e a API demonstrável. A correção da FIAP usa o GitHub e o vídeo, então a hospedagem é complementar.

## Decisão
Um projeto Vercel com Vercel Services (`vercel.json` na raiz):

- `portal`: `portal/`, estático.
- `api`: `oficina-api/`, preset Fastify, ponto de entrada `src/main/server.ts`. É o mesmo app do container. A Vercel captura o `listen` e roda como função Node 24.
- Reescritas no topo: `/api/*` vai para `api`, o resto vai para `portal`. O caminho chega inteiro ao Fastify, que já atende em `/api/v1` e publica o Swagger em `/api/docs`.

Banco no Supabase, num schema próprio (`oficina`) dentro de um projeto já existente, em vez de um projeto novo. O plano Pro cobra computação por projeto, e o plano gratuito exigiria outra organização. O isolamento vem do banco:

- usuário `oficina_app`, sem herança de papéis, com `search_path = oficina` e `statement_timeout = 15s`;
- permissão de uso e criação só em `oficina`, nenhuma permissão em tabela de outro schema;
- `anon` e `authenticated` sem acesso ao schema, que também não é exposto pela API REST do Supabase.

A API conecta pelo pooler em modo transação, porta 6543, com TLS verificado contra a CA raiz do Supabase (`DATABASE_SSL_CA`). As migrações rodam fora do deploy, pelo pooler em modo sessão, porta 5432, porque o `node-pg-migrate` usa lock de sessão.

## Verificação
`vercel build` local, numa cópia isolada, detectou os dois serviços e gerou a função com Node 24. A função empacotada, montada a partir do mapa de arquivos da Vercel e executada num container com PostgreSQL, respondeu ao health com banco ok, ao Swagger UI, ao OpenAPI com 32 rotas e ao login. Contra o Supabase, a API local no modo transação respondeu ao health, ao login e ao cadastro com CNPJ alfanumérico. Três aberturas simultâneas de OS com a mesma chave de idempotência geraram uma OS só, o que confirma que o lock de transação funciona através do pooler. Os dados do teste foram apagados. O linter de segurança do Supabase não aponta nada no schema `oficina`. Em produção, um roteiro de ponta a ponta passou em todos os itens: login dos 3 perfis, CNPJ alfanumérico, orçamento de R$ 235,00, disputa pela última unidade (200 e 409), 404 na OS de outro cliente, ciclo até ENTREGUE com 6 mudanças no histórico, estoque baixado e tempo médio com amostra 1. Os dados do roteiro foram apagados depois.

## Problemas encontrados no primeiro deploy

1. **`require()` de pacote só ESM.** O `@fastify/static` (usado pelo Swagger UI) carrega `content-disposition` com `require`, e a versão 3 desse pacote é só ESM. O Node 24 aceita, mas o carregador de funções da Vercel não. Solução: `overrides` no `package.json` fixando `content-disposition@2.0.1`, que é CommonJS e tem a mesma função `create`. O CI roda `npm run check:carga`, que carrega o app com `--no-experimental-require-module` e pega o próximo caso antes do deploy.
2. **Primeiro pedido de cada partida a frio esperava 60 s.** A Vercel captura o `server.listen()` feito durante a carga do módulo. O `app.listen()` do Fastify só chama o `listen` depois de carregar os plugins, então a plataforma não via o servidor e caía no modo "legacy" após 60 s. Solução em `src/main/server.ts`: `await app.ready()` e, na Vercel, `app.server.listen()` direto. No container continua o `app.listen()`. Partida a frio caiu para cerca de 3 s.

## Consequências
- Um domínio, um deploy, HTTPS automático. Portal e API sobem e voltam juntos.
- Função sem estado: locks, idempotência e saldo ficam no banco, que é onde já estavam.
- Pool pequeno por instância (`DATABASE_POOL_MAX=3`), porque várias instâncias dividem o pooler.
- `vercel dev` com Services exige um servidor de desenvolvimento por serviço. O desenvolvimento local segue pelo Compose.
- Cold start pode aparecer no vídeo. A demonstração principal roda local no Compose.

## Alternativas
- Pasta `api/` na raiz com uma função que importa o app: exige `package.json` na raiz e duplica dependências.
- Dois projetos Vercel no mesmo repositório: dois deploys e dois domínios para manter em sincronia.
- Container persistente (Render, Fly.io): mais próximo do Compose, mas fora do alvo pedido.
