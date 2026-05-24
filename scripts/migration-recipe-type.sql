-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: recipe_type (еда / напиток)
--
-- Добавляет рецепту «тип». Напитки (drink) не показывают КБЖУ, время
-- приготовления и порции — у них только состав и шаги.
--
-- Применить вручную в Supabase → SQL Editor (как остальные миграции).
-- Безопасно запускать повторно (IF NOT EXISTS / DROP CONSTRAINT IF EXISTS).
-- Все существующие рецепты автоматически получают тип 'food'.
-- ─────────────────────────────────────────────────────────────────────────────

alter table recipes
  add column if not exists recipe_type text not null default 'food';

-- Разрешаем только два значения. Если позже захочется 'dessert' и т.п. —
-- пересоздать constraint с новым списком.
alter table recipes
  drop constraint if exists recipes_recipe_type_check;

alter table recipes
  add constraint recipes_recipe_type_check
  check (recipe_type in ('food', 'drink'));
