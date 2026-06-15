/**
 * patch-duck-link-sauce.mjs — связывает рецепт утки с клюквенным соусом.
 *
 * Решение Дарьи: утку можно подавать с ЛЮБЫМ ягодным соусом, но в тексте утки
 * даём кликабельную ссылку именно на мамин клюквенный соус. Меняем «у нас был
 * брусничный» → «подойдёт любой, например [клюквенный](/recipes/klyukvennyy-sous)»
 * (и EN-аналог «ours was lingonberry» → «any will do, for example [cranberry]»).
 * Правим и note/note_en рецепта, и финальный шаг (order=6) description/description_en.
 *
 * Запуск:
 *   node scripts/patch-duck-link-sauce.mjs           # dry-run (показать diff)
 *   node scripts/patch-duck-link-sauce.mjs --write   # записать
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(".env.local") });

const apply = process.argv.includes("--write");
let URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (URL && !URL.startsWith("http")) URL = `https://${URL}.supabase.co`;
const supabase = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DUCK_SLUG = "utka-s-yablokami-i-chernoslivom";
const SAUCE_SLUG = "klyukvennyy-sous";

const REPLACEMENTS = [
  {
    from: "у нас был брусничный",
    to: `подойдёт любой, например [клюквенный](/recipes/${SAUCE_SLUG})`,
  },
  {
    from: "ours was lingonberry",
    to: `any will do, for example [cranberry](/recipes/${SAUCE_SLUG})`,
  },
];

function patch(text) {
  if (!text) return { text, changed: false };
  let out = text;
  let changed = false;
  for (const r of REPLACEMENTS) {
    if (out.includes(r.from)) {
      out = out.split(r.from).join(r.to);
      changed = true;
    }
  }
  return { text: out, changed };
}

async function main() {
  const { data: recipe, error } = await supabase
    .from("recipes")
    .select("id, slug, note, note_en")
    .eq("slug", DUCK_SLUG)
    .maybeSingle();
  if (error || !recipe) {
    console.error("✗ утка не найдена:", error?.message);
    process.exit(1);
  }

  const note = patch(recipe.note);
  const noteEn = patch(recipe.note_en);

  const { data: steps, error: stErr } = await supabase
    .from("steps")
    .select("id, order, description, description_en")
    .eq("recipe_id", recipe.id)
    .order("order");
  if (stErr) {
    console.error("✗ шаги:", stErr.message);
    process.exit(1);
  }

  const stepPatches = [];
  for (const st of steps) {
    const d = patch(st.description);
    const de = patch(st.description_en);
    if (d.changed || de.changed) {
      stepPatches.push({ id: st.id, order: st.order, description: d.text, description_en: de.text });
    }
  }

  console.log(apply ? "── WRITE ──" : "── DRY-RUN ──");
  console.log(`note changed:    ${note.changed}`);
  console.log(`note_en changed: ${noteEn.changed}`);
  console.log(`steps changed:   ${stepPatches.map((s) => "#" + s.order).join(", ") || "—"}`);

  if (!apply) {
    if (note.changed) console.log("\nNOTE →\n" + note.text);
    return;
  }

  if (note.changed || noteEn.changed) {
    const { error: uErr } = await supabase
      .from("recipes")
      .update({ note: note.text, note_en: noteEn.text })
      .eq("id", recipe.id);
    if (uErr) {
      console.error("✗ update recipe:", uErr.message);
      process.exit(1);
    }
    console.log("✓ note/note_en обновлены");
  }

  for (const sp of stepPatches) {
    const { error: sErr } = await supabase
      .from("steps")
      .update({ description: sp.description, description_en: sp.description_en })
      .eq("id", sp.id);
    if (sErr) {
      console.error(`✗ шаг #${sp.order}:`, sErr.message);
      process.exit(1);
    }
    console.log(`✓ шаг #${sp.order} обновлён`);
  }
  console.log("DONE");
}

main().catch((e) => {
  console.error("✗ unexpected:", e.message);
  process.exit(1);
});
