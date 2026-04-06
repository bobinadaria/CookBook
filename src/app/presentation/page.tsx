"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Slide {
  id: number;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  notes: string;
  iframeUrl?: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Jak jsem postavila web za víkend",
    subtitle: "s AI asistentem — bez zkušeností s full-stack vývojem",
    content: (
      <div className="flex flex-col items-center justify-center h-full gap-8 text-center">
        <div className="w-20 h-20 rounded-full bg-peach/20 flex items-center justify-center text-4xl">
          🍳
        </div>
        <div>
          <h1 className="font-serif text-5xl text-charcoal mb-4 leading-tight">
            Jak jsem postavila web za víkend
          </h1>
          <p className="text-charcoal/60 text-xl font-light">
            s AI asistentem — bez zkušeností s full-stack vývojem
          </p>
        </div>
        <div className="flex gap-6 text-sm text-charcoal/40 mt-4">
          <span>Next.js 14</span>
          <span>·</span>
          <span>Supabase</span>
          <span>·</span>
          <span>Claude Code</span>
          <span>·</span>
          <span>Vercel</span>
        </div>
      </div>
    ),
    notes:
      "Uvítací slide. Přivítejte publikum, řekněte pár slov o sobě — nejste vývojář, nejste technik. Jen člověk s nápadem a chuťou zkusit něco nového. Dnešní prezentace je o tom, jak AI změnila přístup k tvorbě webů pro netech lidi.",
    iframeUrl: "/",
  },
  {
    id: 2,
    title: "Kdo jsem a co jsem chtěla",
    content: (
      <div className="flex flex-col justify-center h-full gap-8">
        <h2 className="font-serif text-4xl text-charcoal">Kdo jsem a co jsem chtěla</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-sand/60 rounded-2xl p-6">
            <p className="text-xs uppercase tracking-widest text-charcoal/40 mb-3">Výchozí bod</p>
            <ul className="space-y-2 text-charcoal/75 text-sm">
              <li>✦ Trochu zkušeností s HTML/CSS</li>
              <li>✦ Žádné zkušenosti s backendem</li>
              <li>✦ Žádné zkušenosti s databázemi</li>
              <li>✦ Žádné zkušenosti s deploymentem</li>
            </ul>
          </div>
          <div className="bg-peach/10 rounded-2xl p-6">
            <p className="text-xs uppercase tracking-widest text-charcoal/40 mb-3">Co jsem chtěla</p>
            <ul className="space-y-2 text-charcoal/75 text-sm">
              <li>✦ Osobní kuchařku online</li>
              <li>✦ Hezky navržený web</li>
              <li>✦ Admin panel pro přidávání receptů</li>
              <li>✦ Přihlášení a oblíbené recepty</li>
            </ul>
          </div>
        </div>
        <div className="bg-sage/10 rounded-2xl p-5 text-center">
          <p className="font-handwritten text-2xl text-sage">
            &ldquo;Normálně by to trvalo měsíce učení. Nebo drahý vývojář.&rdquo;
          </p>
        </div>
      </div>
    ),
    notes:
      "Zdůrazněte, že tohle není prezentace pro vývojáře. Je to příběh o tom, co se stane, když normální člověk dostane do rukou mocný nástroj. Mluvte o frustraci z toho, že máte nápad, ale nemáte technické zázemí.",
    iframeUrl: "/",
  },
  {
    id: 3,
    title: "Nástroje: co jsem použila",
    content: (
      <div className="flex flex-col justify-center h-full gap-6">
        <h2 className="font-serif text-4xl text-charcoal">Nástroje</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              name: "Claude Code",
              role: "AI asistent v terminálu",
              color: "bg-peach/15",
              icon: "🤖",
              desc: "Píše kód, opravuje chyby, navrhuje architekturu",
            },
            {
              name: "Next.js 14",
              role: "Framework pro web",
              color: "bg-sand/80",
              icon: "⚡",
              desc: "React framework s App Router — server + client komponenty",
            },
            {
              name: "Supabase",
              role: "Databáze + Auth + Storage",
              color: "bg-sage/15",
              icon: "🗄️",
              desc: "PostgreSQL, přihlašování, ukládání fotek — vše zadarmo",
            },
            {
              name: "Vercel",
              role: "Hosting a deploy",
              color: "bg-charcoal/5",
              icon: "🚀",
              desc: "Automatický deploy z GitHubu — push = live za 2 minuty",
            },
          ].map((tool) => (
            <div key={tool.name} className={cn("rounded-2xl p-5", tool.color)}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{tool.icon}</span>
                <div>
                  <p className="font-medium text-charcoal text-sm">{tool.name}</p>
                  <p className="text-xs text-charcoal/40">{tool.role}</p>
                </div>
              </div>
              <p className="text-xs text-charcoal/60 leading-relaxed">{tool.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-charcoal/35 uppercase tracking-widest">
          Vše zdarma na free tier (kromě času a nervů)
        </p>
      </div>
    ),
    notes:
      "Ukažte, že každý nástroj má konkrétní roli. Claude Code není jen chatbot — je to asistent přímo v terminálu, vidí soubory, spouští příkazy, opravuje chyby v reálném čase. Zdůrazněte, že free tier Supabase a Vercel umožnil celý projekt bez nákladů.",
    iframeUrl: "/",
  },
  {
    id: 4,
    title: "Vibe-coding: jak to funguje",
    content: (
      <div className="flex flex-col justify-center h-full gap-6">
        <h2 className="font-serif text-4xl text-charcoal">Vibe-coding</h2>
        <p className="text-charcoal/60 text-sm">Jak vypadá spolupráce s AI asistentem v praxi</p>
        <div className="flex flex-col gap-3">
          {[
            {
              step: "1",
              label: "Popíšete, co chcete",
              example:
                '"Chci stránku s receptama, kde jsou karty s fotkou a názvem, a po kliknutí se otevře detail"',
              color: "bg-peach/10",
            },
            {
              step: "2",
              label: "AI napíše kód",
              example: "Vygeneruje kompletní komponentu se správnými typy, styly a logikou",
              color: "bg-sand/60",
            },
            {
              step: "3",
              label: "Vy testujete",
              example: "Otevřete prohlížeč, zkontrolujete výsledek, opíšete co nefunguje",
              color: "bg-sage/10",
            },
            {
              step: "4",
              label: "Iterujete",
              example: '"Karty jsou moc malé, chci asymetrický grid jako ottolenghi.co.uk"',
              color: "bg-charcoal/5",
            },
          ].map((item) => (
            <div key={item.step} className={cn("rounded-xl p-4 flex gap-4 items-start", item.color)}>
              <span className="font-handwritten text-2xl text-peach/60 shrink-0 w-6">{item.step}</span>
              <div>
                <p className="font-medium text-charcoal text-sm">{item.label}</p>
                <p className="text-xs text-charcoal/50 mt-1 italic">{item.example}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    notes:
      "Toto je klíčový slide. Vysvětlete pojem 'vibe-coding' — programování na základě záměru, ne syntaxe. Nemusíte znát React hooks, TypeScript generics ani SQL JOIN — stačí popsat výsledek. AI překládá záměr do kódu. Vaše role je být product managerem vlastního projektu.",
    iframeUrl: "/recipes",
  },
  {
    id: 5,
    title: "Plan Mode: architekt před stavbou",
    content: (
      <div className="flex flex-col justify-center h-full gap-6">
        <h2 className="font-serif text-4xl text-charcoal">Plan Mode</h2>
        <p className="text-charcoal/60">Jak nepsat kód bez rozmyslu</p>
        <div className="grid grid-cols-5 gap-2 items-center">
          <div className="col-span-2 bg-red-50 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-widest text-red-400 mb-3">Bez plánu</p>
            <ul className="space-y-2 text-sm text-charcoal/70">
              <li>😵 AI píše kód okamžitě</li>
              <li>😵 Změna jedné věci rozbije druhou</li>
              <li>😵 Refaktoring = začít znovu</li>
              <li>😵 Zbytečné tokeny na opravu chyb</li>
            </ul>
          </div>
          <div className="flex flex-col items-center gap-2 text-charcoal/30">
            <span className="text-2xl">→</span>
            <span className="text-xs text-center">Plan Mode</span>
          </div>
          <div className="col-span-2 bg-sage/10 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-widest text-sage mb-3">S plánem</p>
            <ul className="space-y-2 text-sm text-charcoal/70">
              <li>✓ AI nejdřív navrhne architekturu</li>
              <li>✓ Vy schválíte nebo upravíte</li>
              <li>✓ Pak teprve vzniká kód</li>
              <li>✓ Méně zpětných kroků</li>
            </ul>
          </div>
        </div>
        <div className="bg-charcoal/5 rounded-xl p-4 text-center">
          <p className="text-sm text-charcoal/60">
            Příkaz: <code className="bg-charcoal/10 px-2 py-0.5 rounded text-xs">/plan</code> nebo{" "}
            <code className="bg-charcoal/10 px-2 py-0.5 rounded text-xs">Shift+Tab</code> v Claude Code
          </p>
        </div>
      </div>
    ),
    notes:
      "Plan Mode je funkce Claude Code, která zabrání AI psát kód bez schválení plánu. Vhodné pro větší featury. Ukažte, že pro začátečníka je to obzvlášť důležité — jinak skončíte s kódem, kterému nerozumíte a nedokážete ho opravit.",
    iframeUrl: "/",
  },
  {
    id: 6,
    title: "Problémy, na které jsem narazila",
    content: (
      <div className="flex flex-col justify-center h-full gap-5">
        <h2 className="font-serif text-4xl text-charcoal">Problémy v praxi</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: "🔤",
              title: "Cyrilice v URL",
              problem: "Recepty měly URL jako /рецепты/муравейник",
              solution: "AI přidal transliterační mapu: а→a, б→b, ш→sh...",
            },
            {
              icon: "💾",
              title: "Ztráta dat formuláře",
              problem: "Psala jsem recept, klikla jinam — vše smazáno",
              solution: "AI přidal auto-save do localStorage s 500ms debounce",
            },
            {
              icon: "🏗️",
              title: "Build chyby na Vercelu",
              problem: "Lokálně vše funguje, deploy selhal 3×",
              solution: "TypeScript a ESLint jsou přísnější v produkci — AI opravil vše",
            },
          ].map((item) => (
            <div key={item.title} className="bg-sand/50 rounded-2xl p-5">
              <div className="text-3xl mb-3">{item.icon}</div>
              <p className="font-medium text-charcoal text-sm mb-2">{item.title}</p>
              <p className="text-xs text-red-400 mb-2">Problém: {item.problem}</p>
              <p className="text-xs text-sage">Řešení: {item.solution}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-charcoal/35">
          Klíčové zjištění: AI nezná kontext vašeho projektu automaticky — musíte ho popsat
        </p>
      </div>
    ),
    notes:
      "Buďte konkrétní. Cyrilický slug byl frustrující — URL s ruskými znaky nefungovaly ve sdílení. Ztráta dat formuláře byl emocionální moment — hodina práce na receptu pryč jedním kliknutím. Build chyby ukázaly rozdíl mezi 'funguje u mě' a 'funguje všude'. AI všechny problémy vyřešil, ale potřeboval přesný popis chyby.",
    iframeUrl: "/recipes",
  },
  {
    id: 7,
    title: "Vygenerování receptu přes API",
    content: (
      <div className="flex flex-col justify-center h-full gap-6">
        <h2 className="font-serif text-4xl text-charcoal">API endpoint pro recepty</h2>
        <p className="text-charcoal/60 text-sm">
          Místo ručního klikání v admin panelu — programatické přidávání receptů
        </p>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <div className="bg-charcoal/5 rounded-xl p-4">
              <p className="text-xs text-charcoal/40 uppercase tracking-widest mb-2">Jak to funguje</p>
              <ol className="space-y-1 text-xs text-charcoal/70">
                <li>1. AI načte recept z externího webu</li>
                <li>2. Přeloží ho do ruštiny</li>
                <li>3. Zformátuje do JSON struktury</li>
                <li>4. Pošle POST request na API endpoint</li>
                <li>5. Recept se uloží do databáze</li>
              </ol>
            </div>
            <div className="bg-sage/10 rounded-xl p-4">
              <p className="text-xs text-charcoal/40 uppercase tracking-widest mb-2">Výsledek</p>
              <p className="text-xs text-charcoal/70">
                Recept Муравейник byl přidán z českého webu za ~3 minuty. Přeložen, formátován,
                uložen — bez jediného kliknutí v UI.
              </p>
            </div>
          </div>
          <div className="bg-charcoal rounded-2xl p-5 font-mono text-xs overflow-hidden">
            <p className="text-charcoal/40 mb-2"># POST /api/admin/recipes</p>
            <p className="text-green-400">{"{"}</p>
            <p className="text-yellow-300 pl-3">&quot;title&quot;: &quot;Муравейник&quot;,</p>
            <p className="text-yellow-300 pl-3">&quot;description&quot;: &quot;...&quot;,</p>
            <p className="text-yellow-300 pl-3">&quot;note&quot;: &quot;...&quot;,</p>
            <p className="text-yellow-300 pl-3">&quot;ingredients&quot;: &quot;...&quot;,</p>
            <p className="text-yellow-300 pl-3">&quot;categories&quot;: [&quot;Десерт&quot;],</p>
            <p className="text-blue-300 pl-3">&quot;steps&quot;: [</p>
            <p className="text-blue-300 pl-6">{"{ order: 1, title: ..., "}</p>
            <p className="text-blue-300 pl-8">description: ... {"}"}</p>
            <p className="text-blue-300 pl-3">{"]"}</p>
            <p className="text-green-400">{"}"}</p>
          </div>
        </div>
      </div>
    ),
    notes:
      "Toto je jeden z nejimpresivnějších momentů projektu. Ukažte, že AI může nejen psát kód, ale také obsah. Načetl recept z jiného webu, přeložil ho, strukturoval a uložil — vše v jednom příkazu. To je úroveň automatizace, která dříve vyžadovala vývojáře.",
    iframeUrl: "/recipes/muraveynik",
  },
  {
    id: 8,
    title: "Bezpečnost a .env soubory",
    content: (
      <div className="flex flex-col justify-center h-full gap-6">
        <h2 className="font-serif text-4xl text-charcoal">Bezpečnost</h2>
        <p className="text-charcoal/60">Co jsem se naučila o ochraně tajných klíčů</p>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
              <p className="text-sm font-medium text-red-500 mb-2">❌ Co nikdy nedělat</p>
              <ul className="space-y-1 text-xs text-charcoal/60">
                <li>• Commitovat <code>.env</code> soubor do GitHubu</li>
                <li>• Sdílet API klíče v chatu nebo emailu</li>
                <li>• Používat service role key na frontendu</li>
                <li>• Nechat klíče v kódu napevno</li>
              </ul>
            </div>
            <div className="bg-sage/10 rounded-2xl p-5">
              <p className="text-sm font-medium text-sage mb-2">✓ Správný postup</p>
              <ul className="space-y-1 text-xs text-charcoal/60">
                <li>• <code>.env.local</code> v <code>.gitignore</code></li>
                <li>• Klíče přidat ručně do Vercel dashboardu</li>
                <li>• Service role key pouze na serveru</li>
                <li>• Anon key může být <code>NEXT_PUBLIC_</code></li>
              </ul>
            </div>
          </div>
          <div className="bg-sand/50 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-charcoal/40 mb-4">
                Supabase RLS (Row Level Security)
              </p>
              <p className="text-sm text-charcoal/70 leading-relaxed">
                Databáze sama chrání data. Každý řádek má pravidla: kdo ho může číst, upravovat,
                mazat. Admin vidí vše. Přihlášený uživatel jen svá oblíbená. Host jen veřejné
                recepty.
              </p>
            </div>
            <div className="bg-charcoal/5 rounded-xl p-3 mt-4">
              <p className="font-handwritten text-lg text-charcoal/50 text-center">
                Bezpečnost není volitelná — AI mi to připomněl hned na začátku
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
    notes:
      "Bezpečnost je téma, které začátečníci podceňují. Vysvětlete, že omylem commitovaný API klíč na GitHub může vést k velkým účtům (botové prohledávají GitHub). Supabase RLS je elegantní řešení — pravidla jsou v databázi, ne jen v kódu. Claude Code mě varoval, když jsem se ptala na věci, které by mohly být nebezpečné.",
    iframeUrl: "/",
  },
  {
    id: 9,
    title: "Refaktoring a cena tokenů",
    content: (
      <div className="flex flex-col justify-center h-full gap-6">
        <h2 className="font-serif text-4xl text-charcoal">Refaktoring & tokeny</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-sand/50 rounded-2xl p-6">
            <p className="text-xs uppercase tracking-widest text-charcoal/40 mb-4">
              Co je token a proč záleží
            </p>
            <p className="text-sm text-charcoal/70 leading-relaxed mb-4">
              AI platíte za&nbsp;zpracovaný text — vstupy i výstupy. Čím větší kontext (starý kód,
              dlouhé soubory, zbytečné opakování), tím více tokenů spotřebujete.
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-300 shrink-0" />
                <p className="text-xs text-charcoal/60">
                  Velký soubor s mrtvým kódem = zbytečné tokeny při každé změně
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-300 shrink-0" />
                <p className="text-xs text-charcoal/60">
                  Opakování stejného kontextu v každém dotazu = dvojnásobné náklady
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-sage shrink-0" />
                <p className="text-xs text-charcoal/60">
                  Čisté, modulární soubory = AI snáz pochopí a méně tokenů spotřebuje
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="bg-peach/10 rounded-2xl p-4 text-center">
              <p className="font-handwritten text-3xl text-peach mb-1">~30 receptů</p>
              <p className="text-xs text-charcoal/40">mock data pro vývoj</p>
            </div>
            <div className="bg-sage/10 rounded-2xl p-4 text-center">
              <p className="font-handwritten text-3xl text-sage mb-1">3 reálné</p>
              <p className="text-xs text-charcoal/40">croissant, wings, муравейник</p>
            </div>
            <div className="bg-charcoal/5 rounded-2xl p-4 text-center">
              <p className="text-xs text-charcoal/50">Refaktoring = investice do budoucích tokenů</p>
            </div>
          </div>
        </div>
        <div className="bg-charcoal/5 rounded-xl p-4">
          <p className="text-sm text-charcoal/60 text-center">
            💡 Tip: Udržujte malé, zaměřené soubory. AI pracuje efektivněji s modulárním kódem.
          </p>
        </div>
      </div>
    ),
    notes:
      "Praktická ekonomika AI asistence. Tokeny jsou jako minuty telefonního tarifu — platíte za každé slovo, které AI přečte i napíše. Velký zaneřáděný soubor stojí více než čistý modulární kód. Refaktoring není jen o čistotě — je to i o úspoře peněz při dalším vývoji.",
    iframeUrl: "/",
  },
  {
    id: 10,
    title: "Přepínání modelů",
    content: (
      <div className="flex flex-col justify-center h-full gap-6">
        <h2 className="font-serif text-4xl text-charcoal">Přepínání modelů</h2>
        <p className="text-charcoal/60">Různé úkoly, různé nástroje</p>
        <div className="flex flex-col gap-4">
          {[
            {
              model: "Claude Opus",
              use: "Složitá architektura, těžká debug sezení",
              cost: "Nejdražší",
              icon: "🧠",
              color: "bg-peach/10",
            },
            {
              model: "Claude Sonnet",
              use: "Každodenní kódování, nové funkce, opravy bugů",
              cost: "Vyvážený",
              icon: "⚡",
              color: "bg-sand/70",
            },
            {
              model: "Claude Haiku",
              use: "Jednoduché úpravy, přejmenování, formátování",
              cost: "Nejlevnější",
              icon: "🪶",
              color: "bg-sage/10",
            },
          ].map((item) => (
            <div key={item.model} className={cn("rounded-xl p-4 flex items-center gap-5", item.color)}>
              <span className="text-3xl">{item.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-medium text-charcoal">{item.model}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-charcoal/10 text-charcoal/50">
                    {item.cost}
                  </span>
                </div>
                <p className="text-xs text-charcoal/60">{item.use}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-charcoal/5 rounded-xl p-4">
          <p className="text-sm text-charcoal/60 text-center">
            V Claude Code: <code className="bg-charcoal/10 px-2 py-0.5 rounded text-xs">/model</code> pro
            změnu modelu uprostřed konverzace
          </p>
        </div>
      </div>
    ),
    notes:
      "Přepínání modelů je jako volba nástroje — kladivo vs šroubovák. Pro rutinní práci je Haiku dost rychlý a levný. Sonnet je sweet spot pro většinu úkolů. Opus nasadíte jen když to opravdu potřebujete. Ukažte, že tohle vědění šetří peníze a čas.",
    iframeUrl: "/",
  },
  {
    id: 11,
    title: "Přehnané inženýrství: past pro začátečníky",
    content: (
      <div className="flex flex-col justify-center h-full gap-6">
        <h2 className="font-serif text-4xl text-charcoal">Over-engineering</h2>
        <p className="text-charcoal/60">Největší past při práci s AI</p>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-widest text-charcoal/40">Co se může stát</p>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-sm text-charcoal/70 leading-relaxed">
                AI je ochoten postavit cokoli. Zeptejte se na &ldquo;systém pro správu receptů&rdquo; a
                dostanete mikroservisy, Redis cache, GraphQL API a Kubernetes deployment.
              </p>
            </div>
            <div className="bg-sand/50 rounded-xl p-4">
              <p className="text-xs text-charcoal/40 mb-2">Příklady z mého projektu:</p>
              <ul className="space-y-1 text-xs text-charcoal/60">
                <li>• AI navrhl Redis cache pro 3 recepty 😅</li>
                <li>• Chtěl přidat GraphQL místo REST</li>
                <li>• Navrhoval Docker pro lokální vývoj</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-widest text-charcoal/40">Jak se bránit</p>
            <div className="bg-sage/10 rounded-xl p-5 flex-1">
              <ul className="space-y-3 text-sm text-charcoal/70">
                <li className="flex gap-2">
                  <span className="text-sage shrink-0">✦</span>
                  <span>Vždy specifikujte scale projektu: &ldquo;osobní web, max 100 receptů&rdquo;</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sage shrink-0">✦</span>
                  <span>Ptejte se: &ldquo;Je to nutné pro MVP?&rdquo;</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sage shrink-0">✦</span>
                  <span>YAGNI: You Aren&apos;t Gonna Need It</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-sage shrink-0">✦</span>
                  <span>MVP nejdřív, složitost později</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),
    notes:
      "Over-engineering je skutečný problém. AI je jako šikovný asistent, který chce udělat co nejlepší práci — a 'nejlepší' pro inženýra může znamenat škálovatelnou enterprise architekturu. Vy chcete osobní kuchařku, ne Amazon. Naučte se říkat ne komplexitě a udržet focus na problém, který řešíte.",
    iframeUrl: "/",
  },
  {
    id: 12,
    title: "Výsledek: co web umí",
    content: (
      <div className="flex flex-col justify-center h-full gap-5">
        <h2 className="font-serif text-4xl text-charcoal">Co web umí</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              category: "Pro návštěvníky",
              items: ["Prohlížení receptů", "Vyhledávání a filtrování", "Detail receptu s kroky", "Přepínání jazyků (RU/EN)"],
              color: "bg-sand/60",
            },
            {
              category: "Pro přihlášené",
              items: ["Ukládání oblíbených", "Osobní poznámky", "Vlastní dashboard"],
              color: "bg-peach/10",
            },
            {
              category: "Admin panel",
              items: ["Přidávání receptů (UI + API)", "Správa kategorií", "Správa kroků + fotek", "Draft auto-save"],
              color: "bg-sage/10",
            },
          ].map((cat) => (
            <div key={cat.category} className={cn("rounded-2xl p-5", cat.color)}>
              <p className="text-xs uppercase tracking-widest text-charcoal/40 mb-3">{cat.category}</p>
              <ul className="space-y-1.5">
                {cat.items.map((item) => (
                  <li key={item} className="flex gap-2 text-xs text-charcoal/70">
                    <span className="text-peach shrink-0">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Recepty v DB", value: "3 reálné" },
            { label: "Jazyky", value: "RU + EN" },
            { label: "Deploy čas", value: "~2 min" },
            { label: "Cena hostingu", value: "0 Kč" },
          ].map((stat) => (
            <div key={stat.label} className="bg-charcoal/5 rounded-xl p-3 text-center">
              <p className="font-handwritten text-xl text-charcoal/70">{stat.value}</p>
              <p className="text-xs text-charcoal/35 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    ),
    notes:
      "Konkrétní výsledky. Ukažte živý web — přepněte na iframe s recepty. Zdůrazněte, že tohle vše existuje za 0 Kč na hostingu. Celé bylo postaveno za víkend. Bez týmu vývojářů. Bez předchozích zkušeností s backendem.",
    iframeUrl: "/recipes",
  },
  {
    id: 13,
    title: "Roadmapa: co bude dál",
    content: (
      <div className="flex flex-col justify-center h-full gap-6">
        <h2 className="font-serif text-4xl text-charcoal">Co bude dál</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-widest text-charcoal/40">Plánované funkce</p>
            {[
              { label: "AI generování receptů", desc: "Claude API: 'vygeneruj recept s 30g proteinu'", ready: false },
              { label: "Vlastní kuchařky uživatelů", desc: "Každý uživatel má svou sbírku", ready: false },
              { label: "PWA / mobilní app", desc: "Offline přístup k receptům", ready: false },
              { label: "Sezónní doporučení", desc: "Co vařit teď, podle sezóny", ready: false },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 bg-sand/40 rounded-xl p-3">
                <span className="w-5 h-5 rounded-full border-2 border-peach/40 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-charcoal">{item.label}</p>
                  <p className="text-xs text-charcoal/50">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-peach/10 rounded-2xl p-6 flex flex-col justify-center gap-4">
            <p className="font-handwritten text-3xl text-peach/70 leading-snug">
              &ldquo;Nejdůležitější věc, co jsem se naučila?&rdquo;
            </p>
            <p className="text-charcoal/70 text-sm leading-relaxed">
              Technologie přestala být bariérou. Mám nápad → popíšu ho → AI pomůže ho realizovat.
              Znalosti jsou stále důležité, ale jiným způsobem: musíte vědět, co chcete a umět to
              popsat.
            </p>
            <p className="text-xs text-charcoal/40 italic">
              Product thinking &gt; coding skills (v éře AI)
            </p>
          </div>
        </div>
      </div>
    ),
    notes:
      "Roadmapa ukazuje, že projekt je živý a roste. Zdůrazněte AI generování receptů — to je přirozený next step pro kuchařskou aplikaci. Uzavřete myšlenkou, že AI demokratizuje vývoj softwaru. Nemusíte být vývojář, abyste realizovali svou vizi.",
    iframeUrl: "/",
  },
  {
    id: 14,
    title: "Čas na otázky",
    content: (
      <div className="flex flex-col items-center justify-center h-full gap-8 text-center">
        <div className="w-24 h-24 rounded-full bg-sand flex items-center justify-center text-5xl">
          🍰
        </div>
        <div>
          <h2 className="font-serif text-5xl text-charcoal mb-4">Díky za pozornost</h2>
          <p className="text-charcoal/60 text-lg">Web je živý — podívejte se sami</p>
        </div>
        <div className="flex flex-col gap-3 text-sm text-charcoal/50">
          <p>
            Kód na GitHubu · Hostováno na Vercel · Databáze Supabase
          </p>
          <p className="font-handwritten text-xl text-peach">
            Otázky? Ptejte se! 🙋
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-xs">
          {[
            { q: "Kolik to stálo?", a: "Čas + 0 Kč na infrastrukturu" },
            { q: "Jak dlouho to trvalo?", a: "Víkend + pár večerů" },
            { q: "Kdo to může zkusit?", a: "Kdokoliv s nápadem a trpělivostí" },
          ].map((item) => (
            <div key={item.q} className="bg-sand/50 rounded-xl p-4">
              <p className="font-medium text-charcoal/70 mb-1">{item.q}</p>
              <p className="text-charcoal/45">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    ),
    notes:
      "Závěrečný slide. Nechte na ekranu otevřený web v iframe — ať lidé vidí živý výsledek. Připravte se na otázky o ceně, čase a nutných znalostech. Nejčastější otázka: 'Musím umět programovat?' Odpověď: trochu pomáhá, ale není nutné — důležitější je schopnost přesně popsat, co chcete.",
    iframeUrl: "/recipes",
  },
];

export default function PresentationPage() {
  const [current, setCurrent] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const slide = slides[current];
  const total = slides.length;

  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent((c) => Math.min(total - 1, c + 1)), [total]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        prev();
      } else if (e.key === "n" || e.key === "N") {
        setShowNotes((s) => !s);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  useEffect(() => {
    setIframeLoaded(false);
  }, [slide.iframeUrl]);

  return (
    <div className="h-screen w-screen bg-charcoal flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-charcoal/95 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-handwritten text-peach text-lg">CookBook</span>
          <span className="text-white/20 text-xs">·</span>
          <span className="text-white/40 text-xs">Prezentace</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowNotes((s) => !s)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full transition-all",
              showNotes
                ? "bg-peach text-white"
                : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
            )}
          >
            Poznámky [N]
          </button>
          <span className="text-white/30 text-xs">
            {current + 1} / {total}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/5 shrink-0">
        <div
          className="h-full bg-peach transition-all duration-500"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Slide panel */}
        <div className="flex flex-col w-1/2 bg-cream overflow-hidden">
          <div className="flex-1 overflow-y-auto p-10">
            {slide.content}
          </div>

          {/* Speaker notes */}
          {showNotes && (
            <div className="border-t border-charcoal/10 bg-sand/50 p-5 max-h-40 overflow-y-auto shrink-0">
              <p className="text-xs uppercase tracking-widest text-charcoal/30 mb-2">
                Poznámky pro přednášejícího
              </p>
              <p className="text-sm text-charcoal/65 leading-relaxed">{slide.notes}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="border-t border-charcoal/10 px-6 py-4 flex items-center justify-between bg-cream shrink-0">
            <button
              onClick={prev}
              disabled={current === 0}
              className="flex items-center gap-2 text-sm text-charcoal/40 hover:text-charcoal disabled:opacity-20 transition-colors"
            >
              ← Předchozí
            </button>

            {/* Slide dots */}
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "rounded-full transition-all",
                    i === current
                      ? "w-4 h-1.5 bg-peach"
                      : "w-1.5 h-1.5 bg-charcoal/15 hover:bg-charcoal/30"
                  )}
                />
              ))}
            </div>

            <button
              onClick={next}
              disabled={current === total - 1}
              className="flex items-center gap-2 text-sm text-charcoal/40 hover:text-charcoal disabled:opacity-20 transition-colors"
            >
              Další →
            </button>
          </div>
        </div>

        {/* iframe panel */}
        <div className="w-1/2 flex flex-col bg-charcoal/95 border-l border-white/5">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
            <div className="flex-1 bg-white/5 rounded text-xs text-white/30 px-3 py-1 text-center font-mono truncate">
              cookbook-app.vercel.app{slide.iframeUrl}
            </div>
          </div>
          <div className="flex-1 relative">
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-handwritten text-white/20 text-xl">načítání...</span>
              </div>
            )}
            <iframe
              key={slide.iframeUrl}
              src={slide.iframeUrl}
              className="w-full h-full"
              style={{ opacity: iframeLoaded ? 1 : 0, transition: "opacity 0.3s" }}
              onLoad={() => setIframeLoaded(true)}
              title="CookBook live preview"
            />
          </div>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="px-6 py-2 bg-charcoal/95 border-t border-white/5 flex justify-center gap-6 text-xs text-white/20 shrink-0">
        <span>← → navigace</span>
        <span>·</span>
        <span>N – poznámky</span>
        <span>·</span>
        <span>Mezerník – další slide</span>
      </div>
    </div>
  );
}
