-- Имя пользователя для персонализации (обращение по имени в кабинете).
-- Запустить в Supabase Dashboard → SQL Editor один раз.

-- 1. Колонка имени в профиле
alter table public.profiles add column if not exists display_name text;

-- 2. Обновлённый триггер автосоздания профиля: подхватывает имя из метаданных.
--    Источники по приоритету: display_name (email-регистрация передаёт явно) →
--    full_name / name (приходит от Google OAuth) → часть email до @.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, display_name)
  values (
    new.id,
    new.email,
    'user',
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. RLS: пользователь может читать и менять свой профиль (имя).
--    (Админ-проверка роли идёт через service_role и RLS не трогает.)
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- 4. Бэкфилл имени существующим юзерам (у кого пусто) — из метаданных или email.
update public.profiles p
set display_name = coalesce(
  nullif(u.raw_user_meta_data->>'display_name', ''),
  nullif(u.raw_user_meta_data->>'full_name', ''),
  nullif(u.raw_user_meta_data->>'name', ''),
  split_part(p.email, '@', 1)
)
from auth.users u
where p.id = u.id and (p.display_name is null or p.display_name = '');
