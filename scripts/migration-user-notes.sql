-- Личные заметки пользователя к рецептам (Phase 4 — личный кабинет).
-- Запустить в Supabase Dashboard → SQL Editor один раз.
--
-- Каждый юзер может иметь одну заметку на рецепт (unique user_id+recipe_id).
-- RLS: пользователь видит и меняет ТОЛЬКО свои заметки.

create table if not exists public.user_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  recipe_id   uuid not null references public.recipes(id) on delete cascade,
  content     text,
  updated_at  timestamptz default now(),
  unique (user_id, recipe_id)
);

create index if not exists user_notes_user_id_idx on public.user_notes(user_id);

alter table public.user_notes enable row level security;

-- Политики: каждый юзер管ит только свои заметки (auth.uid() = user_id).
-- DROP перед CREATE — чтобы повторный запуск миграции не падал.
drop policy if exists "user_notes_select_own" on public.user_notes;
create policy "user_notes_select_own" on public.user_notes
  for select using (auth.uid() = user_id);

drop policy if exists "user_notes_insert_own" on public.user_notes;
create policy "user_notes_insert_own" on public.user_notes
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_notes_update_own" on public.user_notes;
create policy "user_notes_update_own" on public.user_notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_notes_delete_own" on public.user_notes;
create policy "user_notes_delete_own" on public.user_notes
  for delete using (auth.uid() = user_id);
