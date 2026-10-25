-- Up Migration
-- Função de trigger com search_path fixo: não resolve nomes pelo search_path de quem chama
-- (alerta 0011 do linter do Supabase). O corpo não referencia nenhum objeto.
ALTER FUNCTION stock_movements_append_only() SET search_path = '';

-- Down Migration
ALTER FUNCTION stock_movements_append_only() RESET search_path;
