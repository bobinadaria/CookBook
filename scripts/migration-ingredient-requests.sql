-- ingredient_requests — запросы пользователей на добавление ингредиентов в базу.
-- Когда пользователь нажимает «Запросить добавление» в блоке «Не нашли в базе»,
-- запись сохраняется здесь. Дарья видит список в /admin/ingredient-requests
-- и может добавить ингредиент вручную в ingredients_base.
--
-- Запустить вручную в Supabase Dashboard → SQL Editor.

-- 1. Таблица запросов
create table if not exists ingredient_requests (
  id              uuid primary key default gen_random_uuid(),
  -- Сырая строка из рецепта («щавель свежий 250 г»)
  original_text   text not null,
  -- Имя, которое выделил парсер («щавель свежий»)
  parsed_name     text not null,
  user_id         uuid references profiles(id) on delete set null,
  created_at      timestamp with time zone default now()
);

-- Индекс для группировки по parsed_name (для подсчёта популярных запросов)
create index if not exists ingredient_requests_parsed_name_idx
  on ingredient_requests (parsed_name);

-- RLS: пользователи могут только создавать; читать — только admin
alter table ingredient_requests enable row level security;

create policy "insert own"
  on ingredient_requests
  for insert
  with check (user_id = auth.uid());

create policy "admin read all"
  on ingredient_requests
  for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "admin delete"
  on ingredient_requests
  for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 2. Расширяем ingredient_aliases: добавляем ai_estimate для случая
--    «ингредиент не найден в базе, но AI оценил макросы приблизительно».
--    Когда ai_estimate заполнен — canonical_id и is_skip = null/false,
--    расчёт использует эти значения с пометкой «приблизительно».

alter table ingredient_aliases
  add column if not exists ai_estimate jsonb;

-- Обновляем constraint: теперь три валидных состояния:
--   1. canonical_id задан, is_skip=false, ai_estimate=null → обычная замена
--   2. canonical_id=null, is_skip=true, ai_estimate=null → «пропустить»
--   3. canonical_id=null, is_skip=false, ai_estimate не null → AI-оценка
alter table ingredient_aliases drop constraint if exists alias_skip_or_canonical;

alter table ingredient_aliases
  add constraint alias_skip_or_canonical check (
    (canonical_id is not null and not is_skip and ai_estimate is null) or
    (canonical_id is null and is_skip and ai_estimate is null) or
    (canonical_id is null and not is_skip and ai_estimate is not null)
  );
