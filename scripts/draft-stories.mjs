/**
 * Черновики «историй» для уже опубликованных рецептов каталога.
 *
 * Контекст: раньше у рецепта было сухое сенсорное «описание» (description) под
 * заголовком. Теперь главный текст рецепта — личная ИСТОРИЯ (поле note), и она
 * стоит сразу под заголовком. У старых рецептов история часто пустая. Этот скрипт
 * по каждому такому рецепту накидывает ТЁПЛЫЙ ЧЕРНОВИК истории на основе того, что
 * уже известно (название + старое описание + состав), чтобы Дарье было от чего
 * оттолкнуться и дописать настоящие воспоминания.
 *
 * Важно:
 *   • Никогда не перезаписывает непустую note (твои живые истории в безопасности).
 *   • По умолчанию — dry-run: только показывает и сохраняет предпросмотр в
 *     story-drafts.json в корне проекта. Ничего не пишет в БД без --write.
 *   • Трогает только рецепты каталога (owner_id IS NULL) — личные рецепты
 *     пользователей не затрагиваются.
 *   • Пишет только русскую историю (note). EN-версию (note_en) потом можно
 *     заполнить кнопкой «Перевести» в админке.
 *   • AI не знает твоих настоящих воспоминаний — это именно ЗАГОТОВКА: без
 *     выдуманных мест/дат/людей, просто тёплый зачин, который ты допишешь.
 *
 * Использование:
 *   node scripts/draft-stories.mjs                 # dry-run: показать черновики
 *   node scripts/draft-stories.mjs --limit 3       # только первые 3 (проверить тон)
 *   node scripts/draft-stories.mjs --write          # записать черновики в note
 *   node scripts/draft-stories.mjs --write --limit 3
 *   node scripts/draft-stories.mjs --all            # включая рецепты, где note уже есть
 *                                                    # (по умолчанию такие пропускаются)
 */
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { config } from "dotenv";
import { resolve } from "path";
import { writeFileSync } from "fs";

config({ path: resolve(".env.local") });

const apply = process.argv.includes("--write");
const includeExisting = process.argv.includes("--all");
const limitArg = process.argv.indexOf("--limit");
const limit = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;
const offsetArg = process.argv.indexOf("--offset");
const offset = offsetArg !== -1 ? parseInt(process.argv[offsetArg + 1], 10) : 0;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) { console.error("✗ Supabase env missing"); process.exit(1); }
if (!OPENAI_KEY) { console.error("✗ OPENAI_API_KEY missing"); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_KEY });
const MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `Ты помогаешь Дарье — автору личной кулинарной книги-журнала «The Slow Table».
Твоя задача: написать короткий ТЁПЛЫЙ ЧЕРНОВИК-ЗАГОТОВКУ «истории блюда», от которой Дарья
оттолкнётся и впишет настоящие воспоминания.

Правила:
- Пиши по-русски, тёпло и уютно, как тихая заметка в журнале — не как реклама.
- КОРОТКО: 2–3 предложения, лучше меньше. Это заготовка, а не эссе.
- НЕ ВЫДУМЫВАЙ воспоминаний и сцен. Запрещены обороты «я помню», «когда я впервые»,
  «однажды вечером», выдуманные поездки, места, даты, люди — ты НЕ знаешь реальной истории Дарьи.
- Пиши в настоящем времени про характер блюда: настроение, сезон, аромат, повод, ощущение за столом.
  Можно мягко оставить «зацепку» (дом, неспешное утро, гости, время года), но без ложных фактов.
- Не пересказывай рецепт, не перечисляй ингредиенты списком, не пиши цифры и КБЖУ.
- Без штампов вроде «пальчики оближешь», без заголовков, кавычек, эмодзи и хэштегов.
Верни только текст истории, без пояснений.`;

function buildUserPrompt(recipe) {
  const lines = [`Название блюда: ${recipe.title}`];
  if (recipe.recipe_type === "drink") lines.push("Это напиток.");
  if (recipe.description?.trim()) lines.push(`Старое короткое описание: ${recipe.description.trim()}`);
  if (recipe.ingredients?.trim()) {
    const items = recipe.ingredients
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 14)
      .join(", ");
    if (items) lines.push(`Основные ингредиенты: ${items}`);
  }
  lines.push("Напиши тёплый черновик истории этого блюда по правилам выше.");
  return lines.join("\n");
}

async function draftStory(recipe) {
  const r = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(recipe) },
    ],
    temperature: 0.85,
    max_tokens: 320,
  });
  return (r.choices[0]?.message?.content ?? "").trim();
}

async function main() {
  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("id, slug, title, description, ingredients, note, recipe_type, published")
    .is("owner_id", null) // только каталог автора, не личные рецепты пользователей
    .order("created_at", { ascending: true });

  if (error) { console.error("✗ Не удалось загрузить рецепты:", error.message); process.exit(1); }

  // Кого обрабатываем: по умолчанию только те, где истории ещё нет.
  const candidates = (recipes ?? []).filter((r) =>
    includeExisting ? true : !(r.note && r.note.trim()),
  );
  const batch = candidates.slice(offset, offset === 0 && limit === Infinity ? undefined : offset + limit);

  console.log(
    `\nРецептов всего: ${recipes?.length ?? 0} · без истории: ${
      (recipes ?? []).filter((r) => !(r.note && r.note.trim())).length
    } · в этом запуске: ${batch.length}`,
  );
  console.log(apply ? "Режим: ЗАПИСЬ в БД (--write)\n" : "Режим: dry-run (черновики не записываются)\n");

  const preview = [];
  let written = 0;

  for (const recipe of batch) {
    process.stdout.write(`• ${recipe.title} … `);
    let story = "";
    try {
      story = await draftStory(recipe);
    } catch (e) {
      console.log(`ошибка AI: ${e.message}`);
      continue;
    }
    if (!story) { console.log("пусто, пропуск"); continue; }

    preview.push({ slug: recipe.slug, title: recipe.title, draft: story });
    console.log("готово");
    console.log(`    ${story}\n`);

    if (apply) {
      const { error: upErr } = await supabase
        .from("recipes")
        .update({ note: story })
        .eq("id", recipe.id);
      if (upErr) console.log(`    ✗ не записалось: ${upErr.message}`);
      else written++;
    }
  }

  // Всегда сохраняем предпросмотр — удобно вычитать все черновики в одном месте.
  const outPath = resolve("story-drafts.json");
  writeFileSync(outPath, JSON.stringify(preview, null, 2) + "\n", "utf8");
  console.log(`\nЧерновики (${preview.length}) сохранены для вычитки: ${outPath}`);

  if (apply) {
    console.log(`Записано в note: ${written} рецепт(ов).`);
    console.log("Дальше: открой рецепты в админке, доведи истории до своих и при желании нажми «Перевести» для EN.");
  } else {
    console.log("Это был dry-run. Чтобы записать черновики в базу: node scripts/draft-stories.mjs --write");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
