-- Добавляет счётчик AI-кредитов на обложки в profiles.
-- Применять вручную в Supabase SQL Editor.
-- После применения вебхук Stripe начнёт начислять кредиты при покупке пакетов.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cover_credits INT NOT NULL DEFAULT 0;

-- Индекс не нужен: запросы идут точечно по id (первичный ключ).
