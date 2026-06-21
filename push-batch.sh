#!/usr/bin/env bash
# Батч коммитов за 18–19 июня 2026. Запускать на Маке, в корне репозитория.
# Каждый блок: git add <конкретные файлы> + git commit. В конце — один git push.
# Пуш в main → Vercel задеплоит автоматически.
set -euo pipefail

cd "$(dirname "$0")"

# Подчистить артефакт песочницы (если остался) — git его и так не трекает.
rm -f .git/.cowork_write_test 2>/dev/null || true

echo "==> Ветка: $(git branch --show-current)"
echo "==> Незакоммиченных файлов: $(git status --porcelain | wc -l | tr -d ' ')"

# ── C1: KБЖУ — разрешение, парсер, ранжирование, таймауты, ручной расчёт ──────
git add \
  src/components/recipe/NutritionResolveModal.tsx \
  src/components/recipe/FuzzyMatchReview.tsx \
  src/components/recipe/UnmatchedIngredients.tsx \
  src/components/recipe/NutritionFacts.tsx \
  src/lib/nutrition/parse.ts \
  src/lib/nutrition/prompt.mjs \
  src/lib/nutrition/calculate.ts \
  src/lib/nutrition/estimate.ts \
  src/lib/fetch-with-timeout.ts \
  src/types/index.ts \
  scripts/migration-chicken-rank-aliases.sql \
  scripts/migration-ingredient-search-list.sql \
  scripts/migration-ingredient-search-rank.sql
git commit -m "feat(kbju): авто-подбор + пошаговая модалка разрешения КБЖУ" -m \
"Парсер многосписочного состава (без дедупа), пошаговая модалка разрешения
ненайденных ингредиентов в стиле вопросов Cowork, ручной расчёт КБЖУ блюда.
Фикс ранжирования курицы (ё→е в матче + алиасы форм отрубов) и таймауты на
расчёт. Миграции поиска (security definer) и алиасов — прогнать в Supabase."

# ── C2: фиксы юзер-рецептов ───────────────────────────────────────────────────
git add \
  src/app/dashboard/recipes/actions.ts \
  "src/app/dashboard/recipes/[id]/edit/page.tsx" \
  src/app/dashboard/recipes/page.tsx \
  src/components/dashboard/MyBookView.tsx \
  src/components/dashboard/RecipeOwnerActions.tsx \
  src/components/dashboard/UserRecipeForm.tsx \
  src/lib/supabase/recipes.ts \
  src/context/FavoritesContext.tsx
git commit -m "fix(user-recipes): сохранение шагов + UX «Моей книги»" -m \
"Чиним save-баг шагов (steps.order — зарезервировано в PostgREST → delete-all
+insert), editorial-модалка удаления вместо нативной, сердечко вместо бейджа
в «Моей книге», флаг loaded в FavoritesContext, чтобы вкладка «Сохранённые»
не мигала пустотой до загрузки."

# ── C3: favorites + поиск в каталоге ──────────────────────────────────────────
git add \
  "src/app/(public)/recipes/[slug]/page.tsx" \
  "src/app/(public)/recipes/page.tsx" \
  src/components/recipe/FavoriteButton.tsx
git commit -m "feat(favorites): крупное сердечко на рецепте + поиск с учётом склонений" -m \
"FavoriteButton получил size (lg на странице рецепта). Поиск в каталоге стал
устойчив к склонениям и ё/е («котлеты» находят «котлета», «свекла»=«свёкла»)."

# ── C4: /pricing + чекаут + шапка + i18n-строки ───────────────────────────────
git add \
  "src/app/(public)/pricing/page.tsx" \
  src/components/pricing/CheckoutButton.tsx \
  src/components/pricing/CheckoutModal.tsx \
  src/components/pricing/CheckoutProvider.tsx \
  src/lib/checkout.ts \
  src/app/dashboard/layout.tsx \
  src/components/layout/Header.tsx \
  messages/ru.json \
  messages/en.json
git commit -m "feat(pricing): чекаут-плейсхолдер, без «кредитов», состояния кнопок + шапка" -m \
"Единая точка PAYMENTS_ENABLED/mountCheckout, пакеты «до N картинок» вместо
слова «кредиты», состояния кнопок тарифов (без зелёного, «Перейти на Free»).
Переработка шапки кабинета: «Моя книга» справа, «← На сайт» слева, тариф/выход
в профиле. messages/* несут также строки kbju-модалки, импорта и удаления."

# ── C5: импорт по ссылке ──────────────────────────────────────────────────────
git add \
  src/app/api/recipes/import-url/route.ts \
  src/lib/recipe-import/fetch-page.ts \
  src/lib/recipe-import/index.ts \
  src/lib/recipe-import/types.ts
git commit -m "feat(import): фидбек импорта по ссылке + браузерный User-Agent" -m \
"Понятные сообщения при частичном импорте/блокировке JS и браузерный UA для
сайтов вроде andychef, которые отбивают серверные запросы."

# ── C6: аналитика ─────────────────────────────────────────────────────────────
git add package.json package-lock.json src/app/layout.tsx
git commit -m "chore: подключить @vercel/analytics"

# ── C7: kit UX-тестирования ───────────────────────────────────────────────────
git add \
  ux-testing/UX_Testing_Plan.docx \
  ux-testing/UX_Testing_Tracker.xlsx \
  ux-testing/session-script.md \
  ux-testing/fix-before-P2-prompt.md
git commit -m "chore(ux-testing): kit для UX-тестов (план, сценарий, трекер)"

echo
echo "==> Новые коммиты:"
git log --oneline -7
echo
echo "==> Осталось незакоммиченного (ожидается 0, кроме самого push-batch.sh):"
git status --porcelain

echo
read -r -p "Запушить в origin/main? Это запустит деплой на Vercel. [y/N] " ans
if [[ "${ans:-}" == "y" || "${ans:-}" == "Y" ]]; then
  git push origin main
  echo "==> Запушено. Vercel подхватит деплой автоматически."
else
  echo "==> Пропустил push. Запушишь вручную: git push origin main"
fi
