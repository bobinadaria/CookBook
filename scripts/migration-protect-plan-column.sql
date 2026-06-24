-- ВАЖНО — закрывает реальную дыру: текущая RLS-политика "profiles_update_own"
-- (см. scripts/migration-display-name.sql) разрешает обновлять ЛЮБУЮ колонку
-- своей строки в profiles, потому что RLS в Postgres работает на уровне строк,
-- а не колонок. Это значит, что прямо сейчас любой залогиненный пользователь
-- может открыть консоль браузера и выполнить:
--
--   await supabase.from('profiles').update({ plan: 'premium' }).eq('id', user.id)
--
-- ...и выдать себе Premium бесплатно — без оплаты, без участия сервера.
-- getEntitlements() читает план через service-role и сам по себе вызову не
-- помогает: он просто доверяет тому, что лежит в колонке, а колонку можно
-- было подделать клиентом.
--
-- Фикс — триггер: при любом UPDATE строки profiles, если новое значение plan
-- отличается от старого И запрос пришёл НЕ от service_role (т.е. не из наших
-- server actions / API-роутов на createServiceRoleClient), молча откатываем
-- plan к старому значению. display_name и другие колонки остаются свободно
-- редактируемыми пользователем — трогаем только plan.
--
-- Запустить вручную в Supabase Dashboard → SQL Editor.

create or replace function public.protect_plan_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.plan is distinct from old.plan and auth.role() <> 'service_role' then
    new.plan := old.plan;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_plan on public.profiles;
create trigger profiles_protect_plan
  before update on public.profiles
  for each row execute function public.protect_plan_column();

-- Проверка после применения (выполнить как обычный пользователь через
-- supabase.from('profiles').update({ plan: 'premium' })... — plan должен
-- остаться прежним). Через scripts/_grant-premium-tmp.mjs (service-role)
-- смена плана продолжит работать как раньше — там используется service-role
-- ключ, auth.role() для него возвращает 'service_role'.
