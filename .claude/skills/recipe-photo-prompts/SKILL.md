---
name: recipe-photo-prompts
description: Build an AI image-generation prompt for a CookBook recipe photo in the project's canonical top-down, warm-light, editorial food-magazine style. Use whenever the user wants a cover/illustration prompt for a dish (for DALL·E / gpt-image / any image model). Output is an English prompt ready to paste.
---

# Recipe photo prompts — CookBook style

Генерирует **английский промпт** для AI-генератора изображений (DALL·E, gpt-image, и т.п.)
под единый визуальный стиль проекта. Промпт копируется в нужный инструмент.

> **Связь с продом.** Обложки рецептов генерируются автоматически скриптом
> `scripts/gen-cover.mjs` (`dall-e-3`, 1792×1024) в этом же стиле. Этот скилл — для
> ручного крафта промптов (другие слоты, ретейк обложки, эксперименты). Держи стиль
> согласованным с `gen-cover.mjs`.

---

## Канонический стиль (top-down, warm, editorial)

- **Ракурс:** top-down / flat lay (вид строго сверху). Не 3/4, не профиль.
- **Свет:** тёплый естественный свет сверху, мягкие рассеянные тени. Светло и аппетитно
  (не тёмно-драматично).
- **Поверхность:** рустикальная деревянная (тёплое/среднее дерево). Без белого фона, без пластика.
- **Пропсы:** немного и естественно — свежие травы, мятая льняная салфетка, рассыпанные
  ингредиенты (орехи, специи, соль). Керамика/дерево, ничего яркого современного.
- **Палитра:** приглушённые тёплые тона — янтарь, мёд, кремовый, тёплый коричневый.
- **Настроение:** уютная домашняя кухня, high-end editorial food magazine, ощущение плёночного фото.
- **Формат:** обложки прода — 1792×1024; для карточек/прочего — `4:3`. Photorealistic, без текста и водяных знаков.

---

## Базовый шаблон

```
A high-end editorial food-magazine photograph of [DISH — descriptive, what it is],
served in/on [DISH-WARE], on a rustic warm wooden surface.
Top-down flat-lay view. Warm natural light from above with soft diffused shadows.
Small natural props: [PROPS — fresh herbs, a crumpled linen napkin, scattered INGREDIENTS].
Muted warm palette — amber, honey, cream and warm brown tones; appetizing texture and gloss.
Cozy home-kitchen mood, film-photography feel. 4:3 aspect ratio. Photorealistic, no text, no watermarks.
```

Замени `[...]`: опиши блюдо описательно (не просто название), подбери посуду, пропсы и
ингредиенты под конкретный рецепт.

---

## Подсказки по типам блюд (что менять в шаблоне)

- **Мясо/птица (горячее):** чугунная сковорода или керамика; долька лимона, мисочка соуса,
  свежая зелень; «glossy glaze glistening on the surface».
- **Выпечка/сэндвичи:** светлая/средняя деревянная доска; тимьян/розмарин, орехи, мисочка мёда
  с ложкой-дриблером.
- **Торты/десерты:** круглая деревянная доска или керамика; шоколадная стружка/орехи, мисочка
  крема с ложкой, полосатая льняная салфетка.
- **Салаты/лёгкое:** широкая керамическая/терракотовая миска; ломтики лимона, капли оливкового
  масла, свежие травы.
- **Супы/рагу:** керамический горшочек/глубокая миска, лёгкий пар сверху; ломоть деревенского
  хлеба, зелень, специи рядом.
- **Паста/ризотто:** широкая неглубокая кремовая миска; базилик/петрушка, стружка пармезана,
  вилка на краю.

---

## Примеры (реальные блюда)

**Круассан с бри и сливой**
```
A high-end editorial food-magazine photograph of a golden flaky croissant filled with melted brie
and fresh plum slices, topped with crushed pistachios, on a warm medium-wood cutting board.
Top-down flat-lay view. Warm natural light from above, soft diffused shadows.
Small natural props: fresh thyme sprigs, a crumpled linen napkin, scattered pistachios,
a tiny ceramic bowl of honey with a wooden dipper.
Muted warm palette — honey, amber and cream tones; appetizing flaky texture.
Cozy home-kitchen mood, film-photography feel. 4:3 aspect ratio. Photorealistic, no text, no watermarks.
```

**Торт «Муравейник»**
```
A high-end editorial food-magazine photograph of a Russian Muraveynik cake — a dome of
caramel-coated crushed shortbread, drizzled with dark chocolate, on a round warm wooden board.
Top-down flat-lay view. Warm natural light from above, soft diffused shadows.
Small natural props: whole walnuts and chocolate shavings scattered around, a small ceramic bowl
of condensed-milk cream with a spoon, a striped linen cloth in one corner.
Muted warm palette — amber, caramel and warm brown tones; rich appetizing texture.
Cozy home-kitchen mood, film-photography feel. 4:3 aspect ratio. Photorealistic, no text, no watermarks.
```

---

## Использование

1. Выбери тип блюда → возьми базовый шаблон + подсказки.
2. Опиши блюдо на английском описательно; подставь посуду, пропсы, ингредиенты.
3. Скопируй промпт в генератор.
4. Тонкая настройка: светлое блюдо → «medium warm wooden» вместо тёмного; в соусе/глазури →
   «with glossy sauce glistening on top»; нужно ярче/аппетитнее → «brighter, fresh and appetizing».
5. Для **обложки рецепта** стиль должен совпадать с `scripts/gen-cover.mjs` — там тот же
   top-down warm editorial, формат 1792×1024.
