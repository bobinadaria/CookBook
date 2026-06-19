-- search_ingredients — список/подстрочный поиск по справочнику для ручного выбора
-- в модалке КБЖУ («Выбрать другой»). Запустить в Supabase → SQL Editor один раз.
--
-- Зачем отдельно от match_ingredient_top_n:
--   Триграм-ранжирование годится для АВТО-подбора (одна догадка), но для РУЧНОГО выбора
--   оно даёт мусор: при пустом/коротком вводе и низком пороге список добивается строками
--   с общими биграммами («креветк» → круассан, лук красный, курица крыло). Для ручного
--   выбора пользователю нужнее весь справочник + честный фильтр по подстроке.
--
--   - search пустой/null → ВЕСЬ справочник, по алфавиту (категория, затем имя).
--   - search задан → ILIKE-подстрока, ё→е нормализована на обеих сторонах (как exact-матч).
--   SECURITY DEFINER — иначе из браузера под токеном обычного юзера RLS отдаёт пусто.

create or replace function search_ingredients(search text default null)
returns table (
  id uuid,
  name_ru text,
  name_en text,
  category text,
  kcal_100g numeric,
  protein_100g numeric,
  fat_100g numeric,
  carbs_100g numeric
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    ib.id, ib.name_ru, ib.name_en, ib.category,
    ib.kcal_100g, ib.protein_100g, ib.fat_100g, ib.carbs_100g
  from ingredients_base ib
  where search is null
     or btrim(search) = ''
     or translate(lower(ib.name_ru), 'ё', 'е')
          like '%' || translate(lower(btrim(search)), 'ё', 'е') || '%'
  order by ib.category nulls last, ib.name_ru;
$$;

grant execute on function search_ingredients(text) to service_role;
grant execute on function search_ingredients(text) to authenticated;
