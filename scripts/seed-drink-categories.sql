-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: категории напитков (тип `drink_type`)
--
-- Заводит фильтр «Тип напитка» для каталога. Применить вручную в Supabase →
-- SQL Editor. Безопасно запускать повторно (ON CONFLICT DO NOTHING по slug).
--
-- Зависит от того, что в таблице categories тип хранится в колонке `type` (text)
-- и есть UNIQUE на `slug`. Колонка `name_en` уже существует (двуязычные категории).
-- ─────────────────────────────────────────────────────────────────────────────

insert into categories (name, name_en, slug, type) values
  ('Охлаждающие', 'Cooling', 'cooling', 'drink_type'),
  ('Согревающие', 'Warming', 'warming', 'drink_type')
on conflict (slug) do nothing;
