-- Миграция: marketing_consent в profiles
-- Запустить вручную в Supabase SQL Editor
-- 2026-06-30

-- Добавляем колонку в profiles (если ещё нет)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false;

-- Комментарий для документации
COMMENT ON COLUMN profiles.marketing_consent IS
  'GDPR opt-in: пользователь согласился на маркетинговые письма при регистрации';
