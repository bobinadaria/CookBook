import { Recipe, Category, Step } from "@/types";

// ─── COUNTRIES ────────────────────────────────────────────────────────────────
const cItaly:      Category = { id: "c1", name: "Италия",         slug: "italy",       type: "country" };
const cJapan:      Category = { id: "c2", name: "Япония",         slug: "japan",       type: "country" };
const cFrance:     Category = { id: "c3", name: "Франция",        slug: "france",      type: "country" };
const cMiddleEast: Category = { id: "c4", name: "Ближний Восток", slug: "middle-east", type: "country" };
const cGreece:     Category = { id: "c5", name: "Греция",         slug: "greece",      type: "country" };
const cMexico:     Category = { id: "c6", name: "Мексика",        slug: "mexico",      type: "country" };
const cIndia:      Category = { id: "c7", name: "Индия",          slug: "india",       type: "country" };
const cGeorgia:    Category = { id: "c8", name: "Грузия",         slug: "georgia",     type: "country" };

// ─── MEAL TYPES ───────────────────────────────────────────────────────────────
const mtSoup:    Category = { id: "mt1", name: "Суп",      slug: "soup",    type: "meal_type" };
const mtSalad:   Category = { id: "mt2", name: "Салат",    slug: "salad",   type: "meal_type" };
const mtStarter: Category = { id: "mt3", name: "Закуска",  slug: "starter", type: "meal_type" };
const mtMain:    Category = { id: "mt4", name: "Основное", slug: "main",    type: "meal_type" };
const mtPasta:   Category = { id: "mt5", name: "Паста",    slug: "pasta",   type: "meal_type" };
const mtDessert: Category = { id: "mt6", name: "Десерт",   slug: "dessert", type: "meal_type" };
const mtBaking:  Category = { id: "mt7", name: "Выпечка",  slug: "baking",  type: "meal_type" };
const mtDrink:   Category = { id: "mt8", name: "Напиток",  slug: "drink",   type: "meal_type" };

// ─── MEAL TIMES ───────────────────────────────────────────────────────────────
const mmBreakfast: Category = { id: "mm1", name: "Завтрак", slug: "breakfast", type: "meal_time" };
const mmBrunch:    Category = { id: "mm2", name: "Бранч",   slug: "brunch",    type: "meal_time" };
const mmLunch:     Category = { id: "mm3", name: "Обед",    slug: "lunch",     type: "meal_time" };
const mmDinner:    Category = { id: "mm4", name: "Ужин",    slug: "dinner",    type: "meal_time" };
const mmSnack:     Category = { id: "mm5", name: "Перекус", slug: "snack",     type: "meal_time" };

// ─── INGREDIENTS ──────────────────────────────────────────────────────────────
const iChicken:   Category = { id: "i1", name: "Курица",       slug: "chicken",    type: "ingredient" };
const iBeef:      Category = { id: "i2", name: "Говядина",     slug: "beef",       type: "ingredient" };
const iFish:      Category = { id: "i3", name: "Рыба",         slug: "fish",       type: "ingredient" };
const iSeafood:   Category = { id: "i4", name: "Морепродукты", slug: "seafood",    type: "ingredient" };
const iVeggies:   Category = { id: "i5", name: "Овощи",        slug: "vegetables", type: "ingredient" };
const iEggs:      Category = { id: "i6", name: "Яйца",         slug: "eggs",       type: "ingredient" };
const iMushrooms: Category = { id: "i7", name: "Грибы",        slug: "mushrooms",  type: "ingredient" };
const iLegumes:   Category = { id: "i8", name: "Бобовые",      slug: "legumes",    type: "ingredient" };
const iCheese:    Category = { id: "i9", name: "Сыр",          slug: "cheese",     type: "ingredient" };

// ─── SEASONS / OCCASIONS ──────────────────────────────────────────────────────
const sSpring:    Category = { id: "s1", name: "Весна",     slug: "spring",    type: "season" };
const sSummer:    Category = { id: "s2", name: "Лето",      slug: "summer",    type: "season" };
const sAutumn:    Category = { id: "s3", name: "Осень",     slug: "autumn",    type: "season" };
const sWinter:    Category = { id: "s4", name: "Зима",      slug: "winter",    type: "season" };
const sBBQ:       Category = { id: "s5", name: "Барбекю",   slug: "bbq",       type: "season" };
const sChristmas: Category = { id: "s6", name: "Рождество", slug: "christmas", type: "season" };
const sEaster:    Category = { id: "s7", name: "Пасха",     slug: "easter",    type: "season" };

// ─── ALL CATEGORIES ───────────────────────────────────────────────────────────
export const mockCategories: Category[] = [
  cItaly, cJapan, cFrance, cMiddleEast, cGreece, cMexico, cIndia, cGeorgia,
  mtSoup, mtSalad, mtStarter, mtMain, mtPasta, mtDessert, mtBaking, mtDrink,
  mmBreakfast, mmBrunch, mmLunch, mmDinner, mmSnack,
  iChicken, iBeef, iFish, iSeafood, iVeggies, iEggs, iMushrooms, iLegumes, iCheese,
  sSpring, sSummer, sAutumn, sWinter, sBBQ, sChristmas, sEaster,
];

// ─── FILTER GROUPS ────────────────────────────────────────────────────────────
export const filterGroups = [
  { type: "meal_type",  label: "Тип блюда",     items: [mtSoup, mtSalad, mtStarter, mtMain, mtPasta, mtDessert, mtBaking, mtDrink] },
  { type: "meal_time",  label: "Приём пищи",    items: [mmBreakfast, mmBrunch, mmLunch, mmDinner, mmSnack] },
  { type: "ingredient", label: "Ингредиент",    items: [iChicken, iBeef, iFish, iSeafood, iVeggies, iEggs, iMushrooms, iLegumes, iCheese] },
  { type: "season",     label: "Сезон / Повод", items: [sSpring, sSummer, sAutumn, sWinter, sBBQ, sChristmas, sEaster] },
  { type: "country",    label: "Кухня",         items: [cItaly, cJapan, cFrance, cMiddleEast, cGreece, cMexico, cIndia, cGeorgia] },
] as const;

// ─── STEPS ────────────────────────────────────────────────────────────────────
export const mockSteps: Record<string, Step[]> = {
  "ricotta-toast-peach-honey": [
    { id: "s1", recipe_id: "1", order: 1, title: "Поджарить хлеб", description: "Возьмите толстый ломоть деревенского хлеба. Поджарьте в тостере или на сухой сковороде до золотистой корочки с обеих сторон.", photo_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80" },
    { id: "s2", recipe_id: "1", order: 2, title: "Намазать рикотту", description: "Щедро намажьте тост свежей рикоттой. Добавьте щепотку морской соли и немного лимонной цедры.", photo_url: null },
    { id: "s3", recipe_id: "1", order: 3, title: "Добавить персик", description: "Нарежьте спелый персик тонкими дольками. Разложите поверх рикотты.", photo_url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&q=80" },
    { id: "s4", recipe_id: "1", order: 4, title: "Финальные штрихи", description: "Полейте цветочным мёдом. Добавьте листики свежей мяты. Подавайте сразу.", photo_url: null },
  ],
};

// ─── RECIPES ──────────────────────────────────────────────────────────────────
export const mockRecipes: Recipe[] = [
  {
    id: "1", title: "Рикотта-тост с персиком и мёдом", slug: "ricotta-toast-peach-honey",
    description: "Нежный кремовый тост, который превращает обычное утро в маленький праздник. Сливочная рикотта, спелый персик и капля цветочного мёда.",
    note: "Этот рецепт появился случайно — однажды летним утром в Тоскане.",
    cover_image: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80",
    published: true, featured: false, created_at: "2024-01-15T10:00:00Z", updated_at: "2024-01-15T10:00:00Z",
    categories: [mtStarter, mmBreakfast, mmBrunch, iCheese, sSummer, cItaly],
    steps: mockSteps["ricotta-toast-peach-honey"],
  },
  {
    id: "2", title: "Тальятелле с трюфельным маслом", slug: "tagliatelle-truffle-butter",
    description: "Паста, которая пахнет роскошью. Минимум ингредиентов — максимум вкуса.",
    note: "Впервые попробовала в маленьком ресторане в Болонье.",
    cover_image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80",
    published: true, featured: false, created_at: "2024-01-20T10:00:00Z", updated_at: "2024-01-20T10:00:00Z",
    categories: [mtPasta, mmLunch, mmDinner, iMushrooms, sAutumn, cItaly], steps: [],
  },
  {
    id: "3", title: "Матча латте с овсяным молоком", slug: "matcha-latte-oat-milk",
    description: "Бархатный зелёный напиток с землистой горчинкой матчи и мягкой сладостью овсяного молока.",
    note: null,
    cover_image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=800&q=80",
    published: true, featured: false, created_at: "2024-02-01T10:00:00Z", updated_at: "2024-02-01T10:00:00Z",
    categories: [mtDrink, mmBreakfast, mmSnack, sSpring, cJapan], steps: [],
  },
  {
    id: "4", title: "Лимонный тарт с меренгой", slug: "lemon-tart-meringue",
    description: "Классика французской патиссерии — хрустящее песочное тесто, шёлковый лимонный крем.",
    note: "Долго искала идеальное соотношение кислоты и сладости. Этот рецепт — результат десяти попыток.",
    cover_image: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=800&q=80",
    published: true, featured: false, created_at: "2024-02-10T10:00:00Z", updated_at: "2024-02-10T10:00:00Z",
    categories: [mtDessert, mtBaking, mmSnack, iEggs, sSummer, sEaster, cFrance], steps: [],
  },
  {
    id: "5", title: "Хумус с жареным чесноком", slug: "hummus-roasted-garlic",
    description: "Самый нежный хумус — с нутом, сваренным до полной мягкости, и щедрым оливковым маслом.",
    note: "Готовлю каждую пятницу. Стало традицией.",
    cover_image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80",
    published: true, featured: false, created_at: "2024-02-15T10:00:00Z", updated_at: "2024-02-15T10:00:00Z",
    categories: [mtStarter, mmLunch, mmSnack, iLegumes, iVeggies, cMiddleEast], steps: [],
  },
  {
    id: "6", title: "Зелёный салат с авокадо и фетой", slug: "green-salad-avocado-feta",
    description: "Салат, который хочется есть каждый день. Хрустящий руккола, кремовое авокадо, солёная фета.",
    note: null,
    cover_image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
    published: true, featured: false, created_at: "2024-03-01T10:00:00Z", updated_at: "2024-03-01T10:00:00Z",
    categories: [mtSalad, mmLunch, iCheese, iVeggies, sSpring, sSummer, cGreece], steps: [],
  },
  {
    id: "7", title: "Паста карбонара", slug: "pasta-carbonara",
    description: "Настоящая римская карбонара без сливок — только яйца, пекорино, гуанчале и черный перец.",
    note: "Секрет в температуре: яйца нельзя перегреть, иначе будет омлет.",
    cover_image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80",
    published: true, featured: false, created_at: "2024-03-05T10:00:00Z", updated_at: "2024-03-05T10:00:00Z",
    categories: [mtPasta, mmLunch, mmDinner, iEggs, iCheese, cItaly], steps: [],
  },
  {
    id: "8", title: "Мисо-суп с тофу и водорослями", slug: "miso-soup-tofu",
    description: "Простой и глубокий — бульон даши, белое мисо, шёлковый тофу и вакаме. Японский завтрак.",
    note: null,
    cover_image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80",
    published: true, featured: false, created_at: "2024-03-10T10:00:00Z", updated_at: "2024-03-10T10:00:00Z",
    categories: [mtSoup, mmBreakfast, mmLunch, iVeggies, cJapan], steps: [],
  },
  {
    id: "9", title: "Тирамису", slug: "tiramisu",
    description: "Классический итальянский десерт с маскарпоне, эспрессо и савоярди. Никакой желатин — только воздух.",
    note: "Готовлю накануне — на следующий день вкус раскрывается полностью.",
    cover_image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80",
    published: true, featured: false, created_at: "2024-03-15T10:00:00Z", updated_at: "2024-03-15T10:00:00Z",
    categories: [mtDessert, mmSnack, iEggs, iCheese, cItaly], steps: [],
  },
  {
    id: "10", title: "Фокачча с розмарином и морской солью", slug: "focaccia-rosemary",
    description: "Пышная, хрустящая снаружи и воздушная внутри. Секрет — щедрое количество оливкового масла.",
    note: "Лучшее что можно сделать с простыми ингредиентами.",
    cover_image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800&q=80",
    published: true, featured: false, created_at: "2024-03-20T10:00:00Z", updated_at: "2024-03-20T10:00:00Z",
    categories: [mtBaking, mtStarter, mmSnack, sAutumn, sWinter, cItaly], steps: [],
  },
  {
    id: "11", title: "Стейк рибай с маслом трав", slug: "ribeye-herb-butter",
    description: "Идеальная прожарка medium rare, хрустящая корочка, тающее масло с тимьяном и чесноком.",
    note: "Главное — дать мясу отдохнуть 5 минут после сковороды.",
    cover_image: "https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80",
    published: true, featured: false, created_at: "2024-04-01T10:00:00Z", updated_at: "2024-04-01T10:00:00Z",
    categories: [mtMain, mmDinner, iBeef, sBBQ, sAutumn], steps: [],
  },
  {
    id: "12", title: "Лосось в глазури мисо-имбирь", slug: "salmon-miso-ginger",
    description: "Нежный лосось с лакированной корочкой — сладкое мисо, свежий имбирь, соевый соус.",
    note: null,
    cover_image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80",
    published: true, featured: false, created_at: "2024-04-05T10:00:00Z", updated_at: "2024-04-05T10:00:00Z",
    categories: [mtMain, mmLunch, mmDinner, iFish, cJapan], steps: [],
  },
  {
    id: "13", title: "Боул с киноа, запечёнными овощами и тахини", slug: "quinoa-veggie-bowl",
    description: "Питательный и красивый боул. Хрустящий нут, сладкий батат, свежая зелень, кунжутная заправка.",
    note: null,
    cover_image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
    published: true, featured: false, created_at: "2024-04-10T10:00:00Z", updated_at: "2024-04-10T10:00:00Z",
    categories: [mtMain, mmLunch, iVeggies, iLegumes, sSpring, cMiddleEast], steps: [],
  },
  {
    id: "14", title: "Шоколадный торт с ганашем", slug: "chocolate-cake-ganache",
    description: "Влажный, тёмный, интенсивный — три вида шоколада, два вида какао, шёлковый ганаш.",
    note: "Рецепт, который я готовлю на каждый день рождения.",
    cover_image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80",
    published: true, featured: false, created_at: "2024-04-15T10:00:00Z", updated_at: "2024-04-15T10:00:00Z",
    categories: [mtDessert, mtBaking, mmSnack, sWinter, sChristmas], steps: [],
  },
  {
    id: "15", title: "Ризотто с грибами и пармезаном", slug: "mushroom-risotto",
    description: "Кремовое ризотто с лесными грибами — медленное помешивание, горячий бульон и хорошее вино.",
    note: "Ризотто нельзя торопить. Это медитация.",
    cover_image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80",
    published: true, featured: false, created_at: "2024-04-20T10:00:00Z", updated_at: "2024-04-20T10:00:00Z",
    categories: [mtMain, mmDinner, iMushrooms, iCheese, sAutumn, sWinter, cItaly], steps: [],
  },
  {
    id: "16", title: "Яйца пашот с голландским соусом", slug: "eggs-benedict-hollandaise",
    description: "Бранч мечты — идеальные яйца пашот, хрустящие тосты, бархатный голландский соус.",
    note: null,
    cover_image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80",
    published: true, featured: false, created_at: "2024-05-01T10:00:00Z", updated_at: "2024-05-01T10:00:00Z",
    categories: [mtMain, mmBreakfast, mmBrunch, iEggs, cFrance], steps: [],
  },
  {
    id: "17", title: "Греческий салат с орегано", slug: "greek-salad-oregano",
    description: "Классический хориатики — сочные томаты, огурец, красный лук, маслины, большой кусок феты.",
    note: null,
    cover_image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80",
    published: true, featured: false, created_at: "2024-05-05T10:00:00Z", updated_at: "2024-05-05T10:00:00Z",
    categories: [mtSalad, mmLunch, iCheese, iVeggies, sSummer, cGreece], steps: [],
  },
  {
    id: "18", title: "Карри с нутом и шпинатом", slug: "chickpea-spinach-curry",
    description: "Ароматное вегетарианское карри — кокосовое молоко, куркума, кумин, свежий корень имбиря.",
    note: "Готовится за 25 минут, вкус будто варился весь день.",
    cover_image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80",
    published: true, featured: false, created_at: "2024-05-10T10:00:00Z", updated_at: "2024-05-10T10:00:00Z",
    categories: [mtMain, mmLunch, mmDinner, iLegumes, iVeggies, sWinter, cIndia], steps: [],
  },
  {
    id: "19", title: "Гранола с орехами и кленовым сиропом", slug: "granola-nuts-maple",
    description: "Хрустящие кластеры овса, орехов и семян — запечённые с кленовым сиропом и кокосовым маслом.",
    note: "Делаю большую банку на всю неделю.",
    cover_image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    published: true, featured: false, created_at: "2024-05-15T10:00:00Z", updated_at: "2024-05-15T10:00:00Z",
    categories: [mtMain, mmBreakfast, mmSnack, sSpring, sSummer], steps: [],
  },
  {
    id: "20", title: "Смузи-боул с манго и маракуйей", slug: "mango-smoothie-bowl",
    description: "Густой тропический смузи с кокосовым молоком, свежим манго, маракуйей и хрустящей гранолой.",
    note: null,
    cover_image: "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=800&q=80",
    published: true, featured: false, created_at: "2024-05-20T10:00:00Z", updated_at: "2024-05-20T10:00:00Z",
    categories: [mtMain, mmBreakfast, mmBrunch, sSummer], steps: [],
  },
  {
    id: "21", title: "Вафли с черникой и взбитыми сливками", slug: "blueberry-waffles-cream",
    description: "Пышные вафли на пахте, щедрая горсть черники, лёгкие взбитые сливки и немного сахарной пудры.",
    note: null,
    cover_image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=800&q=80",
    published: true, featured: false, created_at: "2024-06-01T10:00:00Z", updated_at: "2024-06-01T10:00:00Z",
    categories: [mtBaking, mtDessert, mmBreakfast, mmBrunch, iEggs, sSummer], steps: [],
  },
  {
    id: "22", title: "Шакшука с фетой", slug: "shakshuka-feta",
    description: "Яйца, запечённые в густом томатном соусе с перцем и специями. Фета сверху. Хлеб обязателен.",
    note: "Идеальное блюдо когда нет времени, но хочется чего-то настоящего.",
    cover_image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80",
    published: true, featured: false, created_at: "2024-06-05T10:00:00Z", updated_at: "2024-06-05T10:00:00Z",
    categories: [mtMain, mmBreakfast, mmBrunch, iEggs, iCheese, iVeggies, cMiddleEast], steps: [],
  },
  {
    id: "23", title: "Баклажаны с тахини и гранатом", slug: "eggplant-tahini-pomegranate",
    description: "Запечённые баклажаны, кунжутная паста, гранатовые зёрна, зелень. Блюдо Ближнего Востока.",
    note: "Чем дольше печётся баклажан — тем лучше.",
    cover_image: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&q=80",
    published: true, featured: false, created_at: "2024-06-10T10:00:00Z", updated_at: "2024-06-10T10:00:00Z",
    categories: [mtStarter, mtMain, mmLunch, mmDinner, iVeggies, sSummer, cMiddleEast], steps: [],
  },
  {
    id: "24", title: "Панна котта с клубничным соусом", slug: "panna-cotta-strawberry",
    description: "Шёлковый итальянский десерт из ванильных сливок с ярким соусом из свежей клубники.",
    note: null,
    cover_image: "https://images.unsplash.com/photo-1488477304112-4944851de03d?w=800&q=80",
    published: true, featured: false, created_at: "2024-06-15T10:00:00Z", updated_at: "2024-06-15T10:00:00Z",
    categories: [mtDessert, mmSnack, sSummer, sEaster, cItaly], steps: [],
  },
  {
    id: "25", title: "Том ям с креветками", slug: "tom-yam-shrimp",
    description: "Острый и ароматный тайский суп — лимонная трава, галангал, листья каффир-лайма, кокосовое молоко.",
    note: null,
    cover_image: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80",
    published: true, featured: false, created_at: "2024-07-01T10:00:00Z", updated_at: "2024-07-01T10:00:00Z",
    categories: [mtSoup, mmLunch, mmDinner, iSeafood, sWinter], steps: [],
  },
  {
    id: "26", title: "Хачапури по-аджарски", slug: "adjarian-khachapuri",
    description: "Лодочка из дрожжевого теста с сулугуни, яичным желтком и маслом — символ грузинской кухни.",
    note: "Едят руками, отламывая хлеб и обмакивая в яично-сырную начинку.",
    cover_image: "https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=800&q=80",
    published: true, featured: false, created_at: "2024-07-05T10:00:00Z", updated_at: "2024-07-05T10:00:00Z",
    categories: [mtBaking, mtMain, mmBreakfast, mmBrunch, iEggs, iCheese, cGeorgia], steps: [],
  },
  {
    id: "27", title: "Тако с говядиной и сальсой", slug: "beef-tacos-salsa",
    description: "Хрустящие кукурузные тортильи, пряная говядина, свежая сальса, авокадо и кинза.",
    note: null,
    cover_image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80",
    published: true, featured: false, created_at: "2024-07-10T10:00:00Z", updated_at: "2024-07-10T10:00:00Z",
    categories: [mtMain, mmLunch, mmDinner, iBeef, sBBQ, sSummer, cMexico], steps: [],
  },
  {
    id: "28", title: "Суп минестроне", slug: "minestrone-soup",
    description: "Итальянский овощной суп с фасолью, пастой и базиликом. Густой, сытный, домашний.",
    note: "Каждый раз немного разный — зависит от того, что есть в холодильнике.",
    cover_image: "https://images.unsplash.com/photo-1540914124281-342587941389?w=800&q=80",
    published: true, featured: false, created_at: "2024-07-15T10:00:00Z", updated_at: "2024-07-15T10:00:00Z",
    categories: [mtSoup, mmLunch, iVeggies, iLegumes, sAutumn, sWinter, cItaly], steps: [],
  },
  {
    id: "29", title: "Французский луковый суп", slug: "french-onion-soup",
    description: "Медленно карамелизованный лук, насыщенный говяжий бульон, хрустящий багет и расплавленный грюйер.",
    note: "Лук нужно жарить не менее часа — в этом весь секрет.",
    cover_image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80",
    published: true, featured: false, created_at: "2024-08-01T10:00:00Z", updated_at: "2024-08-01T10:00:00Z",
    categories: [mtSoup, mmLunch, mmDinner, iBeef, iCheese, sAutumn, sWinter, cFrance], steps: [],
  },
  {
    id: "30", title: "Крем-брюле с ванилью", slug: "creme-brulee-vanilla",
    description: "Дрожащий заварной крем под тонкой хрустящей карамельной корочкой. Маленький французский театр.",
    note: "Постукивание ложечкой по карамели — лучший звук на свете.",
    cover_image: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=800&q=80",
    published: true, featured: false, created_at: "2024-08-05T10:00:00Z", updated_at: "2024-08-05T10:00:00Z",
    categories: [mtDessert, mmSnack, iEggs, sWinter, sChristmas, cFrance], steps: [],
  },
];

export const featuredRecipes = mockRecipes.slice(0, 4);

export function getRecipeBySlug(slug: string): Recipe | undefined {
  return mockRecipes.find((r) => r.slug === slug);
}
