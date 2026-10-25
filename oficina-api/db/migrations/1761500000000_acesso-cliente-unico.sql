-- Up Migration
-- Um usuário de acesso por cliente cadastrado (RN11).
CREATE UNIQUE INDEX users_customer_uk ON users (customer_id) WHERE customer_id IS NOT NULL;

-- Down Migration
DROP INDEX users_customer_uk;
