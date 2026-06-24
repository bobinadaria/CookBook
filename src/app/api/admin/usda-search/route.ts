/**
 * GET /api/admin/usda-search?query=lemongrass
 *
 * Прокси к настоящему USDA FoodData Central API (foods/search) — для формы
 * /admin/ingredients/new: «сначала ищем в USDA, не нашли — вручную». Ключ
 * держим на сервере (USDA_FDC_API_KEY), никогда не отдаём клиенту.
 *
 * Ограничено dataType Foundation/SR Legacy/Survey (FNDDS) — это generic-
 * продукты с честными значениями «на 100 г», без брендовой шелухи
 * («Kraft Cheddar Singles 12oz» и т.п.), которая нам тут не нужна.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthSuccess } from "@/lib/api-auth";

// Та же таблица id, что в scripts/seed-ingredients.mjs (searchUsda/extractNutrients) —
// держим в одном месте логику, а не повторно угадываем. Energy: 1008 = kcal
// (label nutrient), но у Foundation foods его часто нет — есть только Atwater
// general/specific (2047/2048), поэтому пробуем все три по очереди.
const NUTRIENT_IDS: Record<"kcal" | "protein" | "fat" | "carbs", number[]> = {
  kcal: [1008, 2047, 2048],
  protein: [1003],
  fat: [1004],
  carbs: [1005],
};

interface FdcNutrient {
  nutrientId: number;
  value: number;
}

interface FdcFood {
  fdcId: number;
  description: string;
  dataType: string;
  foodNutrients: FdcNutrient[];
}

function pickNutrient(nutrients: FdcNutrient[], ids: number[]): number {
  for (const id of ids) {
    const match = nutrients.find((n) => n.nutrientId === id);
    if (match) return match.value;
  }
  return 0;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!isAuthSuccess(auth)) return auth;

  const query = req.nextUrl.searchParams.get("query")?.trim();
  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Слишком короткий запрос" }, { status: 400 });
  }

  // Тот же ключ/переменная, что уже используется в scripts/seed-ingredients.mjs —
  // если он у вас уже настроен локально для сидинга, он сразу работает и тут.
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "USDA_API_KEY не задан на сервере — добавьте ключ в .env.local (см. .env.example)" },
      { status: 500 },
    );
  }

  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", "10");
  url.searchParams.set("dataType", "Foundation,SR Legacy,Survey (FNDDS)");

  let data: { foods?: FdcFood[] };
  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      return NextResponse.json(
        { error: res.status === 429 ? "USDA: лимит запросов, попробуйте через минуту" : "USDA API не ответил" },
        { status: 502 },
      );
    }
    data = await res.json();
  } catch {
    return NextResponse.json({ error: "Не удалось связаться с USDA API" }, { status: 502 });
  }

  const results = (data.foods ?? []).map((f) => ({
    fdcId: f.fdcId,
    description: f.description,
    dataType: f.dataType,
    kcal_100g: Math.round(pickNutrient(f.foodNutrients, NUTRIENT_IDS.kcal) * 100) / 100,
    protein_100g: Math.round(pickNutrient(f.foodNutrients, NUTRIENT_IDS.protein) * 100) / 100,
    fat_100g: Math.round(pickNutrient(f.foodNutrients, NUTRIENT_IDS.fat) * 100) / 100,
    carbs_100g: Math.round(pickNutrient(f.foodNutrients, NUTRIENT_IDS.carbs) * 100) / 100,
  }));

  return NextResponse.json({ results });
}
