-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: гарантировать английские (*_en) колонки для двуязычного
-- редактирования рецептов прямо в админ-форме.
--
-- recipes.title_en / description_en / note_en уже существуют (авто-перевод),
-- но добавляем их через IF NOT EXISTS на всякий случай — идемпотентно.
-- recipes.ingredients_en и steps.title_en / description_en раньше были
-- опциональны (авто-перевод имел fallback) — теперь делаем их обязательно.
--
-- Применить вручную в Supabase → SQL Editor. Безопасно запускать повторно.
-- ─────────────────────────────────────────────────────────────────────────────

alter table recipes add column if not exists title_en       text;
alter table recipes add column if not exists description_en text;
alter table recipes add column if not exists note_en        text;
alter table recipes add column if not exists ingredients_en text;

alter table steps   add column if not exists title_en       text;
alter table steps   add column if not exists description_en text;
