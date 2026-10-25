#!/bin/sh
# Aplica migrações, cria usuários de demonstração (se pedido) e sobe a API.
set -e

node node_modules/node-pg-migrate/bin/node-pg-migrate.js up \
  --migrations-dir db/migrations --migration-file-language sql

if [ "$SEED_DEMO" = "true" ]; then
  node dist/main/seed.js
fi

exec node dist/main/server.js
