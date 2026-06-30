-- Миграция: добавляем колонку welcome_shown в profiles
-- Назначение: отслеживать, показывали ли мы /welcome пользователю (для Google OAuth).
-- После однократного показа ставим TRUE — повторного редиректа не будет.
-- Применить вручную в Supabase SQL Editor.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS welcome_shown boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN profiles.welcome_shown IS 'TRUE = страница /welcome уже показывалась пользователю (для Google OAuth onboarding)';
