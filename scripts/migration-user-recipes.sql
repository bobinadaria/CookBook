-- Миграция: «Своя книга рецептов» (Фаза B, фича #1).
-- Запустить ОДИН РАЗ в Supabase Dashboard → SQL Editor.
--
-- Что делает:
--   1. Добавляет к recipes владельца (owner_id) и видимость (visibility).
--   2. Добавляет к profiles тарифный план (plan) — тонкий каркас монетизации.
--   3. Настраивает RLS, чтобы пользователь управлял ТОЛЬКО своими приватными
--      рецептами, и чтобы шаги/категории приватных рецептов НЕ утекали публично.
--
-- Аддитивно и идемпотентно — можно запускать повторно без вреда.
-- Существующие (авторские) рецепты остаются visibility='public', owner_id=NULL.

-- ─── 1. recipes: владелец + видимость ────────────────────────────────────────
alter table public.recipes
  add column if not exists owner_id   uuid references auth.users(id) on delete cascade,
  add column if not exists visibility text not null default 'public';
  -- visibility: 'public' (каталог автора) | 'private' (книга пользователя) | 'unlisted' (на будущее)

create index if not exists recipes_owner_id_idx on public.recipes(owner_id);

-- ─── 2. profiles: тарифный план ──────────────────────────────────────────────
alter table public.profiles
  add column if not exists plan text not null default 'free';
  -- plan: 'free' | 'premium' | 'lifetime'
  -- NOTE на этап монетизации: текущая политика "Own update" на profiles позволяет
  -- пользователю менять свою строку, включая plan. Перед включением оплаты
  -- ограничить запись plan (только service-role/вебхук), иначе self-upgrade.

-- ─── 3. RLS: recipes — пользователь управляет только своими ───────────────────
-- Существующие политики (Public read published / Admin write) НЕ трогаем —
-- новые ДОБАВЛЯЮТСЯ (в Postgres permissive-политики объединяются по OR).

drop policy if exists "recipes_select_own" on public.recipes;
create policy "recipes_select_own" on public.recipes
  for select using (auth.uid() = owner_id);

drop policy if exists "recipes_insert_own" on public.recipes;
create policy "recipes_insert_own" on public.recipes
  for insert with check (
    auth.uid() = owner_id and visibility = 'private' and published = false
  );

drop policy if exists "recipes_update_own" on public.recipes;
create policy "recipes_update_own" on public.recipes
  for update using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id and visibility = 'private' and published = false);

drop policy if exists "recipes_delete_own" on public.recipes;
create policy "recipes_delete_own" on public.recipes
  for delete using (auth.uid() = owner_id);

-- ─── 4. RLS: steps — читаемы для опубликованных ИЛИ своих; пишет владелец ──────
-- ВАЖНО: старая политика "Public read" (using true) делала ВСЕ шаги публичными,
-- включая шаги приватных рецептов. Заменяем на видимость-зависимую.
-- Публичный сайт не ломается: шаги опубликованных рецептов остаются читаемыми.
drop policy if exists "Public read" on public.steps;
drop policy if exists "steps_select_visible" on public.steps;
create policy "steps_select_visible" on public.steps
  for select using (
    exists (
      select 1 from public.recipes r
      where r.id = steps.recipe_id
        and (r.published = true or r.owner_id = auth.uid())
    )
  );

drop policy if exists "steps_insert_own" on public.steps;
create policy "steps_insert_own" on public.steps
  for insert with check (
    exists (select 1 from public.recipes r where r.id = steps.recipe_id and r.owner_id = auth.uid())
  );

drop policy if exists "steps_update_own" on public.steps;
create policy "steps_update_own" on public.steps
  for update using (
    exists (select 1 from public.recipes r where r.id = steps.recipe_id and r.owner_id = auth.uid())
  );

drop policy if exists "steps_delete_own" on public.steps;
create policy "steps_delete_own" on public.steps
  for delete using (
    exists (select 1 from public.recipes r where r.id = steps.recipe_id and r.owner_id = auth.uid())
  );

-- ─── 5. RLS: recipe_categories — та же видимость-логика ───────────────────────
drop policy if exists "Public read" on public.recipe_categories;
drop policy if exists "recipe_categories_select_visible" on public.recipe_categories;
create policy "recipe_categories_select_visible" on public.recipe_categories
  for select using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_categories.recipe_id
        and (r.published = true or r.owner_id = auth.uid())
    )
  );

drop policy if exists "recipe_categories_insert_own" on public.recipe_categories;
create policy "recipe_categories_insert_own" on public.recipe_categories
  for insert with check (
    exists (select 1 from public.recipes r where r.id = recipe_categories.recipe_id and r.owner_id = auth.uid())
  );

drop policy if exists "recipe_categories_delete_own" on public.recipe_categories;
create policy "recipe_categories_delete_own" on public.recipe_categories
  for delete using (
    exists (select 1 from public.recipes r where r.id = recipe_categories.recipe_id and r.owner_id = auth.uid())
  );

-- ─── Готово. Проверь после применения: ───────────────────────────────────────
--   • публичный сайт по-прежнему показывает рецепты и их шаги;
--   • в админке создание/редактирование рецептов работает;
--   • (после кода) другой пользователь не видит чужие приватные рецепты.
