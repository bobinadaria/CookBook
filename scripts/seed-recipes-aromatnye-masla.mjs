/**
 * seed-recipes-aromatnye-masla.mjs — три «ароматных масла» одним батчем.
 *
 *   1) Масло с оливками, лимоном и цедрой   (к рыбе и морепродуктам)
 *   2) Масло с пармезаном, чесноком и укропом (универсальное)
 *   3) Масло со смородиной и тимьяном        (к мясу) — «мягкий» КБЖУ-кейс
 *
 * Все три — в категорию «Заготовки» (slug=zagotovki). Сёстры по идее, поэтому
 * собраны в один скрипт (как seed-recipe-*, но списком).
 *
 * ⚠ КБЖУ. Масло-основа доминирует (180 г сливочного масла), поэтому цифры
 *   осмысленные. Масла №1 и №2 — обычный расчёт. Масло №3: смородину протирают
 *   через сито (часть кожуры/семян остаётся в сите), поэтому это ОРИЕНТИР, а не
 *   обещание ±5% — как у клюквенного соуса.
 *
 * Предпосылки: node scripts/seed-masla-prereqs.mjs --write   (ингредиент смородина)
 *
 * Запуск:
 *   node scripts/seed-recipes-aromatnye-masla.mjs           # dry-run
 *   node scripts/seed-recipes-aromatnye-masla.mjs --write   # реальная вставка
 *
 * После вставки (скрипт печатает RECIPE_ID=<slug>:<id> для каждого):
 *   - КБЖУ:    node scripts/calc-nutrition-one.mjs --slug <slug> --write
 *   - Обложка: node scripts/gen-cover.mjs --title "<title>" --recipe-id <id>
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(".env.local") });

const apply = process.argv.includes("--write");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("✗ Supabase env missing");
  process.exit(1);
}
let URL = SUPABASE_URL;
if (URL && !URL.startsWith("http")) URL = `https://${URL}.supabase.co`;
const supabase = createClient(URL, SERVICE_KEY);

// ── Рецепты ───────────────────────────────────────────────────────────────────

const RECIPES = [
  // 1 ─────────────────────────────────────────────────────────────────────────
  {
    slug: "maslo-s-olivkami-i-limonom",
    data: {
      title: "Масло с оливками, лимоном и цедрой",
      title_en: "Butter with Olives, Lemon and Zest",
      description:
        "Мягкое сливочное масло с мелко рубленными оливками, лимонной цедрой и соком: свежее, солоноватое, с лёгкой цитрусовой горчинкой. Идеально к рыбе и морепродуктам — кладётся прямо на горячее блюдо или используется в готовке.",
      description_en:
        "Soft butter with finely chopped olives, lemon zest and juice: fresh, lightly salty, with a touch of citrus bitterness. Perfect with fish and seafood — placed straight onto a hot dish or used while cooking.",
      note:
        "Ароматное масло — мой любимый способ из самой обычной еды сделать ресторанное " +
        "блюдо: кусочек тает на горячей рыбе, и вся тарелка вдруг пахнет морем и лимоном. " +
        "Для этого масла бери хорошее сливочное, не меньше 82,5% жирности, и обязательно дай " +
        "ему согреться до комнатной температуры — так оно легко вберёт в себя оливки, цедру и " +
        "сок. Кладу его и в процессе готовки, и сверху на горячее — к рыбе и морепродуктам " +
        "лучше пары не придумать.",
      note_en:
        "Aromatic butter is my favourite way to turn the plainest food into a restaurant dish: " +
        "a slice melts over hot fish and suddenly the whole plate smells of the sea and lemon. " +
        "For this one, use good butter — at least 82.5% fat — and be sure to let it come to room " +
        "temperature, so it folds in the olives, zest and juice easily. I add it both while " +
        "cooking and on top of a hot dish — with fish and seafood there's no better match.",
      ingredients: [
        "Масло сливочное (от 82,5%) — 180 г, комнатной температуры",
        "Оливки зелёные — 100 г, мелко порубить",
        "Цедра 1 лимона — ~6 г",
        "Сок половины лимона — ~20 г",
        "Соль — по вкусу, примерно 1/2 ч. л. (~3 г)",
      ].join("\n"),
      ingredients_en: [
        "Butter (82.5%+) — 180 g, room temperature",
        "Green olives — 100 g, finely chopped",
        "Zest of 1 lemon — ~6 g",
        "Juice of half a lemon — ~20 g",
        "Salt — to taste, about 1/2 tsp (~3 g)",
      ].join("\n"),
      cook_time: 15,
      servings: 12,
    },
    categorySlugs: ["zagotovki", "italyanskaya", "frukty", "leto"],
    steps: [
      {
        order: 1, title: "Подготовить масло", title_en: "Soften the butter",
        description: "Достань 180 г хорошего сливочного масла (от 82,5%) заранее и дай ему стать мягким при комнатной температуре. Мягкое масло легко вберёт в себя все добавки.",
        description_en: "Take out 180 g of good butter (82.5%+) ahead of time and let it soften at room temperature. Soft butter folds in all the add-ins easily.",
      },
      {
        order: 2, title: "Порубить оливки и снять цедру", title_en: "Chop the olives and zest the lemon",
        description: "Мелко поруби 100 г зелёных оливок. С лимона сними цедру тонкой тёркой (только жёлтый слой, без белого — он горчит) и выжми сок из половины.",
        description_en: "Finely chop 100 g of green olives. Zest the lemon with a fine grater (just the yellow layer — the white part is bitter) and squeeze the juice from one half.",
      },
      {
        order: 3, title: "Соединить", title_en: "Mix everything in",
        description: "Вмешай оливки, цедру и лимонный сок в мягкое масло. Посоли по вкусу — примерно половина чайной ложки. Размешай до однородности.",
        description_en: "Fold the olives, zest and lemon juice into the soft butter. Season to taste — about half a teaspoon of salt. Mix until smooth.",
      },
      {
        order: 4, title: "Свернуть и охладить", title_en: "Roll and chill",
        description: "Выложи масло на пергамент, сверни плотным рулетом (или переложи в форму) и убери в холодильник до плотности. Отрезай кружочками и клади на горячую рыбу или морепродукты.",
        description_en: "Spoon the butter onto parchment, roll it into a tight log (or press into a mould) and chill until firm. Slice into rounds and place on hot fish or seafood.",
      },
    ],
  },

  // 2 ─────────────────────────────────────────────────────────────────────────
  {
    slug: "maslo-s-parmezanom-i-chesnokom",
    data: {
      title: "Масло с пармезаном, чесноком и укропом",
      title_en: "Butter with Parmesan, Garlic and Dill",
      description:
        "Сливочное масло с тёртым пармезаном, чесноком и свежим укропом — самое универсальное из ароматных масел. Подходит к курице, картошке, гречке и рису: тает сверху и превращает гарнир в полноценное блюдо.",
      description_en:
        "Butter with grated Parmesan, garlic and fresh dill — the most versatile of the aromatic butters. Great with chicken, potatoes, buckwheat and rice: it melts on top and turns a simple side into a proper dish.",
      note:
        "Если завести дома только одно ароматное масло — пусть будет это. Пармезан, чеснок и " +
        "укроп — сочетание, которое идёт почти ко всему: я кладу его и на курицу, и на " +
        "картошку, и в гречку, и в рис. Бери мягкое сливочное масло комнатной температуры (от " +
        "82,5%), вотри в него тёртый сыр и чеснок — и дальше экспериментируй, оно прощает " +
        "вольности. Кусочек, растаявший на горячем гарнире, мгновенно делает ужин уютнее.",
      note_en:
        "If you keep just one aromatic butter at home, make it this one. Parmesan, garlic and " +
        "dill go with almost everything: I put it on chicken, on potatoes, into buckwheat and " +
        "rice. Use soft, room-temperature butter (82.5%+), work in the grated cheese and garlic — " +
        "and then experiment, it forgives a lot. A slice melting over a hot side dish instantly " +
        "makes dinner cosier.",
      ingredients: [
        "Масло сливочное (от 82,5%) — 180 г, комнатной температуры",
        "Пармезан — 80 г, тёртый",
        "Чеснок — 2–3 зубчика (~9 г)",
        "Укроп — 15 г, мелко нарезать",
        "Соль — по вкусу, примерно 1/2 ч. л. (~3 г)",
      ].join("\n"),
      ingredients_en: [
        "Butter (82.5%+) — 180 g, room temperature",
        "Parmesan — 80 g, grated",
        "Garlic — 2–3 cloves (~9 g)",
        "Dill — 15 g, finely chopped",
        "Salt — to taste, about 1/2 tsp (~3 g)",
      ].join("\n"),
      cook_time: 15,
      servings: 12,
    },
    categorySlugs: ["zagotovki", "italyanskaya", "syr", "osen"],
    steps: [
      {
        order: 1, title: "Подготовить масло", title_en: "Soften the butter",
        description: "Дай 180 г сливочного масла (от 82,5%) согреться до комнатной температуры, чтобы оно стало мягким и податливым.",
        description_en: "Let 180 g of butter (82.5%+) come to room temperature so it turns soft and pliable.",
      },
      {
        order: 2, title: "Натереть сыр и чеснок", title_en: "Grate the cheese and garlic",
        description: "Натри 80 г пармезана, пропусти через пресс или мелко поруби 2–3 зубчика чеснока и мелко наруби 15 г укропа.",
        description_en: "Grate 80 g of Parmesan, press or finely chop 2–3 garlic cloves and finely chop 15 g of dill.",
      },
      {
        order: 3, title: "Соединить", title_en: "Mix everything in",
        description: "Вмешай пармезан, чеснок и укроп в мягкое масло. Посоли по вкусу — около половины чайной ложки. Разотри до однородной массы.",
        description_en: "Fold the Parmesan, garlic and dill into the soft butter. Season to taste — about half a teaspoon of salt. Work it into a smooth mass.",
      },
      {
        order: 4, title: "Свернуть и охладить", title_en: "Roll and chill",
        description: "Сверни масло в рулет на пергаменте (или переложи в форму) и убери в холодильник. Подавай к курице, картошке, гречке или рису — экспериментируй!",
        description_en: "Roll the butter into a log on parchment (or press into a mould) and chill. Serve with chicken, potatoes, buckwheat or rice — experiment!",
      },
    ],
  },

  // 3 ─────────────────────────────────────────────────────────────────────────
  {
    slug: "maslo-so-smorodinoy-i-timyanom",
    data: {
      title: "Масло со смородиной и тимьяном",
      title_en: "Butter with Currant and Thyme",
      description:
        "Сливочное масло с протёртой смородиной и тимьяном: лёгкая ягодная кислинка, тонкий травяной аромат и красивый рубиновый цвет. Идеально к мясу — выглядит очень эффектно и оттеняет жирное жаркое.",
      description_en:
        "Butter with sieved currant and thyme: a light berry tartness, a delicate herbal aroma and a beautiful ruby colour. Perfect with meat — it looks striking and balances a rich roast.",
      note:
        "Это масло я делаю, когда хочу, чтобы простой кусок мяса смотрелся празднично: смородина " +
        "красит его в рубиновый цвет, а тимьян добавляет тонкий травяной аромат. Лёгкая ягодная " +
        "кислинка оттеняет жирное мясо так же, как это делает ягодный соус, только проще. " +
        "Смородину — чёрную или красную — обязательно протри через сито, чтобы ушли кожура и " +
        "семечки, а масло осталось гладким. Бери мягкое сливочное от 82,5% и не спеши: дай ему " +
        "согреться, чтобы оно ровно вобрало ягодное пюре.",
      note_en:
        "I make this butter when I want a plain piece of meat to look festive: the currant tints " +
        "it ruby, and the thyme adds a delicate herbal aroma. A light berry tartness balances " +
        "rich meat the way a berry sauce does, only simpler. Push the currant — black or red — " +
        "through a sieve so the skins and seeds are left behind and the butter stays smooth. Use " +
        "soft butter (82.5%+) and don't rush: let it warm up so it takes in the berry purée evenly.",
      ingredients: [
        "Масло сливочное (от 82,5%) — 180 г, комнатной температуры",
        "Смородина чёрная или красная — 100 г, протереть через сито",
        "Тимьян — 10 г",
        "Соль — по вкусу, примерно 1/2 ч. л. (~3 г)",
      ].join("\n"),
      ingredients_en: [
        "Butter (82.5%+) — 180 g, room temperature",
        "Black or red currant — 100 g, pushed through a sieve",
        "Thyme — 10 g",
        "Salt — to taste, about 1/2 tsp (~3 g)",
      ].join("\n"),
      cook_time: 15,
      servings: 12,
    },
    categorySlugs: ["zagotovki", "frantsuzskaya", "frukty", "leto"],
    steps: [
      {
        order: 1, title: "Подготовить масло", title_en: "Soften the butter",
        description: "Заранее достань 180 г сливочного масла (от 82,5%) и дай ему стать мягким при комнатной температуре.",
        description_en: "Take out 180 g of butter (82.5%+) ahead of time and let it soften at room temperature.",
      },
      {
        order: 2, title: "Протереть смородину", title_en: "Sieve the currant",
        description: "Протри 100 г смородины (чёрной или красной) через сито, чтобы в пюре не осталось кожуры и семечек. Сними листики тимьяна со стебельков — нужно около 10 г.",
        description_en: "Push 100 g of currant (black or red) through a sieve so no skins or seeds remain in the purée. Strip the thyme leaves from the stems — you'll need about 10 g.",
      },
      {
        order: 3, title: "Соединить", title_en: "Mix everything in",
        description: "Вмешай ягодное пюре и тимьян в мягкое масло, посоли по вкусу — примерно половина чайной ложки. Размешай до однородного рубинового цвета.",
        description_en: "Fold the berry purée and thyme into the soft butter, season to taste — about half a teaspoon of salt. Mix until an even ruby colour.",
      },
      {
        order: 4, title: "Свернуть и охладить", title_en: "Roll and chill",
        description: "Сверни масло в рулет на пергаменте (или переложи в форму) и убери в холодильник до плотности. Подавай к мясу — кусочек, тающий сверху, придаёт лёгкую кислинку и выглядит очень эффектно.",
        description_en: "Roll the butter into a log on parchment (or press into a mould) and chill until firm. Serve with meat — a slice melting on top adds a light tartness and looks very striking.",
      },
    ],
  },
];

const COMMON = {
  cover_image: null, // обложку ставим отдельно через gen-cover.mjs
  published: true,
  featured: false,
  recipe_type: "food",
  owner_id: null, // авторский каталожный рецепт
  visibility: "public",
};

// ── Категории (по slug — id резолвим из БД) ───────────────────────────────────

async function resolveCategoryIds(slugs) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, type")
    .in("slug", slugs);
  if (error) throw new Error(`categories lookup: ${error.message}`);
  const found = new Map((data ?? []).map((c) => [c.slug, c]));
  const missing = slugs.filter((sl) => !found.has(sl));
  if (missing.length) {
    console.error(`✗ не найдены категории по slug: ${missing.join(", ")}`);
    process.exit(1);
  }
  return slugs.map((sl) => found.get(sl));
}

// ── Run ──────────────────────────────────────────────────────────────────────

async function seedOne(rec) {
  const { slug } = rec;
  const { data: existing } = await supabase
    .from("recipes")
    .select("id, title")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    console.log(`EXISTS ${slug} id=${existing.id}`);
    return;
  }

  const cats = await resolveCategoryIds(rec.categorySlugs);
  console.log(`CATS_OK ${slug} ` + cats.map((c) => `${c.type}:${c.slug}`).join(","));

  if (!apply) {
    console.log(`DRY_RUN_OK ${slug}`);
    return;
  }

  const recipeData = { ...rec.data, slug, ...COMMON };
  const { data: inserted, error: recipeErr } = await supabase
    .from("recipes")
    .insert(recipeData)
    .select("id, slug, title")
    .single();
  if (recipeErr || !inserted) {
    console.error(`✗ insert recipe ${slug}:`, recipeErr?.message);
    process.exit(1);
  }
  console.log(`RECIPE_ID=${slug}:${inserted.id}`);

  const stepsPayload = rec.steps.map((st) => ({ ...st, recipe_id: inserted.id, photo_url: null }));
  const { error: stepsErr } = await supabase.from("steps").insert(stepsPayload);
  if (stepsErr) {
    console.error(`✗ insert steps ${slug}:`, stepsErr.message);
    process.exit(1);
  }
  console.log(`STEPS_OK ${slug}=${stepsPayload.length}`);

  const rcPayload = cats.map((c) => ({ recipe_id: inserted.id, category_id: c.id }));
  const { error: rcErr } = await supabase.from("recipe_categories").insert(rcPayload);
  if (rcErr) {
    console.error(`✗ link categories ${slug}:`, rcErr.message);
    process.exit(1);
  }
  console.log(`CATS_LINKED ${slug}=${rcPayload.length}`);
}

async function main() {
  console.log(apply ? "── WRITE ──" : "── DRY-RUN ──");
  for (const rec of RECIPES) await seedOne(rec);
  console.log("DONE");
}

main().catch((e) => {
  console.error("✗ unexpected:", e.message);
  process.exit(1);
});
