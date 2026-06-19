-- Ранжирование ингредиентов: чиним «куриные» матчи. Запустить в Supabase → SQL Editor один раз.
--
-- Контекст бага (курица):
--   Парсер КБЖУ нормализует к существительному ед.ч.: «2 куриных бедра…» → "курица бедро",
--   «500 г куриного филе» → "курица филе". А в базе бёдра/крылья записаны прилагательным,
--   часто через ё («куриные бёдра», 221). Триграм-сходство тогда выше у «курица крыло»
--   (общий токен «курица»), и расчёт молча засчитывал крыло вместо бедра.
--
-- Два слоя фикса:
--   1) ё→е нормализация В РАНЖИРОВАНИИ — приводим обе стороны через translate(…, 'ё','е'),
--      как это давно делает JS-exact-матч (lib/nutrition/match.ts → normalizeKey). Без неё
--      «бёдра» (база) и «бедра» (запрос) считаются разными строками и similarity занижается.
--      Это общая гигиена: помогает всем ё-словам (свёкла, мёд, бёдра, …), не только курице.
--   2) Глобальные алиасы для форм, которые ё→е не закрывает — морфологический разрыв
--      «курица бедро» (ед.ч., сущ.) ↔ «куриные бёдра» (мн.ч., прил.). resolveAlias() идёт
--      ДО fuzzy (lib/nutrition/calculate.ts §3a), поэтому матч становится детерминированным.
--      Эти 4 алиаса уже применены в проде через service-role; вставка ниже идемпотентна
--      (on conflict do nothing) — нужна для версионирования и чистого пересоздания базы.

-- ── match_ingredient: одна лучшая строка (ё→е на обеих сторонах) ──────────────
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
  with q as (select translate(lower(query), 'ё', 'е') as nq)
  select
    ib.id,
    ib.name_ru,
    ib.name_en,
    ib.kcal_100g,
    ib.protein_100g,
    ib.fat_100g,
    ib.carbs_100g,
    ib.category,
    similarity(translate(lower(ib.name_ru), 'ё', 'е'), q.nq) as similarity
  from ingredients_base ib, q
  where similarity(translate(lower(ib.name_ru), 'ё', 'е'), q.nq) >= threshold
     -- ведущее слово запроса = имя кандидата → включаем даже если similarity ниже порога
     or q.nq = translate(lower(ib.name_ru), 'ё', 'е')
     or q.nq like translate(lower(ib.name_ru), 'ё', 'е') || ' %'
  order by
    (case
       when q.nq = translate(lower(ib.name_ru), 'ё', 'е')
         or q.nq like translate(lower(ib.name_ru), 'ё', 'е') || ' %'
       then 1 else 0
     end) desc,
    similarity desc
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
  with q as (select translate(lower(query), 'ё', 'е') as nq)
  select
    ib.id,
    ib.name_ru,
    ib.name_en,
    ib.kcal_100g,
    ib.protein_100g,
    ib.fat_100g,
    ib.carbs_100g,
    ib.category,
    similarity(translate(lower(ib.name_ru), 'ё', 'е'), q.nq) as similarity
  from ingredients_base ib, q
  where similarity(translate(lower(ib.name_ru), 'ё', 'е'), q.nq) >= threshold
     or q.nq = translate(lower(ib.name_ru), 'ё', 'е')
     or q.nq like translate(lower(ib.name_ru), 'ё', 'е') || ' %'
  order by
    (case
       when q.nq = translate(lower(ib.name_ru), 'ё', 'е')
         or q.nq like translate(lower(ib.name_ru), 'ё', 'е') || ' %'
       then 1 else 0
     end) desc,
    similarity desc
  limit top_n;
$$;

-- Гранты (на случай пересоздания функций).
grant execute on function match_ingredient(text, float) to service_role;
grant execute on function match_ingredient(text, float) to authenticated;
grant execute on function match_ingredient_top_n(text, int, float) to service_role;
grant execute on function match_ingredient_top_n(text, int, float) to authenticated;

-- ── Глобальные алиасы для форм парсера, которые ё→е не закрывает ──────────────
-- (морфология «курица бедро» ↔ «куриные бёдра»; «курица филе» → грудка, не крыло/фарш).
insert into ingredient_aliases (alias_text, canonical_id, user_id, is_skip)
select v.alias, ib.id, null, false
from (values
  ('курица бедро',      'куриные бёдра'),          -- было: «курица крыло» (222) ❌
  ('курица филе',       'курица грудка'),          -- было: «курица крыло» (222) ❌
  ('куриное филе',      'курица грудка'),          -- было: «куриный фарш» (143) ❌
  ('курица филе бедра', 'куриные бёдра без кожи')  -- бескостное бедро без кожи (119)
) as v(alias, target)
join ingredients_base ib on ib.name_ru = v.target
on conflict (alias_text) where user_id is null do nothing;
