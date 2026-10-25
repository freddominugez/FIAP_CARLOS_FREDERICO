# ADR 0003: JWT emitido pela própria API

Data: 25/10/2026. Status: aceita. Substitui a proposta da v1.0 de usar Supabase Auth.

## Contexto
O enunciado exige JWT nas rotas administrativas e execução local simples. O cliente final também precisa de acesso, limitado às próprias OS.

## Decisão
`POST /auth/login` valida usuário e senha (bcrypt) e devolve JWT HS256 com `sub`, `perfil`, `clienteId` quando houver, `iss`, `aud` e expiração de 1 hora. O plugin `@fastify/jwt` valida o token em todas as rotas, menos login, health e docs. A autorização por recurso fica no caso de uso.

## Consequências
- `docker compose up` sobe API e banco, sem conta externa.
- O segredo fica em variável de ambiente, diferente por ambiente.
- Sem refresh token e sem revogação no MVP. Expiração curta compensa.
- Perfil vem do banco no login, nunca de dado enviado pelo usuário.

## Alternativas
- Supabase Auth: exige CLI do Supabase e vários containers no ambiente local.
- Sessão com cookie: o enunciado pede JWT.
