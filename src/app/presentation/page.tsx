"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Slide {
  id: number;
  title: string;
  content: React.ReactNode;
  right: React.ReactNode;
  notes: string;
}

/* ─── Shared right-panel building blocks ─────────────────────────── */

function IframePanel({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(false), [src]);
  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-charcoal/95">
          <span className="font-handwritten text-white/20 text-xl">načítání…</span>
        </div>
      )}
      <iframe
        key={src}
        src={src}
        className="w-full h-full"
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.4s" }}
        onLoad={() => setLoaded(true)}
        title="CookBook live preview"
      />
    </div>
  );
}

function TerminalPanel({
  lines,
}: {
  lines: { type: "cmd" | "out" | "err" | "blank" | "comment"; text: string }[];
}) {
  return (
    <div className="w-full h-full bg-[#0d1117] flex flex-col p-6 font-mono text-sm overflow-auto">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-3 h-3 rounded-full bg-red-500/70" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <div className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className="text-white/20 text-xs ml-2">zsh — 80×24</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {lines.map((l, i) => (
          <div key={i} className="leading-relaxed">
            {l.type === "cmd" && (
              <p className="text-white">
                <span className="text-green-400">❯</span> {l.text}
              </p>
            )}
            {l.type === "out" && <p className="text-white/55">{l.text}</p>}
            {l.type === "err" && <p className="text-red-400">{l.text}</p>}
            {l.type === "comment" && <p className="text-white/25 italic">{l.text}</p>}
            {l.type === "blank" && <p>&nbsp;</p>}
          </div>
        ))}
        <span className="text-green-400 animate-pulse">▊</span>
      </div>
    </div>
  );
}

function ChatPanel({
  messages,
}: {
  messages: { role: "user" | "claude"; text: string | React.ReactNode }[];
}) {
  return (
    <div className="w-full h-full bg-[#1a1a2e] flex flex-col p-5 overflow-auto gap-4">
      <div className="flex items-center gap-3 border-b border-white/10 pb-3 mb-1">
        <div className="w-7 h-7 rounded-full bg-[#c96442] flex items-center justify-center text-xs text-white font-bold">
          C
        </div>
        <span className="text-white/60 text-xs">Claude Code</span>
        <span className="ml-auto w-2 h-2 rounded-full bg-green-400" />
      </div>
      {messages.map((m, i) => (
        <div
          key={i}
          className={cn(
            "max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed",
            m.role === "user"
              ? "self-end bg-[#c96442]/80 text-white ml-auto rounded-br-sm"
              : "self-start bg-white/8 text-white/75 rounded-bl-sm border border-white/10"
          )}
        >
          {m.role === "claude" && (
            <p className="text-[#c96442] text-[10px] font-bold mb-1 uppercase tracking-widest">
              Claude
            </p>
          )}
          {m.text}
        </div>
      ))}
    </div>
  );
}

function CodePanel({
  title,
  lang,
  lines,
}: {
  title: string;
  lang: string;
  lines: { text: string; highlight?: boolean; dim?: boolean }[];
}) {
  return (
    <div className="w-full h-full bg-[#0d1117] flex flex-col font-mono text-xs overflow-auto">
      <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/5 shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        <span className="text-white/30 ml-2 text-[11px]">{title}</span>
        <span className="ml-auto text-white/15 text-[10px]">{lang}</span>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-0.5">
        {lines.map((l, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-4 rounded px-2 py-0.5",
              l.highlight && "bg-yellow-400/8",
              l.dim && "opacity-35"
            )}
          >
            <span className="text-white/15 w-5 shrink-0 text-right select-none">{i + 1}</span>
            <span
              className={cn(
                "whitespace-pre",
                l.highlight ? "text-yellow-200" : "text-white/65"
              )}
            >
              {l.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Slide data ─────────────────────────────────────────────────── */

const slides: Slide[] = [
  /* 1 ─ Intro */
  {
    id: 1,
    title: "Jak jsem postavila web za víkend",
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
    right: <IframePanel src="/" />,
    notes:
      "Ahoj všichni! Jsem Daria. Pracuju v IT, ale na byznysové straně — ne jako vývojářka. Přesto jsem za víkend postavila fungující web s databází, přihlašováním a admin panelem. Napravo na obrazovce vidíte živý výsledek — to není mockup, to je skutečný web běžící na internetu. Dnes vám ukážu jak, co mě to stálo a co jsem se naučila.",
  },

  /* 2 ─ Kdo jsem */
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
    right: (
      <CodePanel
        title="CLAUDE.md — project brief"
        lang="markdown"
        lines={[
          { text: "# Cookbook — Project Brief for Claude Code" },
          { text: "" },
          { text: "## Project Overview" },
          {
            text: "Personal recipe book web application — a curated",
            highlight: true,
          },
          {
            text: "collection of the owner's recipes, beautifully",
            highlight: true,
          },
          {
            text: "presented. Not a generic recipe site — it should",
            highlight: true,
          },
          { text: "feel like a personal art object.", highlight: true },
          { text: "" },
          { text: "## Tech Stack" },
          { text: "- Framework:  Next.js 14 (App Router)" },
          { text: "- Styling:    Tailwind CSS" },
          { text: "- Animations: GSAP (ScrollTrigger)" },
          { text: "- Language:   TypeScript (strict mode)" },
          { text: "- Backend/DB: Supabase (PostgreSQL + Auth)" },
          { text: "- Deployment: Vercel" },
          { text: "" },
          { text: "## Color Palette" },
          { text: "  cream:   '#FDFAF5'  // main background" },
          { text: "  sand:    '#F2E8DC'  // card backgrounds" },
          { text: "  peach:   '#E8956D'  // primary accent" },
          { text: "  sage:    '#8BAF8C'  // secondary accent" },
          { text: "" },
          { text: "## User Roles" },
          { text: "  Guest    → browse recipes" },
          { text: "  User     → save favorites, add notes" },
          { text: "  Admin    → full CRUD via /admin portal" },
        ]}
      />
    ),
    notes:
      "Kde jsem začínala? HTML a CSS z kurzů — to bylo vše. Backend, databáze, deployment — černý box. Ale měla jsem konkrétní vizi: osobní kuchařku, která vypadá jako umělecký objekt, ne generický web. Klíčový posun byl, když jsem si uvědomila: nemusím znát kód, musím znát svůj produkt. A to jsem znala. Napravo vidíte CLAUDE.md — to je soubor, který jsem napsala jako zadání pro AI. Popsala jsem v něm design systém, barvy, fonty, strukturu databáze. Čím lepší zadání, tím lepší výsledek. Věnujte mu čas.",
  },

  /* 3 ─ Nástroje */
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
              desc: "Automatický deploy z GitHubu — push = live za ~1 minutu",
            },
            {
              name: "Google Translate API",
              role: "Překlad obsahu receptů",
              color: "bg-blue-50",
              icon: "🌐",
              desc: "Překlad receptů RU↔EN↔CS — použito pro lokalizaci, cena ~0,26 Kč celkem",
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
        <div className="flex items-center justify-center gap-6 text-xs text-charcoal/40 border-t border-charcoal/8 pt-3">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-peach/60" />
            Claude Code: <strong className="text-charcoal/60">20 €/měsíc</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sage/60" />
            Google Translate API: <strong className="text-charcoal/60">~0,26 Kč</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-charcoal/20" />
            Hosting + DB + Deploy: <strong className="text-charcoal/60">0 Kč</strong>
          </span>
        </div>
      </div>
    ),
    right: (
      <TerminalPanel
        lines={[
          { type: "comment", text: "# instalace Claude Code" },
          { type: "cmd", text: "npm install -g @anthropic-ai/claude-code" },
          { type: "out", text: "added 1 package in 3s" },
          { type: "blank", text: "" },
          { type: "comment", text: "# spuštění v projektu" },
          { type: "cmd", text: "cd ~/Desktop/CookBook && claude" },
          { type: "out", text: "✓  Claude Code v1.0.18" },
          { type: "out", text: "✓  Project: CookBook" },
          { type: "out", text: "✓  CLAUDE.md loaded (2.4 kB)" },
          { type: "blank", text: "" },
          { type: "out", text: "╭─────────────────────────────────╮" },
          { type: "out", text: "│  Welcome to Claude Code!        │" },
          { type: "out", text: "│  Type a message or /help        │" },
          { type: "out", text: "╰─────────────────────────────────╯" },
          { type: "blank", text: "" },
          { type: "comment", text: "# vytvoření Next.js projektu" },
          { type: "cmd", text: "npx create-next-app@latest cookbook" },
          { type: "out", text: "  ✔ TypeScript? Yes" },
          { type: "out", text: "  ✔ Tailwind CSS? Yes" },
          { type: "out", text: "  ✔ App Router? Yes" },
          { type: "out", text: "" },
          { type: "out", text: "✓  Created CookBook in 12s" },
        ]}
      />
    ),
    notes:
      "Pojďme na nástroje. Claude Code není webový chatbot — spouštíte ho přímo v terminálu a on vidí celý váš projekt. Čte soubory, spouští příkazy, opravuje chyby. Za Claude Code platím 20 eur měsíčně — to je jak Netflix. Za Google Translate API, které jsem použila na překlad receptů do tří jazyků, jsem zaplatila 26 haléřů celkem. Hosting na Vercelu, databáze na Supabase — zdarma. Takže celková investice kromě času: 20 euro a 26 haléřů.",
  },

  /* 4 ─ Vibe-coding */
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
              example: '"Chci stránku s receptama, kde jsou karty s fotkou a názvem"',
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
    right: (
      <ChatPanel
        messages={[
          {
            role: "user",
            text: "Chci stránku s katalogem receptů. Asymetrický grid jako na ottolenghi.co.uk — karty různých velikostí, fotka, název, kategorie. Po kliknutí přejít na detail receptu.",
          },
          {
            role: "claude",
            text: (
              <div className="space-y-2">
                <p>Navrhnu asymetrický grid s alternujícím layoutem. Použiji CSS Grid s featured kartou (2× větší) a normálními kartami vedle.</p>
                <div className="bg-white/5 rounded-lg p-2 font-mono text-[10px] text-green-300">
                  {`// RecipeGrid.tsx\nexport function RecipeGrid({ recipes }) {\n  return (\n    <div className="grid grid-cols-3 gap-6">\n      {recipes.map((r, i) => (\n        <RecipeCard\n          key={r.id}\n          recipe={r}\n          featured={i % 5 === 0}\n        />\n      ))}\n    </div>\n  );\n}`}
                </div>
                <p className="text-white/50">Vytvořil jsem RecipeGrid.tsx a RecipeCard.tsx. Featured karta zabírá 2 sloupce a má větší obrázek.</p>
              </div>
            ),
          },
          {
            role: "user",
            text: "Super! Ale karty jsou moc hranaté, chci border-radius 24px a teplejší stín.",
          },
          {
            role: "claude",
            text: "Upravuji RecipeCard — přidám rounded-3xl a shadow: 0 8px 32px rgba(28,25,23,0.08). Teplý stín ladí s vaší cream paletou.",
          },
        ]}
      />
    ),
    notes:
      "Vibe-coding — možná jste slyšeli tento termín. Je to způsob práce, kdy popisujete záměr, ne syntaxi. Já jsem říkala věci jako 'chci, aby karty vypadaly jako na ottolenghi.co.uk' nebo 'tento font je moc fádní, chci něco teplejšího'. A Claude to přeložil do kódu. Zajímavý fakt: nemusíte ani vědět, jak se správně nazývá to, co chcete. Stačí popsat vizuální nebo funkční dojem. Vaše role se mění — přestáváte být programátorem a stáváte se product managerem svého projektu.",
  },

  /* 5 ─ Plan Mode */
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
            </ul>
          </div>
        </div>
        <div className="bg-charcoal/5 rounded-xl p-4 text-center">
          <p className="text-sm text-charcoal/60">
            Aktivace:{" "}
            <code className="bg-charcoal/10 px-2 py-0.5 rounded text-xs">/plan</code>{" "}
            v Claude Code — nebo zaškrtnout v nastavení konverzace
          </p>
        </div>
      </div>
    ),
    right: (
      <ChatPanel
        messages={[
          {
            role: "user",
            text: "Přidej systém oblíbených receptů — uživatel může ukládat recepty, vidět je v dashboardu.",
          },
          {
            role: "claude",
            text: (
              <div className="space-y-2">
                <p className="text-yellow-300 font-bold text-[11px]">⚡ PLAN MODE — nenapisuji kód, pouze plán</p>
                <p>Navrhuji následující implementaci:</p>
                <ol className="space-y-1 text-[11px] list-decimal list-inside text-white/70">
                  <li>Supabase tabulka <code className="text-green-300">favorites(user_id, recipe_id)</code></li>
                  <li>RLS policy: uživatel vidí jen svá oblíbená</li>
                  <li>React Context <code className="text-green-300">FavoritesContext</code> — globální stav</li>
                  <li>Hook <code className="text-green-300">useFavorites()</code> — toggle, check, list</li>
                  <li>Tlačítko ♡ na RecipeCard — optimistic update</li>
                  <li>Stránka <code className="text-green-300">/dashboard/favorites</code></li>
                </ol>
                <p className="text-white/50 text-[11px] mt-2">Schvalujete tento plán? Mohu pokračovat?</p>
              </div>
            ),
          },
          {
            role: "user",
            text: "Schvaluji, pokračuj!",
          },
          {
            role: "claude",
            text: "Výborně. Začínám s databázovým schématem a RLS policies, pak Context, pak UI komponenty...",
          },
        ]}
      />
    ),
    notes:
      "Plan Mode je funkce, která vám zachrání hodiny. Místo aby Claude okamžitě psal kód, nejdřív navrhne plán — co vytvoří, v jakém pořadí, jaká bude architektura. Vy to schválíte nebo upravíte. Teprve pak vzniká kód. Aktivuje se příkazem /plan. Poznámka: v dokumentaci se zmiňuje Shift+Tab, ale mně na Macu nefungovalo — zkoušejte /plan. Praktický tip: Plan Mode je obzvlášť cenný, když přidáváte velkou novou funkci. Bez něj skončíte s kódem, kterému nerozumíte a nedokážete ho sami opravit.",
  },

  /* 6 ─ Problémy */
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
              problem: "URL jako /рецепты/муравейник",
              solution: "Transliterační mapa: а→a, ш→sh...",
            },
            {
              icon: "💾",
              title: "Ztráta dat formuláře",
              problem: "Psala jsem recept, klikla jinam — vše smazáno",
              solution: "Auto-save do localStorage, 500ms debounce",
            },
            {
              icon: "🏗️",
              title: "Build chyby na Vercelu",
              problem: "Lokálně funguje, deploy selhal 3×",
              solution: "TypeScript a ESLint přísnější v produkci",
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
          Klíčové zjištění: AI nezná kontext vašeho projektu automaticky — musíte ho popsat přesně
        </p>
      </div>
    ),
    right: (
      <TerminalPanel
        lines={[
          { type: "comment", text: "# Vercel build log — chyba č. 2" },
          { type: "blank", text: "" },
          { type: "cmd", text: "npm run build" },
          { type: "out", text: "▲ Next.js 14.2.29" },
          { type: "out", text: "  Linting and checking validity..." },
          { type: "blank", text: "" },
          { type: "err", text: "Failed to compile." },
          { type: "blank", text: "" },
          { type: "err", text: "./src/components/admin/RecipeForm.tsx" },
          {
            type: "err",
            text: "  6:19  Error: 'photoFile' is defined but never used",
          },
          { type: "err", text: "        @typescript-eslint/no-unused-vars" },
          { type: "blank", text: "" },
          { type: "err", text: "./src/app/admin/categories/page.tsx" },
          {
            type: "err",
            text: "  48:6  Error: React Hook useEffect has a missing",
          },
          {
            type: "err",
            text: "        dependency: 'load'. Either include it or",
          },
          {
            type: "err",
            text: "        remove the dependency array.",
          },
          { type: "err", text: "        react-hooks/exhaustive-deps" },
          { type: "blank", text: "" },
          { type: "err", text: "2 errors found." },
          { type: "blank", text: "" },
          { type: "out", text: "  → Lokálně vše fungovalo 🤔" },
          { type: "out", text: "  → Vercel má přísnější ESLint" },
        ]}
      />
    ),
    notes:
      "Všechno šlo hladce? Vůbec ne. Tři typy problémů. Za prvé: cyrilická URL — sdílela jsem odkaz na recept Муравейник a URL vypadalo hrozně. Za druhé: hodinu jsem psala recept v admin panelu, klikla jinam a vše zmizelo. To bolelo. Za třetí: Vercel deploy selhal třikrát za sebou — lokálně vše fungovalo, ale produkční build má přísnější pravidla. Každý problém jsem zkopírovala Claudovi a on ho opravil. Klíčové zjištění: čím přesnější popis problému, tím rychlejší řešení. Chybové hlášky jsou vaší nejlepší zbraní — nekopírujte jen část, kopírujte vše.",
  },

  /* 7 ─ API endpoint */
  {
    id: 7,
    title: "Vygenerování receptu přes API",
    content: (
      <div className="flex flex-col justify-center h-full gap-5">
        <h2 className="font-serif text-4xl text-charcoal">Jak jsem přidávala recepty</h2>
        <p className="text-charcoal/60 text-sm">
          Tři způsoby — žádný nevyžadoval ruční psaní do formuláře
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: "🔗",
              label: "URL odkaz",
              desc: "Poslala jsem link na recept a Claude načetl stránku, přeložil a uložil",
              color: "bg-peach/10",
            },
            {
              icon: "📸",
              label: "Screenshot",
              desc: "Vyfotila jsem stránku s receptem, vložila obrázek do Claude Code — přečetl ho",
              color: "bg-sand/60",
            },
            {
              icon: "🎙️",
              label: "Hlasové diktování",
              desc: "Diktovala jsem ingredience a kroky ústně — Claude je přepsal a zformátoval",
              color: "bg-sage/10",
            },
          ].map((m) => (
            <div key={m.label} className={cn("rounded-2xl p-5", m.color)}>
              <div className="text-3xl mb-3">{m.icon}</div>
              <p className="font-medium text-charcoal text-sm mb-2">{m.label}</p>
              <p className="text-xs text-charcoal/60 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-charcoal/5 rounded-xl p-4">
          <p className="text-xs text-charcoal/50 text-center mb-2 uppercase tracking-widest">A pak programaticky přes API</p>
          <p className="text-sm text-charcoal/70 text-center">
            POST na <code className="bg-charcoal/10 px-1.5 rounded text-xs">/api/admin/recipes</code> s JSON tělem →
            recept uložen v databázi za ~3 minuty
          </p>
        </div>
      </div>
    ),
    right: (
      <TerminalPanel
        lines={[
          { type: "comment", text: "# Claude fetches recipe from the web" },
          { type: "cmd", text: 'claude "Přidej recept муравейник z tohoto URL:"' },
          { type: "cmd", text: "  https://www.toprecepty.cz/recept/muraveynik" },
          { type: "blank", text: "" },
          { type: "out", text: "✓  Načítám stránku..." },
          { type: "out", text: "✓  Překládám do ruštiny..." },
          { type: "out", text: "✓  Formátuji ingredience..." },
          { type: "out", text: "✓  Vytvářím kroky receptu..." },
          { type: "blank", text: "" },
          { type: "out", text: "  POST /api/admin/recipes" },
          { type: "out", text: '  Authorization: Bearer sk-...' },
          { type: "out", text: "  Content-Type: application/json" },
          { type: "blank", text: "" },
          { type: "out", text: '  { "title": "Муравейник",' },
          { type: "out", text: '    "slug": "muraveynik",' },
          { type: "out", text: '    "categories": ["Десерт"],' },
          { type: "out", text: '    "steps": [ ... 6 kroků ... ]' },
          { type: "out", text: "  }" },
          { type: "blank", text: "" },
          { type: "out", text: "✓  201 Created" },
          { type: "out", text: "✓  Recept uložen do databáze" },
          { type: "out", text: "✓  Hotovo za 3 minuty 🎉" },
        ]}
      />
    ),
    notes:
      "Toto je moment, který mě opravdu překvapil. Recept Муравейник jsem přidala třemi různými způsoby a všechny fungovaly. Poslala jsem URL z českého webu — Claude stránku načetl, přeložil do ruštiny a uložil. Pak jsem zkusila vložit screenshot adminpanelu s poznámkou co chci doplnit — přečetl obrázek a pochopil. A nakonec jsem ingredience jednoduše nadiktovala ústně. Všechny tři způsoby vedly ke stejnému výsledku. Pro vás to znamená: nemusíte umět psát JSON ani SQL. Stačí říct nebo ukázat, co chcete.",
  },

  /* 8 ─ Bezpečnost */
  {
    id: 8,
    title: "Bezpečnost a .env soubory",
    content: (
      <div className="flex flex-col justify-center h-full gap-5">
        <h2 className="font-serif text-4xl text-charcoal">Kde jsou klíče?</h2>
        <p className="text-charcoal/60 text-sm">Supabase vs Vercel — co kam patří</p>

        {/* Hlavní rozdělení */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-sage/10 border border-sage/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🗄️</span>
              <p className="font-medium text-charcoal text-sm">Supabase</p>
              <span className="ml-auto text-xs bg-sage/20 text-sage px-2 py-0.5 rounded-full">data</span>
            </div>
            <ul className="space-y-1.5 text-xs text-charcoal/65">
              <li className="flex gap-2"><span className="text-sage">✓</span>Recepty, kroky, fotky</li>
              <li className="flex gap-2"><span className="text-sage">✓</span>Uživatelé, oblíbené, poznámky</li>
              <li className="flex gap-2"><span className="text-sage">✓</span>Přihlašování (Auth)</li>
              <li className="flex gap-2 mt-2 pt-2 border-t border-sage/20"><span className="text-red-400">✗</span><span className="text-charcoal/40">API klíče zde nejsou!</span></li>
            </ul>
          </div>

          <div className="bg-peach/10 border border-peach/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">▲</span>
              <p className="font-medium text-charcoal text-sm">Vercel</p>
              <span className="ml-auto text-xs bg-peach/20 text-peach px-2 py-0.5 rounded-full">klíče</span>
            </div>
            <ul className="space-y-1.5 text-xs text-charcoal/65">
              <li className="flex gap-2"><span className="text-peach">✓</span>SUPABASE_URL</li>
              <li className="flex gap-2"><span className="text-peach">✓</span>SUPABASE_ANON_KEY</li>
              <li className="flex gap-2"><span className="text-peach">✓</span>SUPABASE_SERVICE_ROLE_KEY</li>
              <li className="flex gap-2"><span className="text-peach">✓</span>GOOGLE_TRANSLATE_API_KEY</li>
            </ul>
            <p className="text-[10px] text-charcoal/35 mt-3">Settings → Environment Variables</p>
          </div>
        </div>

        {/* Lokálně */}
        <div className="bg-charcoal/5 rounded-xl p-4 flex items-center gap-4">
          <span className="text-2xl shrink-0">💻</span>
          <div>
            <p className="text-sm font-medium text-charcoal">Lokálně (na mém počítači)</p>
            <p className="text-xs text-charcoal/55 mt-0.5">
              Soubor <code className="bg-charcoal/10 px-1 rounded">.env.local</code> — stejné klíče jako na Vercelu, ale jen u mě. Nikdy na GitHub!
            </p>
          </div>
        </div>

        <div className="bg-red-50 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <p className="text-xs text-red-500">GitHub je veřejný — botové prohledávají commity a kradou klíče během minut</p>
        </div>
      </div>
    ),
    right: (
      <CodePanel
        title=".env.local  →  Vercel Environment Variables"
        lang="dotenv"
        lines={[
          { text: "# ── LOKÁLNĚ: soubor .env.local ──────────" },
          { text: "# (přidán do .gitignore, nikdy na GitHub!)" },
          { text: "" },
          { text: "# Supabase — DB, přihlašování, storage" },
          { text: "NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co", highlight: true },
          { text: "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...", highlight: true },
          { text: "SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...", dim: true },
          { text: "  # ↑ pouze na serveru, NIKDY na frontend!" },
          { text: "" },
          { text: "# Google Translate API — překlad receptů" },
          { text: "GOOGLE_TRANSLATE_API_KEY=AIzaSyD...", highlight: true },
          { text: "  # ↑ stálo mě celkem ~0,26 Kč 😄" },
          { text: "" },
          { text: "# ── PRODUKCE: Vercel Dashboard ──────────" },
          { text: "# Settings → Environment Variables" },
          { text: "# Stejné klíče, přidané ručně v UI" },
          { text: "" },
          { text: "# ── KDE KLÍČE NEJSOU ────────────────────" },
          { text: "# ✗ Supabase DB — tam jsou jen data receptů" },
          { text: "# ✗ GitHub — .gitignore to zabraňuje" },
          { text: "# ✗ V kódu napevno — nikdy!" },
          { text: "" },
          { text: "# Pravidlo: klíče = .env.local + Vercel" },
          { text: "# Data = Supabase PostgreSQL" },
        ]}
      />
    ),
    notes:
      "Tohle je otázka, která mátla i mě: kde jsou klíče — v Supabase nebo ve Vercelu? Odpověď je jednoduchá. Supabase je databáze — tam jsou recepty, uživatelé, fotky. Žádné API klíče. Vercel je hosting — a tam v nastavení pod 'Environment Variables' jsou všechny klíče: Supabase URL, Supabase klíče, Google Translate API klíč. Lokálně mám ten samý seznam v souboru .env.local, který je schovaný v .gitignore, takže nikdy nejde na GitHub. Pravidlo: klíče = Vercel. Data = Supabase. Nikdy neplést.",
  },

  /* 9 ─ Refaktoring */
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
              AI platíte za zpracovaný text — vstupy i výstupy. Čím větší kontext (starý kód, dlouhé
              soubory), tím více tokenů spotřebujete.
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-300 shrink-0" />
                <p className="text-xs text-charcoal/60">
                  Velký soubor s mrtvým kódem = zbytečné tokeny
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-sage shrink-0" />
                <p className="text-xs text-charcoal/60">
                  Čisté, modulární soubory = AI snáz pochopí
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="bg-peach/10 rounded-2xl p-4 text-center">
              <p className="font-handwritten text-3xl text-peach mb-1">~30</p>
              <p className="text-xs text-charcoal/40">mock receptů pro vývoj</p>
            </div>
            <div className="bg-sage/10 rounded-2xl p-4 text-center">
              <p className="font-handwritten text-3xl text-sage mb-1">3</p>
              <p className="text-xs text-charcoal/40">reálné recepty</p>
            </div>
          </div>
        </div>
        <div className="bg-charcoal/5 rounded-xl p-4">
          <p className="text-sm text-charcoal/60 text-center">
            💡 Refaktoring = investice do budoucích tokenů
          </p>
        </div>
      </div>
    ),
    right: (
      <CodePanel
        title="toSlug.ts — před a po refaktoringu"
        lang="TypeScript"
        lines={[
          { text: "// ❌ PŘED — nefungovalo pro cyrilici" },
          { text: "" },
          { text: "export function toSlug(title: string) {" },
          {
            text: "  return title",
            dim: true,
          },
          {
            text: "    .toLowerCase()",
            dim: true,
          },
          {
            text: "    .replace(/\\s+/g, '-')",
            dim: true,
          },
          { text: "    .replace(/[^a-z0-9-]/g, '')", dim: true },
          { text: "}", dim: true },
          { text: "" },
          { text: "// Výsledek: /рецепты/муравейник ← nefunguje!" },
          { text: "" },
          { text: "// ✓ PO — s transliterací" },
          { text: "" },
          {
            text: "const MAP: Record<string, string> = {",
            highlight: true,
          },
          { text: "  а:'a', б:'b', в:'v', г:'g',", highlight: true },
          { text: "  ш:'sh', щ:'shch', ч:'ch',", highlight: true },
          { text: "  ж:'zh', ц:'ts', х:'kh',", highlight: true },
          { text: "  // ... 33 znaků celkem", highlight: true },
          { text: "}", highlight: true },
          { text: "" },
          { text: "export function toSlug(title: string) {" },
          { text: "  return title.toLowerCase()" },
          { text: "    .split('')" },
          { text: "    .map(ch => MAP[ch] ?? ch)" },
          { text: "    .join('')" },
          { text: "    .replace(/[^a-z0-9\\s-]/g, '')" },
          { text: "    .replace(/\\s+/g, '-');" },
          { text: "}" },
          { text: "" },
          { text: "// ✓ /recipes/muraveynik" },
        ]}
      />
    ),
    notes:
      "Tokeny jsou jako minuty telefonního tarifu — platíte za každé slovo, které AI přečte i napíše. Čím větší a chaotičtější soubory, tím více platíte. Proto se vyplatí kód čistit. Konkrétní příklad napravo: funkce pro generování URL z ruského názvu receptu. Původní verze nefungovala — URL obsahovala Cyrilici. Nová verze má mapu 33 znaků a funguje perfektně. Tohle je refaktoring, který se vyplatí: čistší kód, méně tokenů při dalších úpravách, a hlavně — kód, kterému rozumíte i za půl roku.",
  },

  /* 10 ─ Přepínání modelů */
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
            V Claude Code:{" "}
            <code className="bg-charcoal/10 px-2 py-0.5 rounded text-xs">/model</code> pro změnu
            modelu uprostřed konverzace
          </p>
        </div>
      </div>
    ),
    right: (
      <TerminalPanel
        lines={[
          { type: "comment", text: "# Přepínání modelu v Claude Code" },
          { type: "blank", text: "" },
          { type: "cmd", text: "/model" },
          { type: "blank", text: "" },
          { type: "out", text: "  Aktuální model: claude-sonnet-4-5" },
          { type: "blank", text: "" },
          { type: "out", text: "  Dostupné modely:" },
          { type: "out", text: "  ┌────────────────────────────────┐" },
          { type: "out", text: "  │ 1. claude-opus-4      🧠 silný │" },
          { type: "out", text: "  │ 2. claude-sonnet-4-5  ⚡ rychlý│" },
          { type: "out", text: "  │ 3. claude-haiku-4     🪶 levný │" },
          { type: "out", text: "  └────────────────────────────────┘" },
          { type: "blank", text: "" },
          { type: "cmd", text: "1" },
          { type: "out", text: "  ✓ Přepnuto na claude-opus-4" },
          { type: "blank", text: "" },
          { type: "comment", text: "# Teď pro složitý debugging" },
          { type: "cmd", text: "Proč se useEffect spouští donekonečna?" },
          { type: "out", text: "  [Opus analyzuje kód...]" },
          { type: "out", text: "  Problém je v závislostním poli." },
          { type: "out", text: "  Funkce 'load' se mění každý render." },
          { type: "out", text: "  Řešení: useCallback..." },
          { type: "blank", text: "" },
          { type: "comment", text: "# Hotovo, zpět na Sonnet" },
          { type: "cmd", text: "/model 2" },
          { type: "out", text: "  ✓ Přepnuto na claude-sonnet-4-5" },
        ]}
      />
    ),
    notes:
      "Claude Code má tři modely a přepínáte je příkazem /model uprostřed konverzace. Opus je jako seniorní architekt — pomalý, drahý, ale zachrání vás při těžkém debugging. Sonnet je váš každodenní kolega — vyvážený výkon a cena, používám ho 90 % času. Haiku je junior pro rutinu — přejmenovat soubor, opravit překlep. Tip: začněte se Sonnetem, na Opus přejděte jen když opravdu nevíte co dál. Ušetříte peníze a čas.",
  },

  /* 11 ─ Over-engineering */
  {
    id: 11,
    title: "Přehnané inženýrství: past pro začátečníky",
    content: (
      <div className="flex flex-col justify-center h-full gap-6">
        <h2 className="font-serif text-4xl text-charcoal">Over-engineering</h2>
        <p className="text-charcoal/60">Největší past při práci s AI</p>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-sm text-charcoal/70 leading-relaxed">
                AI je ochoten postavit cokoli. Zeptejte se na &ldquo;systém pro správu receptů&rdquo; a
                dostanete mikroservisy, Redis cache a GraphQL.
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
          <div className="bg-sage/10 rounded-xl p-5 flex-1">
            <p className="text-xs uppercase tracking-widest text-charcoal/40 mb-3">Jak se bránit</p>
            <ul className="space-y-3 text-sm text-charcoal/70">
              <li className="flex gap-2">
                <span className="text-sage shrink-0">✦</span>
                <span>Specifikujte scale: &ldquo;osobní web, max 100 receptů&rdquo;</span>
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
    ),
    right: (
      <ChatPanel
        messages={[
          {
            role: "user",
            text: "Potřebuji ukládat recepty do databáze. Co použít?",
          },
          {
            role: "claude",
            text: (
              <div className="space-y-2">
                <p>Pro robustní řešení doporučuji:</p>
                <ul className="text-[11px] space-y-0.5 text-white/60">
                  <li>• PostgreSQL s Prisma ORM</li>
                  <li>• Redis pro cache oblíbených receptů</li>
                  <li>• GraphQL API s Apollo Server</li>
                  <li>• Docker Compose pro lokální vývoj</li>
                  <li>• Kubernetes pro produkci</li>
                </ul>
              </div>
            ),
          },
          {
            role: "user",
            text: "Hmm, je to osobní kuchařka pro max 50 receptů. Mám free hosting. Tohle je moc?",
          },
          {
            role: "claude",
            text: (
              <div className="space-y-2">
                <p className="text-yellow-300">Ano, to bylo zbytečně složité! 😅 Omlouvám se.</p>
                <p>Pro 50 receptů na free hostingu je ideální:</p>
                <ul className="text-[11px] space-y-0.5 text-green-300">
                  <li>✓ Supabase (PostgreSQL + API zdarma)</li>
                  <li>✓ Přímé Supabase klientské dotazy</li>
                  <li>✓ Žádný Redis, žádný Docker</li>
                  <li>✓ Vercel free tier na hosting</li>
                </ul>
                <p className="text-white/50 text-[10px]">Pravidlo: vždy řekněte AI rozsah projektu!</p>
              </div>
            ),
          },
        ]}
      />
    ),
    notes:
      "Největší past, do které jsem spadla: AI je tak schopný, že navrhne víc, než potřebujete. Zeptala jsem se na databázi pro recepty a Claude navrhoval Redis cache a GraphQL API. Pro osobní kuchařku s třemi recepty! Naučila jsem se přidávat kontext: 'osobní projekt, free tier, max 100 receptů, žádný tým'. To zásadně mění výsledek. Pamatujte si zkratku YAGNI — You Aren't Gonna Need It. MVP nejdřív, složitost přidejte až když ji opravdu potřebujete.",
  },

  /* 12 ─ Co web umí */
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
              items: [
                "Prohlížení receptů",
                "Vyhledávání a filtrování",
                "Detail receptu s kroky",
                "Přepínání jazyků (RU/EN)",
              ],
              color: "bg-sand/60",
            },
            {
              category: "Pro přihlášené",
              items: ["Ukládání oblíbených", "Osobní poznámky", "Vlastní dashboard"],
              color: "bg-peach/10",
            },
            {
              category: "Admin panel",
              items: [
                "Přidávání receptů (UI + API)",
                "Správa kategorií",
                "Správa kroků + fotek",
                "Draft auto-save",
              ],
              color: "bg-sage/10",
            },
          ].map((cat) => (
            <div key={cat.category} className={cn("rounded-2xl p-5", cat.color)}>
              <p className="text-xs uppercase tracking-widest text-charcoal/40 mb-3">
                {cat.category}
              </p>
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
            { label: "Deploy čas", value: "~1 min" },
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
    right: <IframePanel src="/recipes" />,
    notes:
      "Takže co web nakonec umí? Napravo vidíte živý katalog receptů — vyhledávání, filtry, detail s kroky a fotografiemi. Přihlašování, oblíbené recepty, osobní poznámky. Admin panel kde přidávám recepty třemi způsoby. Dvě jazykové verze. A deploy trvá méně než minutu — pushnu na GitHub a za 60 vteřin je změna živá po celém světě. Hosting: 0 Kč. Databáze: 0 Kč. Celé postaveno za víkend, bez týmu, bez předchozích zkušeností s backendem.",
  },

  /* 13 ─ Roadmapa */
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
              {
                label: "AI generování receptů",
                desc: "Claude API: 'vygeneruj recept s 30g proteinu'",
              },
              {
                label: "Vlastní kuchařky uživatelů",
                desc: "Každý uživatel má svou sbírku",
              },
              { label: "PWA / mobilní app", desc: "Offline přístup k receptům" },
              {
                label: "Sezónní doporučení",
                desc: "Co vařit teď, podle sezóny",
              },
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
              &ldquo;Nejdůležitější věc?&rdquo;
            </p>
            <p className="text-charcoal/70 text-sm leading-relaxed">
              Technologie přestala být bariérou. Mám nápad → popíšu ho → AI pomůže ho realizovat.
            </p>
            <p className="text-xs text-charcoal/40 italic">
              Product thinking &gt; coding skills (v éře AI)
            </p>
          </div>
        </div>
      </div>
    ),
    right: (
      <ChatPanel
        messages={[
          {
            role: "user",
            text: "Příští feature: AI generování receptů. Uživatel napíše 'chci recept s 30g proteinu' a web vygeneruje recept pomocí Claude API.",
          },
          {
            role: "claude",
            text: (
              <div className="space-y-2">
                <p>Skvělý nápad! Plán implementace:</p>
                <ol className="text-[11px] space-y-1 text-white/70 list-decimal list-inside">
                  <li>API route <code className="text-green-300">/api/generate-recipe</code></li>
                  <li>Volání Anthropic SDK na serveru</li>
                  <li>Structured output: JSON s kroky</li>
                  <li>UI: chat-like input na /recipes</li>
                  <li>Uložení výsledku do Supabase</li>
                </ol>
                <div className="bg-white/5 rounded p-2 font-mono text-[10px] text-green-300">
                  {`const client = new Anthropic();\nconst msg = await client.messages.create({\n  model: "claude-opus-4",\n  messages: [{\n    role: "user",\n    content: prompt\n  }]\n});`}
                </div>
              </div>
            ),
          },
          {
            role: "user",
            text: "Perfektní. Odhadni kolik to bude stát na tokenech?",
          },
          {
            role: "claude",
            text: "Pro jeden recept cca 500-800 tokenů = ~$0.002. Při 100 generacích/měsíc = ~$0.20. Prakticky zadarmo! 🎉",
          },
        ]}
      />
    ),
    notes:
      "Co bude dál? Hlavní plán je AI generování receptů přímo ve webu — napíšete 'chci proteinovou snídani do 10 minut' a web vygeneruje recept pomocí Claude API. To je přirozené využití AI v produktu. Ale nejdůležitější věc, co jsem se naučila: technologie přestala být bariérou. Dřív jsem říkala 'tohle neumím'. Teď říkám 'jak to popíšu Claudovi'. To je zásadní změna myšlení, která je dostupná každému z vás.",
  },

  /* 14 ─ Díky */
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
          <p>Kód na GitHubu · Hostováno na Vercel · Databáze Supabase</p>
          <p className="font-handwritten text-xl text-peach">Otázky? Ptejte se! 🙋</p>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-xs">
          {[
            { q: "Kolik to stálo?", a: "Čas + 0 Kč infrastruktura" },
            { q: "Jak dlouho?", a: "Víkend + pár večerů" },
            { q: "Kdo to může zkusit?", a: "Kdokoliv s nápadem" },
          ].map((item) => (
            <div key={item.q} className="bg-sand/50 rounded-xl p-4">
              <p className="font-medium text-charcoal/70 mb-1">{item.q}</p>
              <p className="text-charcoal/45">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    ),
    right: <IframePanel src="/" />,
    notes:
      "Díky za pozornost! Otázky? Ptejte se na cokoliv — na konkrétní nástroje, na náklady, na problémy. Nejčastější otázka, kterou dostávám: musím umět programovat? Odpověď: trochu pomáhá, ale není to podmínka. Důležitější je logické myšlení a schopnost přesně popsat, co chcete. To jsou skills, které máte všichni. AI demokratizuje vývoj softwaru — a to je teprve začátek.",
  },
];

/* ─── Presentation component ─────────────────────────────────────── */

export default function PresentationPage() {
  const [current, setCurrent] = useState(0);
  const [showNotes, setShowNotes] = useState(false);

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
        {/* Left: slide */}
        <div className="flex flex-col w-1/2 bg-cream overflow-hidden">
          <div className="flex-1 overflow-y-auto p-10">{slide.content}</div>

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

        {/* Right: unique visual per slide */}
        <div className="w-1/2 overflow-hidden border-l border-white/5">{slide.right}</div>
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
