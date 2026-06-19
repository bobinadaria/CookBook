-- Поиск/матч ингредиентов: два фикса. Запустить в Supabase → SQL Editor один раз.
--
-- 1) SECURITY DEFINER — чтобы функции читали ingredients_base правами владельца,
--    а не вызывающего. Иначе ручной поиск из браузера (модалка «выбрать другой»)
--    под токеном обычного юзера возвращает ПУСТО (RLS/права на справочник),
--    хотя серверный авто-подбор (service_role) работает. Справочник USDA —
--    публичные read-only данные, отдавать его на чтение безопасно.
--
-- 2) Префикс-буст в ранжировании — чтобы общие названия выбирали ПОСТНЫЙ
--    композит, а не случайный отруб. Пример бага: «курица бедро» матчилось на
--    «курица крыло» (trigram-similarity у него выше), хотя правильнее обобщённая
--    «курица». Правило: если запрос НАЧИНАЕТСЯ с имени кандидата (кандидат —
--    ведущее слово запроса), этот кандидат побеждает. Так «курица» бьёт «курица
--    крыло» для запроса «курица бедро».

-- ── match_ingredient: одна лучшая строка ────────────────────────────────────
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
security definer
set search_path = public, pg_temp
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
     -- ведущее слово запроса = имя кандидата → включаем даже если similarity ниже порога
     or lower(query) = ib.name_ru
     or lower(query) like ib.name_ru || ' %'
  order by
    (case when lower(query) = ib.name_ru or lower(query) like ib.name_ru || ' %' then 1 else 0 end) desc,
    similarity(ib.name_ru, lower(query)) desc
  limit 1;
$$;

-- ── match_ingredient_top_n: список кандидатов (для модалки и подсказок) ───────
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
security definer
set search_path = public, pg_temp
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
     or lower(query) = ib.name_ru
     or lower(query) like ib.name_ru || ' %'
  order by
    (case when lower(query) = ib.name_ru or lower(query) like ib.name_ru || ' %' then 1 else 0 end) desc,
    similarity(ib.name_ru, lower(query)) desc
  limit top_n;
$$;

-- Гранты (на случай пересоздания функций).
grant execute on function match_ingredient(text, float) to service_role;
grant execute on function match_ingredient(text, float) to authenticated;
grant execute on function match_ingredient_top_n(text, int, float) to service_role;
grant execute on function match_ingredient_top_n(text, int, float) to authenticated;
