-- ingredient_aliases — per-user (и опционально глобальные) подмены
-- для случаев «стрэчателла → моцарелла», «уксусная эссенция → пропустить из расчёта».
--
-- Использование в lib/nutrition/calculate.ts: перед fuzzy-матчем проверяем,
-- есть ли алиас для этого имени у текущего пользователя или глобальный.
-- Глобальные алиасы (user_id IS NULL) промоутятся админом руками через
-- Supabase Dashboard, после того как N юзеров одобрят одну и ту же замену.
--
-- Запустить вручную в Supabase SQL Editor.

create table if not exists ingredient_aliases (
  id            uuid primary key default gen_random_uuid(),
  alias_text    text not null,
  canonical_id  uuid references ingredients_base(id) on delete cascade,
  user_id       uuid references profiles(id) on delete cascade,
  is_skip       boolean not null default false,
  created_at    timestamp with time zone default now(),

  -- Один алиас на пользователя на текст. Для глобальных (user_id IS NULL)
  -- уникальность гарантируется отдельным partial-индексом ниже.
  constraint alias_unique_per_user unique (alias_text, user_id),

  -- Логика: либо есть canonical_id (это замена), либо is_skip=true (пропустить).
  -- Не может быть «пусто» (нет смысла) или «и то и то».
  constraint alias_skip_or_canonical check (
    (canonical_id is not null and not is_skip) or
    (canonical_id is null and is_skip)
  )
);

-- Partial-индекс на глобальные алиасы (user_id IS NULL). Без него unique-констрейнт
-- (alias_text, user_id) не работает для NULL — Postgres считает NULL != NULL.
create unique index if not exists ingredient_aliases_global_unique
  on ingredient_aliases (alias_text)
  where user_id is null;

-- Под быструю проверку при матчинге (lookup по alias_text + user_id или NULL).
create index if not exists ingredient_aliases_lookup
  on ingredient_aliases (alias_text, user_id);

-- RLS: юзер видит свои + глобальные, может создавать только свои.
alter table ingredient_aliases enable row level security;

create policy "read globals + own"
  on ingredient_aliases
  for select
  using (user_id is null or user_id = auth.uid());

create policy "insert own"
  on ingredient_aliases
  for insert
  with check (user_id = auth.uid());

create policy "update own"
  on ingredient_aliases
  for update
  using (user_id = auth.uid());

create policy "delete own"
  on ingredient_aliases
  for delete
  using (user_id = auth.uid());

create policy "admin all"
  on ingredient_aliases
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- RPC для frontend: top-N кандидатов по similarity для одного query.
-- Используется когда нет точного/fuzzy-матча — показываем юзеру варианты.
-- Возвращаем top-3 по умолчанию.
create or replace function match_ingredient_top_n(
  query text,
  top_n int default 3,
  threshold float default 0.2
)
returns table (
  id uuid,
  name_ru text,
  name_en text,
  kcal_100g numeric,
  protein_100g numeric,
  fat_100g numeric,
  carbs_100g numeric,
  category text,
  similarity float
)
language sql
stable
as $$
  select
    ib.id,
    ib.name_ru,
    ib.name_en,
    ib.kcal_100g,
    ib.protein_100g,
    ib.fat_100g,
    ib.carbs_100g,
    ib.category,
    similarity(ib.name_ru, lower(query)) as similarity
  from ingredients_base ib
  where similarity(ib.name_ru, lower(query)) >= threshold
  order by similarity desc
  limit top_n;
$$;

grant execute on function match_ingredient_top_n(text, int, float) to service_role;
grant execute on function match_ingredient_top_n(text, int, float) to authenticated;
