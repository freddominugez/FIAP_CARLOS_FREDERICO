-- Up Migration
-- Schema inicial da oficina. Regras de negócio reforçadas no banco (RN01 a RN12).
-- Dinheiro em centavos (bigint). Datas em UTC (timestamptz).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Cadastros ----------------------------------------------------------------

CREATE TABLE customers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document     varchar(14) NOT NULL,              -- CPF (11) ou CNPJ (14), sem pontuação, maiúsculo
  document_type varchar(4) NOT NULL CHECK (document_type IN ('CPF', 'CNPJ')),
  name         varchar(200) NOT NULL,
  email        varchar(254),
  phone        varchar(20),
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customers_document_uk UNIQUE (document),
  CONSTRAINT customers_document_len_ck CHECK (
    (document_type = 'CPF' AND document ~ '^[0-9]{11}$') OR
    (document_type = 'CNPJ' AND document ~ '^[0-9A-Z]{12}[0-9]{2}$')
  )
);

CREATE TABLE vehicles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  uuid NOT NULL REFERENCES customers (id),
  plate        varchar(7) NOT NULL CHECK (plate ~ '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$'),
  brand        varchar(60) NOT NULL,
  model        varchar(80) NOT NULL,
  year         smallint NOT NULL CHECK (year >= 1900),
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
-- placa única entre veículos ativos (RN02)
CREATE UNIQUE INDEX vehicles_plate_active_uk ON vehicles (plate) WHERE active;
CREATE INDEX vehicles_customer_ix ON vehicles (customer_id);

-- Catálogo e estoque -------------------------------------------------------

CREATE TABLE service_catalog (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         varchar(120) NOT NULL,
  description  text,
  price_cents  bigint NOT NULL CHECK (price_cents >= 0),
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE parts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku          varchar(40) NOT NULL UNIQUE,
  name         varchar(120) NOT NULL,
  kind         varchar(6) NOT NULL CHECK (kind IN ('PECA', 'INSUMO')),
  unit         varchar(10) NOT NULL,              -- UN, L, KG, M
  price_cents  bigint NOT NULL CHECK (price_cents >= 0),  -- preço por unidade
  physical     numeric(12, 3) NOT NULL DEFAULT 0,
  reserved     numeric(12, 3) NOT NULL DEFAULT 0,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  -- disponível = físico - reservado, nunca negativo (RN06)
  CONSTRAINT parts_stock_ck CHECK (reserved >= 0 AND physical >= reserved),
  -- peça é contada em unidades inteiras
  CONSTRAINT parts_integer_ck CHECK (kind = 'INSUMO' OR (physical = trunc(physical) AND reserved = trunc(reserved)))
);

-- Identidade ---------------------------------------------------------------

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         varchar(254) NOT NULL UNIQUE,
  name          varchar(200) NOT NULL,
  role          varchar(10) NOT NULL CHECK (role IN ('ADMIN', 'ATENDENTE', 'TECNICO', 'CLIENTE')),
  customer_id   uuid REFERENCES customers (id),
  password_hash varchar(100) NOT NULL,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  -- só usuário CLIENTE tem cliente vinculado, e ele é obrigatório (RN11)
  CONSTRAINT users_customer_ck CHECK ((role = 'CLIENTE') = (customer_id IS NOT NULL))
);

-- Atendimento --------------------------------------------------------------

CREATE SEQUENCE service_order_number_seq;

CREATE TABLE service_orders (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number               varchar(20) NOT NULL UNIQUE,     -- OS-2026-000123 (RN03)
  customer_id          uuid NOT NULL REFERENCES customers (id),
  vehicle_id           uuid NOT NULL REFERENCES vehicles (id),
  status               varchar(25) NOT NULL CHECK (status IN (
                         'RECEBIDA', 'EM_DIAGNOSTICO', 'AGUARDANDO_APROVACAO',
                         'EM_EXECUCAO', 'FINALIZADA', 'ENTREGUE')),
  complaint            text NOT NULL CHECK (length(trim(complaint)) > 0),  -- solicitação do cliente
  version              integer NOT NULL DEFAULT 1,        -- concorrência otimista (RN09)
  created_by           uuid NOT NULL REFERENCES users (id),
  received_at          timestamptz NOT NULL DEFAULT now(),
  execution_started_at timestamptz,
  finalized_at         timestamptz,
  delivered_at         timestamptz,
  CONSTRAINT service_orders_duration_ck CHECK (finalized_at IS NULL OR finalized_at >= execution_started_at)
);
CREATE INDEX service_orders_customer_ix ON service_orders (customer_id, received_at DESC);
CREATE INDEX service_orders_status_ix ON service_orders (status, received_at DESC);
CREATE INDEX service_orders_finalized_ix ON service_orders (finalized_at) WHERE finalized_at IS NOT NULL;

-- Itens em diagnóstico (rascunho do orçamento)
CREATE TABLE order_service_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid NOT NULL REFERENCES service_orders (id),
  service_id       uuid NOT NULL REFERENCES service_catalog (id),
  quantity         integer NOT NULL CHECK (quantity > 0),
  completed_at     timestamptz
);
CREATE INDEX order_service_items_order_ix ON order_service_items (order_id);

CREATE TABLE order_part_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid NOT NULL REFERENCES service_orders (id),
  part_id          uuid NOT NULL REFERENCES parts (id),
  quantity         numeric(12, 3) NOT NULL CHECK (quantity > 0)
);
CREATE INDEX order_part_items_order_ix ON order_part_items (order_id);

-- Orçamento versionado, com preços congelados (RN04)
CREATE TABLE quotes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES service_orders (id),
  version      integer NOT NULL CHECK (version > 0),
  total_cents  bigint NOT NULL CHECK (total_cents >= 0),
  status       varchar(10) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'APROVADO', 'REJEITADO', 'INVALIDADO')),
  published_by uuid NOT NULL REFERENCES users (id),
  published_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quotes_version_uk UNIQUE (order_id, version)
);
-- no máximo uma versão pendente ou aprovada por OS
CREATE UNIQUE INDEX quotes_current_uk ON quotes (order_id) WHERE status IN ('PENDENTE', 'APROVADO');

CREATE TABLE quote_items (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id           uuid NOT NULL REFERENCES quotes (id),
  kind               varchar(7) NOT NULL CHECK (kind IN ('SERVICO', 'PECA')),
  service_id         uuid REFERENCES service_catalog (id),
  part_id            uuid REFERENCES parts (id),
  description        varchar(200) NOT NULL,          -- copiada na publicação
  unit               varchar(10) NOT NULL,
  quantity           numeric(12, 3) NOT NULL CHECK (quantity > 0),
  unit_price_cents   bigint NOT NULL CHECK (unit_price_cents >= 0),
  total_cents        bigint NOT NULL CHECK (total_cents >= 0),
  CONSTRAINT quote_items_ref_ck CHECK (
    (kind = 'SERVICO' AND service_id IS NOT NULL AND part_id IS NULL) OR
    (kind = 'PECA' AND part_id IS NOT NULL AND service_id IS NULL)
  )
);
CREATE INDEX quote_items_quote_ix ON quote_items (quote_id);

CREATE TABLE quote_decisions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id    uuid NOT NULL UNIQUE REFERENCES quotes (id),   -- uma decisão por versão (RN05)
  decision    varchar(9) NOT NULL CHECK (decision IN ('APROVADO', 'REJEITADO')),
  decided_by  uuid NOT NULL REFERENCES users (id),
  reason      text,
  decided_at  timestamptz NOT NULL DEFAULT now()
);

-- Movimentos de estoque: só INSERT, nunca UPDATE ou DELETE (RN07)
CREATE TABLE stock_movements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id         uuid NOT NULL REFERENCES parts (id),
  kind            varchar(10) NOT NULL CHECK (kind IN ('ENTRADA', 'RESERVA', 'LIBERACAO', 'CONSUMO', 'ESTORNO', 'AJUSTE')),
  quantity        numeric(12, 3) NOT NULL CHECK (quantity > 0),
  quote_item_id   uuid REFERENCES quote_items (id),
  reverses_id     uuid REFERENCES stock_movements (id),
  note            text,
  created_by      uuid NOT NULL REFERENCES users (id),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stock_movements_part_ix ON stock_movements (part_id, created_at DESC);
-- consumo acontece uma única vez por item do orçamento
CREATE UNIQUE INDEX stock_movements_consumo_uk ON stock_movements (quote_item_id) WHERE kind = 'CONSUMO';
-- estorno acontece uma única vez por movimento
CREATE UNIQUE INDEX stock_movements_estorno_uk ON stock_movements (reverses_id) WHERE kind = 'ESTORNO';

CREATE OR REPLACE FUNCTION stock_movements_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'stock_movements é somente inserção';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stock_movements_no_update BEFORE UPDATE OR DELETE ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION stock_movements_append_only();

-- Histórico de status (RN08)
CREATE TABLE status_history (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES service_orders (id),
  from_status  varchar(25),
  to_status    varchar(25) NOT NULL,
  changed_by   uuid NOT NULL REFERENCES users (id),
  changed_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX status_history_order_ix ON status_history (order_id, changed_at);

-- Idempotência (RN09)
CREATE TABLE idempotency_keys (
  key            varchar(100) NOT NULL,
  user_id        uuid NOT NULL REFERENCES users (id),
  operation      varchar(60) NOT NULL,
  request_hash   char(64) NOT NULL,
  response_status smallint NOT NULL,
  response_body  jsonb NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

-- Down Migration

DROP TABLE IF EXISTS idempotency_keys;
DROP TABLE IF EXISTS status_history;
DROP TRIGGER IF EXISTS stock_movements_no_update ON stock_movements;
DROP FUNCTION IF EXISTS stock_movements_append_only();
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS quote_decisions;
DROP TABLE IF EXISTS quote_items;
DROP TABLE IF EXISTS quotes;
DROP TABLE IF EXISTS order_part_items;
DROP TABLE IF EXISTS order_service_items;
DROP TABLE IF EXISTS service_orders;
DROP SEQUENCE IF EXISTS service_order_number_seq;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS parts;
DROP TABLE IF EXISTS service_catalog;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS customers;
