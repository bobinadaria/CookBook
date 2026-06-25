-- ============================================================
-- Migration: credit_ledger — append-only кредитный журнал
-- Применять вручную в Supabase SQL Editor
-- ============================================================

-- 1. Таблица
CREATE TABLE IF NOT EXISTS credit_ledger (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  delta            integer     NOT NULL,          -- >0 пополнение, <0 списание
  reason           text        NOT NULL,          -- 'pack_s'|'pack_m'|'pack_l'|'consume_cover'
  stripe_event_id  text,                          -- идемпотентность вебхука
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- 2. Индексы
CREATE INDEX IF NOT EXISTS credit_ledger_user_id_idx
  ON credit_ledger(user_id);

-- Уникальный stripe_event_id — не зачислим дважды за одно событие
CREATE UNIQUE INDEX IF NOT EXISTS credit_ledger_stripe_event_id_idx
  ON credit_ledger(stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;

-- 3. RLS
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;

-- Пользователь видит только свои записи
CREATE POLICY "Users can view own credits"
  ON credit_ledger FOR SELECT
  USING (auth.uid() = user_id);

-- Запись — только через service role (сервер); клиент не может манипулировать балансом
-- (service role bypasses RLS автоматически)

-- 4. Функция spend_cover_credit — атомарное списание
--    Возвращает TRUE если списание прошло, FALSE если баланс = 0.
--    SECURITY DEFINER — выполняется с правами owner'а, клиент вызывает через RPC.
CREATE OR REPLACE FUNCTION spend_cover_credit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
BEGIN
  -- Блокируем строки пользователя на время транзакции
  SELECT COALESCE(SUM(delta), 0) INTO v_balance
  FROM credit_ledger
  WHERE user_id = p_user_id
  FOR UPDATE;          -- advisory lock через SELECT ... FOR UPDATE не работает на агрегате,
                       -- поэтому используем отдельный advisory lock ниже
  -- Повторяем без FOR UPDATE (агрегат не локируется), используем advisory lock
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  SELECT COALESCE(SUM(delta), 0) INTO v_balance
  FROM credit_ledger
  WHERE user_id = p_user_id;

  IF v_balance <= 0 THEN
    RETURN false;
  END IF;

  INSERT INTO credit_ledger (user_id, delta, reason)
  VALUES (p_user_id, -1, 'consume_cover');

  RETURN true;
END;
$$;

-- 5. Функция get_cover_balance — быстрый читающий хелпер
CREATE OR REPLACE FUNCTION get_cover_balance(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(delta), 0)::integer
  FROM credit_ledger
  WHERE user_id = p_user_id;
$$;
