/**
 * Расширение ingredients_base: ~205 новых позиций по профилю Дарьи.
 *
 * Принципы (см. CLAUDE.md и memory:feedback-kbju-accuracy-promise):
 *   - Все позиции force-override, USDA НЕ дёргаем. Значения вручную проверены
 *     по USDA Foundation/SR Legacy, ГОСТ/Скурихин для русских реалий, или
 *     стандартным справочникам для региональных продуктов (Италия, Грузия).
 *   - Мясо — трёхуровневая структура: общая категория (lean composite) /
 *     отрубы / фарш. См. memory:project-kbju-meat-structure.
 *   - "говядина" и "свинина" перепрошиваются в lean composite — их предыдущие
 *     значения (ground beef/pork) переехали в "говяжий фарш" / "свиной фарш".
 *     Это поменяет КБЖУ у существующих рецептов с ними — recalc после.
 *
 * Предварительно прогнать: scripts/migrate-rename-cherry.mjs
 * Запуск: node scripts/seed-ingredients-expansion.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

let URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (URL && !URL.startsWith("http")) URL = `https://${URL}.supabase.co`;

const s = createClient(URL, KEY);

const NEW_ENTRIES = [
  // ── Хлеб ──────────────────────────────────────────────────────────────────
  { name_ru: "хлеб ржаной",           category: "grain", kcal: 259, P: 8.5,  F: 3.3,  C: 48.3,  name_en: "Bread, rye, dark (Russian Borodinsky)" },
  { name_ru: "хлеб цельнозерновой",   category: "grain", kcal: 252, P: 12.0, F: 4.0,  C: 43.9,  name_en: "Bread, whole-wheat, commercially prepared" },
  { name_ru: "багет",                 category: "grain", kcal: 272, P: 8.7,  F: 2.6,  C: 52.0,  name_en: "Bread, French/Vienna baguette" },

  // ── Говядина: общая (lean composite) + отрубы + фарш ──────────────────────
  // ⚠ "говядина" перепрошивается с ground beef → lean composite.
  { name_ru: "говядина",              category: "meat",  kcal: 135, P: 21.8, F: 4.6,  C: 0, name_en: "Beef, composite of trimmed retail cuts, separable lean only, raw" },
  { name_ru: "говяжья вырезка",       category: "meat",  kcal: 127, P: 23.0, F: 3.2,  C: 0, name_en: "Beef, tenderloin, separable lean only, raw" },
  { name_ru: "говяжий рибай",         category: "meat",  kcal: 291, P: 17.3, F: 24.1, C: 0, name_en: "Beef, rib eye steak, separable lean and fat, raw" },
  { name_ru: "говядина для рагу",     category: "meat",  kcal: 137, P: 22.0, F: 4.7,  C: 0, name_en: "Beef, chuck, top blade, separable lean only, raw" },
  { name_ru: "говяжья грудинка",      category: "meat",  kcal: 155, P: 21.9, F: 6.7,  C: 0, name_en: "Beef, brisket, flat half, separable lean only, raw" },
  { name_ru: "говяжий фарш",          category: "meat",  kcal: 215, P: 18.6, F: 15.1, C: 0, name_en: "Beef, ground, 15% fat, raw" },

  // ── Свинина: общая (lean composite) + отрубы + фарш ───────────────────────
  // ⚠ "свинина" перепрошивается с ground pork → lean composite.
  { name_ru: "свинина",               category: "meat",  kcal: 143, P: 21.0, F: 5.9,  C: 0, name_en: "Pork, fresh, composite of trimmed retail cuts, separable lean only, raw" },
  { name_ru: "свиная вырезка",        category: "meat",  kcal: 120, P: 20.9, F: 3.4,  C: 0, name_en: "Pork, tenderloin, separable lean only, raw" },
  { name_ru: "свиная шея",            category: "meat",  kcal: 152, P: 19.6, F: 7.6,  C: 0, name_en: "Pork, shoulder (Boston blade / krkovica), lean only, raw" },
  { name_ru: "свиные рёбра",          category: "meat",  kcal: 277, P: 17.7, F: 22.5, C: 0, name_en: "Pork, spareribs, raw" },
  { name_ru: "свиная грудинка",       category: "meat",  kcal: 518, P: 9.3,  F: 53.0, C: 0, name_en: "Pork, belly, raw" },
  { name_ru: "свиной окорок",         category: "meat",  kcal: 122, P: 22.0, F: 3.5,  C: 0, name_en: "Pork, ham (kyta), separable lean only, raw" },
  { name_ru: "свиной фарш",           category: "meat",  kcal: 263, P: 16.9, F: 21.8, C: 0, name_en: "Pork, ground, raw (~16% fat)" },

  // ── Курица: бёдра / голень / фарш (грудка, ножка=leg, крылышки, печень — уже в БД)
  { name_ru: "куриные бёдра",         category: "meat",  kcal: 221, P: 16.7, F: 16.3, C: 0, name_en: "Chicken, thigh, meat and skin, raw" },
  { name_ru: "куриные бёдра без кожи", category: "meat", kcal: 119, P: 19.7, F: 4.0,  C: 0, name_en: "Chicken, thigh, meat only, raw" },
  { name_ru: "куриная голень",        category: "meat",  kcal: 172, P: 18.3, F: 10.4, C: 0, name_en: "Chicken, drumstick, meat and skin, raw" },
  { name_ru: "куриный фарш",          category: "meat",  kcal: 143, P: 17.4, F: 8.1,  C: 0, name_en: "Chicken, ground, raw" },

  // ── Индейка: грудка / бедро / голень / фарш ───────────────────────────────
  { name_ru: "индейка грудка",        category: "meat",  kcal: 111, P: 23.7, F: 1.5,  C: 0, name_en: "Turkey, breast, meat only, raw" },
  { name_ru: "индейка бедро",         category: "meat",  kcal: 130, P: 19.5, F: 5.4,  C: 0, name_en: "Turkey, thigh, meat only, raw" },
  { name_ru: "индейка голень",        category: "meat",  kcal: 119, P: 20.2, F: 3.6,  C: 0, name_en: "Turkey, drumstick, meat only, raw" },
  { name_ru: "фарш индейки",          category: "meat",  kcal: 148, P: 19.7, F: 7.0,  C: 0, name_en: "Turkey, ground, raw" },

  // ── Рыба и морепродукты ───────────────────────────────────────────────────
  { name_ru: "треска",                category: "fish",  kcal: 82,  P: 17.8, F: 0.7,  C: 0,  name_en: "Cod, Atlantic, raw" },
  { name_ru: "дорада",                category: "fish",  kcal: 135, P: 19.7, F: 6.5,  C: 0,  name_en: "Sea bream (Sparus aurata / orata), raw" },
  { name_ru: "сибас",                 category: "fish",  kcal: 97,  P: 18.4, F: 2.0,  C: 0,  name_en: "European sea bass (Dicentrarchus labrax), raw" },
  { name_ru: "форель",                category: "fish",  kcal: 141, P: 20.5, F: 6.2,  C: 0,  name_en: "Trout, rainbow, farmed, raw" },
  { name_ru: "тунец свежий",          category: "fish",  kcal: 109, P: 24.4, F: 0.5,  C: 0,  name_en: "Tuna, fresh, yellowfin, raw" },
  { name_ru: "тунец консервированный", category: "fish", kcal: 86,  P: 19.4, F: 0.8,  C: 0,  name_en: "Tuna, light, canned in water, drained" },
  { name_ru: "скумбрия",              category: "fish",  kcal: 205, P: 18.6, F: 13.9, C: 0,  name_en: "Mackerel, Atlantic, raw" },
  { name_ru: "сельдь",                category: "fish",  kcal: 158, P: 18.0, F: 9.0,  C: 0,  name_en: "Herring, Atlantic, raw" },
  { name_ru: "сардины",               category: "fish",  kcal: 208, P: 25.0, F: 11.5, C: 0,  name_en: "Sardine, Atlantic, canned in oil, drained" },
  { name_ru: "минтай",                category: "fish",  kcal: 92,  P: 19.4, F: 1.0,  C: 0,  name_en: "Pollock, Alaska, raw" },
  { name_ru: "судак",                 category: "fish",  kcal: 92,  P: 19.3, F: 1.2,  C: 0,  name_en: "Zander/walleye, raw" },
  { name_ru: "окунь",                 category: "fish",  kcal: 91,  P: 19.4, F: 0.9,  C: 0,  name_en: "Perch, mixed species, raw" },
  { name_ru: "палтус",                category: "fish",  kcal: 91,  P: 18.6, F: 1.3,  C: 0,  name_en: "Halibut, Atlantic, raw" },
  { name_ru: "лосось копчёный",       category: "fish",  kcal: 117, P: 18.3, F: 4.3,  C: 0,  name_en: "Salmon, Atlantic, smoked" },
  { name_ru: "лосось слабосолёный",   category: "fish",  kcal: 145, P: 21.6, F: 6.5,  C: 0,  name_en: "Salmon, lightly salted (gravlax / nova-style)" },
  { name_ru: "кальмар",               category: "fish",  kcal: 92,  P: 15.6, F: 1.4,  C: 3.1, name_en: "Squid, mixed species, raw" },
  { name_ru: "осьминог",              category: "fish",  kcal: 82,  P: 14.9, F: 1.0,  C: 2.2, name_en: "Octopus, common, raw" },
  { name_ru: "икра красная",          category: "fish",  kcal: 252, P: 32.0, F: 13.2, C: 4.0, name_en: "Salmon caviar (red), raw" },
  { name_ru: "икра чёрная",           category: "fish",  kcal: 252, P: 24.6, F: 17.9, C: 4.0, name_en: "Sturgeon caviar (black), raw" },

  // ── Фрукты и ягоды ────────────────────────────────────────────────────────
  // ⚠ "вишня" добавляется как sour cherry; sweet cherry уже переименован в "черешня" миграцией.
  { name_ru: "вишня",                 category: "fruit", kcal: 50,  P: 1.0,  F: 0.3,  C: 12.2,  name_en: "Cherries, sour, red, raw" },
  { name_ru: "груша",                 category: "fruit", kcal: 57,  P: 0.36, F: 0.14, C: 15.2,  name_en: "Pears, raw" },
  { name_ru: "манго",                 category: "fruit", kcal: 60,  P: 0.82, F: 0.38, C: 15.0,  name_en: "Mango, raw" },
  { name_ru: "нектарин",              category: "fruit", kcal: 44,  P: 1.06, F: 0.32, C: 10.6,  name_en: "Nectarines, raw" },
  { name_ru: "абрикос",               category: "fruit", kcal: 48,  P: 1.4,  F: 0.39, C: 11.1,  name_en: "Apricots, raw" },
  { name_ru: "клубника",              category: "fruit", kcal: 32,  P: 0.67, F: 0.3,  C: 7.68,  name_en: "Strawberries, raw" },
  { name_ru: "земляника",             category: "fruit", kcal: 32,  P: 0.67, F: 0.3,  C: 7.68,  name_en: "Wild strawberries (same macros as strawberries)" },
  { name_ru: "арбуз",                 category: "fruit", kcal: 30,  P: 0.61, F: 0.15, C: 7.55,  name_en: "Watermelon, raw" },
  { name_ru: "дыня",                  category: "fruit", kcal: 36,  P: 0.54, F: 0.14, C: 9.09,  name_en: "Melons, honeydew, raw" },
  { name_ru: "мандарин",              category: "fruit", kcal: 53,  P: 0.81, F: 0.31, C: 13.34, name_en: "Tangerines (mandarin oranges), raw" },
  { name_ru: "грейпфрут",             category: "fruit", kcal: 42,  P: 0.77, F: 0.14, C: 10.66, name_en: "Grapefruit, raw, pink and red" },
  { name_ru: "лайм",                  category: "fruit", kcal: 30,  P: 0.7,  F: 0.2,  C: 10.5,  name_en: "Lime, raw" },
  { name_ru: "киви",                  category: "fruit", kcal: 61,  P: 1.14, F: 0.52, C: 14.66, name_en: "Kiwifruit, green, raw" },
  { name_ru: "ананас",                category: "fruit", kcal: 50,  P: 0.54, F: 0.12, C: 13.12, name_en: "Pineapple, raw, all varieties" },
  { name_ru: "виноград",              category: "fruit", kcal: 69,  P: 0.72, F: 0.16, C: 18.1,  name_en: "Grapes, red or green, raw" },
  { name_ru: "малина",                category: "fruit", kcal: 52,  P: 1.2,  F: 0.65, C: 11.94, name_en: "Raspberries, raw" },
  { name_ru: "черника",               category: "fruit", kcal: 57,  P: 0.74, F: 0.33, C: 14.49, name_en: "Blueberries, raw" },
  { name_ru: "голубика",              category: "fruit", kcal: 57,  P: 0.74, F: 0.33, C: 14.49, name_en: "Blueberries (same as черника)" },
  { name_ru: "ежевика",               category: "fruit", kcal: 43,  P: 1.39, F: 0.49, C: 9.61,  name_en: "Blackberries, raw" },
  { name_ru: "хурма",                 category: "fruit", kcal: 70,  P: 0.58, F: 0.19, C: 18.59, name_en: "Persimmons, Japanese, raw" },
  { name_ru: "курага",                category: "fruit", kcal: 241, P: 3.39, F: 0.51, C: 62.64, name_en: "Apricots, dried, uncooked" },
  { name_ru: "чернослив",             category: "fruit", kcal: 240, P: 2.18, F: 0.38, C: 63.88, name_en: "Plums, dried (prunes), uncooked" },
  { name_ru: "финики",                category: "fruit", kcal: 282, P: 2.45, F: 0.39, C: 75.03, name_en: "Dates, deglet noor" },

  // ── Овощи и грибы ─────────────────────────────────────────────────────────
  { name_ru: "руккола",               category: "vegetable", kcal: 25,  P: 2.58, F: 0.66, C: 3.65, name_en: "Arugula, raw" },
  { name_ru: "баклажан",              category: "vegetable", kcal: 25,  P: 0.98, F: 0.18, C: 5.88, name_en: "Eggplant, raw" },
  { name_ru: "помидоры черри",        category: "vegetable", kcal: 27,  P: 1.07, F: 0.51, C: 5.51, name_en: "Tomatoes, grape (cherry-type), raw" },
  { name_ru: "брокколи",              category: "vegetable", kcal: 34,  P: 2.82, F: 0.37, C: 6.64, name_en: "Broccoli, raw" },
  { name_ru: "цветная капуста",       category: "vegetable", kcal: 25,  P: 1.92, F: 0.28, C: 4.97, name_en: "Cauliflower, raw" },
  { name_ru: "капуста белокочанная",  category: "vegetable", kcal: 25,  P: 1.28, F: 0.1,  C: 5.8,  name_en: "Cabbage, raw" },
  { name_ru: "капуста краснокочанная", category: "vegetable", kcal: 31, P: 1.43, F: 0.16, C: 7.37, name_en: "Cabbage, red, raw" },
  { name_ru: "капуста пекинская",     category: "vegetable", kcal: 13,  P: 1.5,  F: 0.2,  C: 2.18, name_en: "Cabbage, chinese (pak-choi), raw" },
  { name_ru: "свёкла",                category: "vegetable", kcal: 43,  P: 1.61, F: 0.17, C: 9.56, name_en: "Beets, raw" },
  { name_ru: "редис",                 category: "vegetable", kcal: 16,  P: 0.68, F: 0.1,  C: 3.4,  name_en: "Radishes, raw" },
  { name_ru: "спаржа",                category: "vegetable", kcal: 20,  P: 2.2,  F: 0.12, C: 3.88, name_en: "Asparagus, raw" },
  { name_ru: "кукуруза",              category: "vegetable", kcal: 86,  P: 3.27, F: 1.35, C: 18.7, name_en: "Corn, sweet, yellow, raw" },
  { name_ru: "горошек зелёный",       category: "vegetable", kcal: 81,  P: 5.42, F: 0.4,  C: 14.45, name_en: "Peas, green, raw" },
  { name_ru: "фасоль стручковая",     category: "vegetable", kcal: 31,  P: 1.83, F: 0.22, C: 6.97, name_en: "Beans, snap, green, raw" },
  { name_ru: "лук-порей",             category: "vegetable", kcal: 61,  P: 1.5,  F: 0.3,  C: 14.15, name_en: "Leeks, raw" },
  { name_ru: "лук красный",           category: "vegetable", kcal: 40,  P: 1.1,  F: 0.1,  C: 9.34, name_en: "Onion, red, raw" },
  { name_ru: "шампиньоны",            category: "vegetable", kcal: 22,  P: 3.09, F: 0.34, C: 3.26, name_en: "Mushrooms, white, raw" },
  { name_ru: "лисички",               category: "vegetable", kcal: 38,  P: 1.49, F: 0.53, C: 6.86, name_en: "Mushrooms, chanterelle, raw" },
  { name_ru: "белые грибы",           category: "vegetable", kcal: 34,  P: 3.7,  F: 1.7,  C: 6.5,  name_en: "Porcini (Boletus edulis), raw" },
  { name_ru: "вёшенки",               category: "vegetable", kcal: 33,  P: 3.31, F: 0.41, C: 6.09, name_en: "Mushrooms, oyster, raw" },
  { name_ru: "оливки зелёные",        category: "vegetable", kcal: 145, P: 1.03, F: 15.32, C: 3.84, name_en: "Olives, ripe, green, canned" },
  { name_ru: "оливки чёрные",         category: "vegetable", kcal: 116, P: 0.84, F: 10.9, C: 6.04, name_en: "Olives, ripe, black, canned" },
  { name_ru: "каперсы",               category: "vegetable", kcal: 23,  P: 2.36, F: 0.86, C: 4.89, name_en: "Capers, canned" },
  { name_ru: "помидоры вяленые",      category: "vegetable", kcal: 213, P: 5.06, F: 14.08, C: 23.33, name_en: "Tomatoes, sun-dried, packed in oil, drained" },
  { name_ru: "помидоры консервированные", category: "vegetable", kcal: 17, P: 0.9, F: 0.13, C: 4.04, name_en: "Tomatoes, red, ripe, canned" },
  { name_ru: "томатный соус",         category: "vegetable", kcal: 24,  P: 1.2,  F: 0.27, C: 5.31, name_en: "Tomato sauce (passata), canned, no salt added" },

  // ── Молочка и сыры ────────────────────────────────────────────────────────
  { name_ru: "козий сыр",             category: "dairy", kcal: 364, P: 21.6, F: 30.5, C: 0.0,  name_en: "Cheese, goat, soft type" },
  { name_ru: "моцарелла",             category: "dairy", kcal: 280, P: 18.5, F: 22.4, C: 2.2,  name_en: "Cheese, mozzarella, whole milk" },
  { name_ru: "буррата",               category: "dairy", kcal: 330, P: 14.0, F: 30.0, C: 3.0,  name_en: "Cheese, burrata" },
  { name_ru: "страччателла",          category: "dairy", kcal: 310, P: 12.0, F: 28.0, C: 2.0,  name_en: "Cheese, stracciatella (Italian)" },
  { name_ru: "бри",                   category: "dairy", kcal: 334, P: 20.8, F: 27.7, C: 0.5,  name_en: "Cheese, brie" },
  { name_ru: "голубой сыр",           category: "dairy", kcal: 353, P: 21.4, F: 28.7, C: 2.3,  name_en: "Cheese, blue (gorgonzola/roquefort)" },
  { name_ru: "грюйер",                category: "dairy", kcal: 413, P: 29.8, F: 32.3, C: 0.4,  name_en: "Cheese, gruyere" },
  { name_ru: "сулугуни",              category: "dairy", kcal: 290, P: 19.5, F: 22.0, C: 2.5,  name_en: "Cheese, suluguni (Georgian)" },
  { name_ru: "брынза",                category: "dairy", kcal: 260, P: 17.9, F: 20.1, C: 0.4,  name_en: "Cheese, brynza (Slavic brined)" },
  { name_ru: "адыгейский сыр",        category: "dairy", kcal: 240, P: 19.8, F: 19.8, C: 1.5,  name_en: "Cheese, Adyghe (Russian fresh)" },
  { name_ru: "ряженка",               category: "dairy", kcal: 54,  P: 2.9,  F: 4.0,  C: 4.1,  name_en: "Ryazhenka (Russian fermented baked milk)" },
  { name_ru: "простокваша",           category: "dairy", kcal: 59,  P: 2.8,  F: 3.2,  C: 4.1,  name_en: "Prostokvasha (Russian soured milk)" },
  { name_ru: "миндальное молоко",     category: "dairy", kcal: 15,  P: 0.59, F: 1.24, C: 0.34, name_en: "Beverages, almond milk, unsweetened" },
  { name_ru: "овсяное молоко",        category: "dairy", kcal: 47,  P: 0.83, F: 1.69, C: 6.69, name_en: "Beverages, oat milk" },
  { name_ru: "гхи",                   category: "fat",   kcal: 876, P: 0.28, F: 99.48, C: 0,   name_en: "Butter oil, anhydrous (ghee)" },

  // ── Орехи и семена ────────────────────────────────────────────────────────
  { name_ru: "кешью",                 category: "nut",  kcal: 553, P: 18.2,  F: 43.85, C: 30.19, name_en: "Nuts, cashew nuts, raw" },
  { name_ru: "фундук",                category: "nut",  kcal: 628, P: 14.95, F: 60.75, C: 16.7,  name_en: "Nuts, hazelnuts, raw" },
  { name_ru: "кедровые орехи",        category: "nut",  kcal: 673, P: 13.69, F: 68.37, C: 13.08, name_en: "Nuts, pine nuts, dried" },
  { name_ru: "макадамия",             category: "nut",  kcal: 718, P: 7.91,  F: 75.77, C: 13.82, name_en: "Nuts, macadamia nuts, raw" },
  { name_ru: "арахис",                category: "nut",  kcal: 567, P: 25.8,  F: 49.24, C: 16.13, name_en: "Peanuts, all types, raw" },
  { name_ru: "семечки подсолнечника", category: "seed", kcal: 584, P: 20.78, F: 51.46, C: 20,    name_en: "Seeds, sunflower seed kernels, dried" },
  { name_ru: "льняные семена",        category: "seed", kcal: 534, P: 18.29, F: 42.16, C: 28.88, name_en: "Seeds, flaxseeds" },
  { name_ru: "семена чиа",            category: "seed", kcal: 486, P: 16.54, F: 30.74, C: 42.12, name_en: "Seeds, chia seeds, dried" },
  { name_ru: "арахисовая паста",      category: "nut",  kcal: 588, P: 25.09, F: 50.39, C: 19.56, name_en: "Peanut butter, smooth" },
  { name_ru: "тахини",                category: "nut",  kcal: 595, P: 17.0,  F: 53.8,  C: 21.2,  name_en: "Sesame butter, tahini" },

  // ── Крупы / бобовые / паста ───────────────────────────────────────────────
  { name_ru: "булгур",                category: "grain", kcal: 342, P: 12.29, F: 1.33, C: 75.87, name_en: "Bulgur, dry" },
  { name_ru: "кускус",                category: "grain", kcal: 376, P: 12.76, F: 0.64, C: 77.43, name_en: "Couscous, dry" },
  { name_ru: "киноа",                 category: "grain", kcal: 368, P: 14.12, F: 6.07, C: 64.16, name_en: "Quinoa, uncooked" },
  { name_ru: "перловка",              category: "grain", kcal: 354, P: 12.48, F: 2.30, C: 73.48, name_en: "Barley, hulled" },
  { name_ru: "манная крупа",          category: "grain", kcal: 360, P: 12.68, F: 1.05, C: 72.83, name_en: "Semolina, unenriched" },
  { name_ru: "пшено",                 category: "grain", kcal: 378, P: 11.02, F: 4.22, C: 72.85, name_en: "Millet, raw" },
  { name_ru: "спагетти",              category: "grain", kcal: 371, P: 13.04, F: 1.51, C: 74.67, name_en: "Pasta/spaghetti, dry" },
  { name_ru: "лапша рисовая",         category: "grain", kcal: 364, P: 5.95,  F: 0.56, C: 80.18, name_en: "Rice noodles, dry" },
  { name_ru: "лапша яичная",          category: "grain", kcal: 384, P: 14.16, F: 4.44, C: 71.27, name_en: "Noodles, egg, dry" },
  { name_ru: "лаваш",                 category: "grain", kcal: 277, P: 9.1,   F: 1.2,  C: 56.5,  name_en: "Lavash, Armenian thin flatbread" },
  { name_ru: "тортилья пшеничная",    category: "grain", kcal: 304, P: 8.17,  F: 7.61, C: 51.42, name_en: "Tortillas, flour, ready-to-bake" },
  { name_ru: "нут",                   category: "other", kcal: 378, P: 20.47, F: 6.04, C: 62.95, name_en: "Chickpeas, mature seeds, raw" },
  { name_ru: "чечевица красная",      category: "other", kcal: 352, P: 24.63, F: 1.06, C: 63.35, name_en: "Lentils, red, raw" },
  { name_ru: "чечевица зелёная",      category: "other", kcal: 352, P: 24.63, F: 1.06, C: 63.35, name_en: "Lentils, green, raw" },
  { name_ru: "фасоль белая",          category: "other", kcal: 333, P: 23.36, F: 0.85, C: 60.27, name_en: "Beans, white, mature seeds, raw" },
  { name_ru: "фасоль красная",        category: "other", kcal: 337, P: 22.53, F: 1.06, C: 61.29, name_en: "Beans, kidney, red, mature seeds, raw" },
  { name_ru: "мука миндальная",       category: "grain", kcal: 600, P: 21.9,  F: 51.0, C: 21.7,  name_en: "Almond flour" },
  { name_ru: "мука цельнозерновая",   category: "grain", kcal: 340, P: 13.21, F: 2.5,  C: 71.97, name_en: "Wheat flour, whole-grain" },
  { name_ru: "крахмал кукурузный",    category: "grain", kcal: 381, P: 0.26,  F: 0.05, C: 91.27, name_en: "Cornstarch" },
  { name_ru: "сода пищевая",          category: "spice", kcal: 0,   P: 0,     F: 0,    C: 0,     name_en: "Sodium bicarbonate (baking soda)" },

  // ── Специи и сухие травы ──────────────────────────────────────────────────
  { name_ru: "соль",                  category: "spice", kcal: 0,   P: 0,     F: 0,     C: 0,     name_en: "Salt, table" },
  { name_ru: "перец чёрный молотый",  category: "spice", kcal: 251, P: 10.39, F: 3.26,  C: 63.95, name_en: "Spices, pepper, black" },
  { name_ru: "перец белый молотый",   category: "spice", kcal: 296, P: 10.4,  F: 2.1,   C: 68.6,  name_en: "Spices, pepper, white" },
  { name_ru: "паприка сладкая",       category: "spice", kcal: 282, P: 14.14, F: 12.89, C: 53.99, name_en: "Spices, paprika" },
  { name_ru: "паприка копчёная",      category: "spice", kcal: 282, P: 14.14, F: 12.89, C: 53.99, name_en: "Spices, paprika, smoked" },
  { name_ru: "чили молотый",          category: "spice", kcal: 282, P: 13.46, F: 14.28, C: 49.7,  name_en: "Spices, chili powder" },
  { name_ru: "кайенский перец",       category: "spice", kcal: 318, P: 12.01, F: 17.27, C: 56.63, name_en: "Spices, pepper, red or cayenne" },
  { name_ru: "куркума",               category: "spice", kcal: 312, P: 9.68,  F: 3.25,  C: 67.14, name_en: "Spices, turmeric, ground" },
  { name_ru: "кориандр молотый",      category: "spice", kcal: 298, P: 12.37, F: 17.77, C: 54.99, name_en: "Spices, coriander seed, ground" },
  { name_ru: "тмин",                  category: "spice", kcal: 333, P: 19.77, F: 14.59, C: 49.9,  name_en: "Spices, caraway seed" },
  { name_ru: "зира",                  category: "spice", kcal: 375, P: 17.81, F: 22.27, C: 44.24, name_en: "Spices, cumin seed" },
  { name_ru: "кардамон",              category: "spice", kcal: 311, P: 10.76, F: 6.7,   C: 68.47, name_en: "Spices, cardamom, ground" },
  { name_ru: "гвоздика",              category: "spice", kcal: 274, P: 5.97,  F: 13.0,  C: 65.53, name_en: "Spices, cloves, ground" },
  { name_ru: "мускатный орех",        category: "spice", kcal: 525, P: 5.84,  F: 36.31, C: 49.29, name_en: "Spices, nutmeg, ground" },
  { name_ru: "корица",                category: "spice", kcal: 247, P: 3.99,  F: 1.24,  C: 80.59, name_en: "Spices, cinnamon, ground" },
  { name_ru: "ванильный экстракт",    category: "spice", kcal: 288, P: 0.06,  F: 0.06,  C: 12.65, name_en: "Vanilla extract" },
  { name_ru: "ванилин",               category: "spice", kcal: 288, P: 0,     F: 0,     C: 12.65, name_en: "Vanillin (synthetic vanilla)" },
  { name_ru: "лавровый лист",         category: "spice", kcal: 313, P: 7.61,  F: 8.36,  C: 74.97, name_en: "Spices, bay leaf" },
  { name_ru: "орегано",               category: "spice", kcal: 265, P: 9.0,   F: 4.28,  C: 68.92, name_en: "Spices, oregano, dried" },
  { name_ru: "тимьян",                category: "spice", kcal: 276, P: 9.11,  F: 7.43,  C: 63.94, name_en: "Spices, thyme, dried" },
  { name_ru: "розмарин",              category: "spice", kcal: 331, P: 4.88,  F: 15.22, C: 64.06, name_en: "Spices, rosemary, dried" },
  { name_ru: "базилик сушёный",       category: "spice", kcal: 233, P: 22.98, F: 4.07,  C: 47.75, name_en: "Spices, basil, dried" },
  { name_ru: "шалфей",                category: "spice", kcal: 315, P: 10.63, F: 12.75, C: 60.73, name_en: "Spices, sage, ground" },
  { name_ru: "прованские травы",      category: "spice", kcal: 270, P: 11.0,  F: 7.0,   C: 60.0,  name_en: "Herbes de Provence (dried mix average)" },
  { name_ru: "итальянские травы",     category: "spice", kcal: 270, P: 11.0,  F: 7.0,   C: 60.0,  name_en: "Italian herbs mix (dried average)" },
  { name_ru: "хмели-сунели",          category: "spice", kcal: 270, P: 11.0,  F: 7.0,   C: 60.0,  name_en: "Khmeli-suneli (Georgian dried spice mix)" },
  { name_ru: "карри порошок",         category: "spice", kcal: 325, P: 12.66, F: 13.81, C: 55.83, name_en: "Spices, curry powder" },
  { name_ru: "гарам масала",          category: "spice", kcal: 310, P: 12.0,  F: 12.0,  C: 55.0,  name_en: "Garam masala (Indian spice mix)" },
  { name_ru: "семена фенхеля",        category: "spice", kcal: 345, P: 15.8,  F: 14.87, C: 52.29, name_en: "Spices, fennel seed" },
  { name_ru: "семена горчицы",        category: "spice", kcal: 508, P: 26.08, F: 36.24, C: 28.09, name_en: "Spices, mustard seed, yellow" },
  { name_ru: "бадьян",                category: "spice", kcal: 337, P: 17.6,  F: 15.9,  C: 50.02, name_en: "Star anise / badian" },
  { name_ru: "сумах",                 category: "spice", kcal: 290, P: 5.2,   F: 9.0,   C: 60.0,  name_en: "Sumac (dried)" },

  // ── Масла ─────────────────────────────────────────────────────────────────
  { name_ru: "масло авокадо",         category: "fat",   kcal: 884, P: 0, F: 100, C: 0, name_en: "Oil, avocado" },
  { name_ru: "кокосовое масло",       category: "fat",   kcal: 892, P: 0, F: 100, C: 0, name_en: "Oil, coconut" },
  { name_ru: "льняное масло",         category: "fat",   kcal: 884, P: 0, F: 100, C: 0, name_en: "Oil, flaxseed" },
  { name_ru: "тыквенное масло",       category: "fat",   kcal: 884, P: 0, F: 100, C: 0, name_en: "Oil, pumpkin seed" },
  { name_ru: "горчичное масло",       category: "fat",   kcal: 884, P: 0, F: 100, C: 0, name_en: "Oil, mustard" },

  // ── Сладкое ───────────────────────────────────────────────────────────────
  { name_ru: "кленовый сироп",        category: "sweet", kcal: 260, P: 0.04, F: 0.06,  C: 67.04, name_en: "Syrups, maple" },
  { name_ru: "сироп агавы",           category: "sweet", kcal: 310, P: 0.09, F: 0.45,  C: 76.37, name_en: "Syrups, agave" },
  { name_ru: "коричневый сахар",      category: "sweet", kcal: 380, P: 0.12, F: 0,     C: 98.09, name_en: "Sugars, brown" },
  { name_ru: "мусковадо",             category: "sweet", kcal: 373, P: 0.0,  F: 0,     C: 96.0,  name_en: "Sugar, muscovado (unrefined brown)" },
  { name_ru: "белый шоколад",         category: "sweet", kcal: 539, P: 5.87, F: 32.09, C: 59.24, name_en: "Candies, white chocolate" },
  { name_ru: "молочный шоколад",      category: "sweet", kcal: 535, P: 7.65, F: 29.66, C: 59.4,  name_en: "Candies, milk chocolate" },
  { name_ru: "варенье",               category: "sweet", kcal: 277, P: 0.4,  F: 0.07,  C: 68.86, name_en: "Jams and preserves (average)" },
  { name_ru: "желатин",               category: "other", kcal: 335, P: 85.6, F: 0.1,   C: 0,     name_en: "Gelatin, dry powder, unsweetened" },
  { name_ru: "агар-агар",             category: "other", kcal: 26,  P: 0.5,  F: 0,     C: 6.7,   name_en: "Agar-agar, dry" },
  { name_ru: "дрожжи сухие",          category: "other", kcal: 295, P: 38.33, F: 4.6,  C: 38.18, name_en: "Yeast, baker's, dry, active" },

  // ── Соусы / прочее ────────────────────────────────────────────────────────
  { name_ru: "уксус яблочный",        category: "other", kcal: 21,  P: 0,     F: 0,    C: 0.93,  name_en: "Vinegar, cider" },
  { name_ru: "уксус винный",          category: "other", kcal: 19,  P: 0.04,  F: 0,    C: 0.27,  name_en: "Vinegar, red wine" },
  { name_ru: "уксус бальзамический",  category: "other", kcal: 88,  P: 0.49,  F: 0,    C: 17.03, name_en: "Vinegar, balsamic" },
  { name_ru: "уксус рисовый",         category: "other", kcal: 20,  P: 0.1,   F: 0,    C: 0.5,   name_en: "Vinegar, rice" },
  { name_ru: "уксус столовый",        category: "other", kcal: 18,  P: 0.04,  F: 0,    C: 0.04,  name_en: "Vinegar, distilled (white)" },
  { name_ru: "вустерский соус",       category: "other", kcal: 78,  P: 0,     F: 0,    C: 19.46, name_en: "Sauce, worcestershire" },
  { name_ru: "рыбный соус",           category: "other", kcal: 35,  P: 5.06,  F: 0.01, C: 3.64,  name_en: "Fish sauce, ready-to-serve" },
  { name_ru: "устричный соус",        category: "other", kcal: 51,  P: 1.35,  F: 0.25, C: 10.92, name_en: "Sauce, oyster, ready-to-serve" },
  { name_ru: "соус терияки",          category: "other", kcal: 89,  P: 5.93,  F: 0,    C: 15.58, name_en: "Sauce, teriyaki, ready-to-serve" },
  { name_ru: "соус песто",            category: "other", kcal: 370, P: 4.5,   F: 35.0, C: 8.0,   name_en: "Sauce, pesto (with basil), prepared" },
  { name_ru: "куриный бульон",        category: "other", kcal: 7,   P: 0.96,  F: 0.21, C: 0.1,   name_en: "Soup, chicken broth, ready-to-serve" },
  { name_ru: "овощной бульон",        category: "other", kcal: 12,  P: 0.5,   F: 0.3,  C: 1.5,   name_en: "Vegetable broth, ready-to-serve" },
  { name_ru: "кокосовое молоко",      category: "other", kcal: 230, P: 2.29,  F: 23.84, C: 5.54, name_en: "Coconut milk, raw" },
  { name_ru: "кокосовая стружка",     category: "other", kcal: 660, P: 6.88,  F: 64.53, C: 23.65, name_en: "Coconut meat, dried, unsweetened" },
  { name_ru: "мисо паста",            category: "other", kcal: 199, P: 11.69, F: 6.01, C: 26.47, name_en: "Miso paste" },
  { name_ru: "нори",                  category: "other", kcal: 35,  P: 5.81,  F: 0.28, C: 5.11,  name_en: "Seaweed, laver (nori), raw" },
  { name_ru: "васаби",                category: "other", kcal: 109, P: 4.8,   F: 0.6,  C: 23.5,  name_en: "Wasabi paste (prepared)" },
  { name_ru: "маринованный имбирь",   category: "other", kcal: 51,  P: 0.7,   F: 0.4,  C: 12.5,  name_en: "Ginger, pickled (gari)" },
  { name_ru: "корнишоны",             category: "other", kcal: 91,  P: 0.36,  F: 0.18, C: 24.93, name_en: "Pickles, cucumber, sweet" },
  { name_ru: "квашеная капуста",      category: "other", kcal: 19,  P: 0.91,  F: 0.14, C: 4.28,  name_en: "Sauerkraut, canned" },
  { name_ru: "горчица зернистая",     category: "other", kcal: 150, P: 6.0,   F: 12.0, C: 5.0,   name_en: "Mustard, whole grain" },
  { name_ru: "красное вино",          category: "other", kcal: 85,  P: 0.07,  F: 0,    C: 2.61,  name_en: "Wine, table, red, dry" },
];

async function upsertEntry(e) {
  const row = {
    name_ru: e.name_ru,
    name_en: e.name_en,
    kcal_100g: Number(e.kcal.toFixed(2)),
    protein_100g: Number(e.P.toFixed(2)),
    fat_100g: Number(e.F.toFixed(2)),
    carbs_100g: Number(e.C.toFixed(2)),
    usda_fdc_id: null,
    category: e.category,
  };
  const { error } = await s
    .from("ingredients_base")
    .upsert(row, { onConflict: "name_ru" });
  if (error) return { ok: false, msg: error.message };
  return { ok: true };
}

async function main() {
  console.log(`Обрабатываю ${NEW_ENTRIES.length} позиций (force-override, USDA не вызываем).\n`);
  let ok = 0;
  let fail = 0;
  const failed = [];
  for (const e of NEW_ENTRIES) {
    const res = await upsertEntry(e);
    if (res.ok) {
      ok++;
      console.log(
        `  ✓ ${e.name_ru.padEnd(28)} ${String(e.kcal).padStart(4)} ккал | ` +
          `P${String(e.P).padStart(6)} F${String(e.F).padStart(6)} C${String(e.C).padStart(6)}  « ${e.name_en}`,
      );
    } else {
      fail++;
      failed.push(e.name_ru);
      console.error(`  ✗ ${e.name_ru}: ${res.msg}`);
    }
  }
  console.log(`\nГотово: ${ok} ok, ${fail} ошибок.`);
  if (fail > 0) console.log("Не получилось: " + failed.join(", "));
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
