-- Fuzzy ingredient name matching via pg_trgm.
-- Запустить в Supabase Dashboard → SQL Editor один раз.
-- Используется в /api/admin/calculate-nutrition для матча названий ингредиентов
-- из рецепта против ingredients_base, когда точного совпадения нет
-- (например, «мука» → «мука пшеничная», «яйца» → «яйцо»).

-- 1. Расширение pg_trgm (если ещё не включено)
create extension if not exists pg_trgm;

-- 2. GIN-индекс на name_ru для быстрого trigram-поиска
create index if not exists ingredients_base_name_ru_trgm_idx
  on ingredients_base
  using gin (name_ru gin_trgm_ops);

-- 3. RPC-функция для матча через JS-клиента.
-- Возвращает ОДНУ лучшую строку (или ничего), если similarity >= threshold.
-- Дефолтный порог 0.3 — эмпирически: «мука» → «мука пшеничная» = 0.4,
-- «яйца» → «яйцо» = 0.5, «огурец солёный» → «огурец» = 0.45.
create or replace function match_ingredient(query text, threshold float default 0.3)
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
  limit 1;
$$;

-- 4. Grant — функция должна быть вызываема service_role'ом
grant execute on function match_ingredient(text, float) to service_role;
grant execute on function match_ingredient(text, float) to authenticated;
