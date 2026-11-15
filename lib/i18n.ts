import { cookies, headers } from "next/headers";
import { cache } from "react";
import { db, isPlaceholderSlug } from "./db";
import { getEnv } from "./env";
import { AUTHOR_SECTION, BOOK_SECTION, langOf } from "./slug";
import type { Post, PostWithTags, Tag } from "./db";
import type { AiLike } from "./env";

export interface Language {
  code: string;
  /** Name written in its own language. */
  name: string;
  /** Locale used to format dates. */
  locale: string;
}

/** The site is written in Tamil; every other language is machine-translated and cached. */
export const SOURCE_LANG = "ta";

export const LANGUAGES: Language[] = [
  { code: "ta", name: "தமிழ்", locale: "ta-IN" },
  { code: "en", name: "English", locale: "en-IN" },
  { code: "hi", name: "हिन्दी", locale: "hi-IN" },
  { code: "te", name: "తెలుగు", locale: "te-IN" },
  { code: "kn", name: "ಕನ್ನಡ", locale: "kn-IN" },
  { code: "ml", name: "മലയാളം", locale: "ml-IN" },
  { code: "bn", name: "বাংলা", locale: "bn-IN" },
  { code: "mr", name: "मराठी", locale: "mr-IN" },
  { code: "gu", name: "ગુજરાતી", locale: "gu-IN" },
];

export const LANG_COOKIE = "lang";

export function isLang(code: string | undefined | null): code is string {
  return !!code && LANGUAGES.some((l) => l.code === code);
}

export function languageOf(code: string): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

/** Request header set by the middleware for addresses that start with /en (English pages). */
export const LANG_HEADER = "x-site-lang";

/** The page language: English for /en/... addresses, otherwise the visitor's saved choice (language menu), otherwise Tamil, the site's primary language. */
export const getLang = cache(async (): Promise<string> => {
  try {
    const forced = (await headers()).get(LANG_HEADER);
    if (isLang(forced)) return forced;
  } catch {
    /* no request headers available */
  }
  try {
    const saved = (await cookies()).get(LANG_COOKIE)?.value;
    if (isLang(saved)) return saved;
  } catch {
    /* no cookies available (e.g. during a static build) */
  }
  return SOURCE_LANG;
});

/** Address prefix for a language: English pages live under /en, Tamil (the default) has none. */
export function prefixFor(lang: string): string {
  return lang === "en" ? "/en" : "";
}

/** Prefix to put in front of internal links on the current page ("/en" or ""). */
export async function getPrefix(): Promise<string> {
  return prefixFor(await getLang());
}

/** Put the language prefix in front of an internal path ("/" becomes "/en"). */
export function withPrefix(prefix: string, path: string): string {
  if (!prefix) return path;
  return path === "/" ? prefix : prefix + path;
}

/* ------------------------------ translation ------------------------------ */

/** Gemma 4 with thinking switched off: accurate for Tamil and other Indian languages, ~0.5 s per text. (The earlier m2m100 model gave poor results.) */
const MODEL = "@cf/google/gemma-4-26b-a4b-it";
/** Bump when the model or prompt changes, so older saved translations are ignored. */
const CACHE_VERSION = "v2";
const AI_TIMEOUT_MS = 25_000;

const LANG_NAMES: Record<string, string> = {
  ta: "Tamil",
  en: "English",
  hi: "Hindi",
  te: "Telugu",
  kn: "Kannada",
  ml: "Malayalam",
  bn: "Bengali",
  mr: "Marathi",
  gu: "Gujarati",
};

/** Clean up a model answer and reject anything that looks like nonsense (empty, runaway repetition, absurd length). */
export function cleanTranslation(source: string, raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let t = raw.trim();
  t = t.replace(/^(translation|translated text)\s*:\s*/i, "").replace(/^["“”'‘’]+|["“”'‘’]+$/g, "").trim();
  if (!source.includes("\n") && t.includes("\n")) t = t.split("\n").find((l) => l.trim())?.trim() ?? "";
  if (!t) return null;
  if (/(\S+)(\s+\1){3,}/u.test(t)) return null; // "Issue Issue Issue Issue"
  if (source.length > 12) {
    const ratio = t.length / source.length;
    if (ratio < 0.25 || ratio > 6) return null;
  }
  return t;
}

async function translateOne(ai: AiLike, text: string, from: string, to: string): Promise<string | null> {
  const target = LANG_NAMES[to] ?? to;
  const system =
    `You are a professional translator for a traditional home-remedy website (Tamil, Siddha and Ayurvedic folk remedies). ` +
    `Translate the user's ${LANG_NAMES[from] ?? from} text into natural ${target}. ` +
    `Translate faithfully; do not add, explain or comment. Keep plant, herb, spice and ingredient names accurate, using the common ${target} name. ` +
    `Keep numbers, brackets and punctuation. A short word or name stays short. Output ONLY the translation.`;
  const call = ai.run(MODEL, {
    messages: [
      { role: "system", content: system },
      { role: "user", content: text.slice(0, MAX_TEXT) },
    ],
    max_tokens: 1500,
    temperature: 0.1,
    chat_template_kwargs: { enable_thinking: false },
  });
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("translation timed out")), AI_TIMEOUT_MS));
  const res = (await Promise.race([call, timeout])) as {
    response?: string;
    choices?: { message?: { content?: string | null } }[];
  } | null;
  return cleanTranslation(text, res?.choices?.[0]?.message?.content ?? res?.response);
}
/** At most this many new (uncached) translations per page view; the rest show in the original language and fill in on the next visit. */
const MAX_NEW_PER_REQUEST = 30;
const CONCURRENCY = 6;
const MAX_TEXT = 1200;

const budget = cache(() => ({ used: 0 }));

async function hash(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf).slice(0, 16)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const HAS_LETTER = /\p{L}/u;

/** Translate many texts into `lang`. Returns a map from the original text to its translation (missing = keep original). */
export async function translateMany(lang: string, texts: string[], opts: { limit?: number } = {}): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const todo = [...new Set(texts.map((t) => t.trim()).filter((t) => t && HAS_LETTER.test(t) && langOf(t) !== lang))];
  if (todo.length === 0) return out;

  try {
    const d1 = await db();
    const keyed = await Promise.all(todo.map(async (t) => ({ text: t, key: `${CACHE_VERSION}:${lang}:${await hash(t)}` })));

    // 1) Cached translations, looked up in a few batched queries.
    const found = new Map<string, string>();
    for (let i = 0; i < keyed.length; i += 80) {
      const chunk = keyed.slice(i, i + 80);
      const rows = await d1
        .prepare(`SELECT key, text FROM translations WHERE key IN (${chunk.map(() => "?").join(",")})`)
        .bind(...chunk.map((k) => k.key))
        .all<{ key: string; text: string }>();
      for (const r of rows.results) found.set(r.key, r.text);
    }
    const missing: typeof keyed = [];
    for (const k of keyed) {
      const hit = found.get(k.key);
      if (hit) out.set(k.text, hit);
      else missing.push(k);
    }

    // 2) Translate what is missing with Workers AI, then cache it.
    const ai = getEnv().AI;
    if (!ai || missing.length === 0) return out;
    const b = budget();
    const batch = missing.slice(0, Math.max(0, (opts.limit ?? MAX_NEW_PER_REQUEST) - (opts.limit ? 0 : b.used)));
    if (!opts.limit) b.used += batch.length;
    const fresh: { key: string; text: string; from: string }[] = [];
    let next = 0;
    const worker = async () => {
      while (next < batch.length) {
        const k = batch[next++];
        try {
          const translated = await translateOne(ai, k.text, langOf(k.text), lang);
          if (translated) {
            out.set(k.text, translated);
            fresh.push({ key: k.key, text: translated, from: k.text });
          }
        } catch {
          /* leave this one in its original language */
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batch.length) }, worker));
    if (fresh.length > 0) {
      await d1.batch(
        fresh.map((f) => d1.prepare("INSERT OR REPLACE INTO translations (key, text) VALUES (?, ?)").bind(f.key, f.text)),
      );
    }
  } catch {
    /* translation is best-effort: show the original text */
  }
  return out;
}

function pick(map: Map<string, string>, text: string): string {
  return map.get(text.trim()) ?? text;
}

/* ------------------------------ page content ------------------------------ */

const LINE_PREFIX = /^(\s*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+|>\s*))?([\s\S]*)$/;

interface Line {
  prefix: string;
  body: string;
}

function splitLines(markdown: string): Line[] {
  return markdown
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((raw) => {
      const m = LINE_PREFIX.exec(raw)!;
      return { prefix: m[1] ?? "", body: m[2] };
    });
}

function count(s: string, needle: string): number {
  return s.split(needle).length - 1;
}

/** Translate a Markdown post line by line, keeping headings, lists and quotes intact. */
async function translateMarkdown(lang: string, markdown: string, map: Map<string, string>): Promise<string> {
  return splitLines(markdown)
    .map(({ prefix, body }) => {
      const tr = map.get(body.trim());
      if (!tr || !body.trim()) return prefix + body;
      if (count(tr, "](") !== count(body, "](")) return prefix + body; // never break a link
      const safe = count(tr, "**") === count(body, "**") ? tr : tr.replace(/\*\*/g, "");
      return prefix + safe;
    })
    .join("\n");
}

/** Tag names that need machine translation (English tags with an English address are named from the address instead). */
function tagTexts(tags: Tag[], lang: string): string[] {
  return tags.filter((t) => !isNameKept(t) && !(lang === "en" && langOf(t.name) !== "en" && englishNameFromSlug(t))).map((t) => t.name);
}

/** English display name for a tag written in another script: taken from its English web address (scutch-grass -> "Scutch grass"), which the admin controls. */
function englishNameFromSlug(tag: Tag): string | null {
  if (isPlaceholderSlug(tag.slug) || !/^[a-z0-9-]+$/.test(tag.slug)) return null;
  const words = tag.slug.replace(/-+/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : null;
}

/** Author and book names are shown as written (like poet names), never machine-translated. */
function isNameKept(tag: Tag): boolean {
  return tag.section === AUTHOR_SECTION || tag.section === BOOK_SECTION;
}

function withTags(tags: Tag[], map: Map<string, string>, lang: string): Tag[] {
  return tags.map((t) => {
    if (lang === "en" && langOf(t.name) !== "en") {
      const fromSlug = englishNameFromSlug(t);
      if (fromSlug) return { ...t, name: fromSlug };
    }
    return isNameKept(t) ? t : { ...t, name: pick(map, t.name) };
  });
}

export async function localizeTags(lang: string, tags: Tag[]): Promise<Tag[]> {
  const map = await translateMany(lang, tagTexts(tags, lang));
  return withTags(tags, map, lang);
}

export async function localizePosts(lang: string, posts: PostWithTags[]): Promise<PostWithTags[]> {
  const map = await translateMany(
    lang,
    posts.flatMap((p) => [p.title, p.description, ...tagTexts(p.tags, lang)]),
  );
  return posts.map((p) => ({ ...p, title: pick(map, p.title), description: pick(map, p.description), tags: withTags(p.tags, map, lang) }));
}

/** Full post including its body (only used on the post page). */
export async function localizePost(lang: string, post: PostWithTags): Promise<PostWithTags & { untranslated: number }> {
  const lines = splitLines(post.content).map((l) => l.body);
  const noteLines = post.poem_note.split("\n");
  // The poem and the poet's name are NOT translated; only the explanation of the poem is.
  const map = await translateMany(lang, [post.title, post.description, ...tagTexts(post.tags, lang), ...lines, ...noteLines]);
  const untranslated = [post.title, post.description, ...lines, ...noteLines].filter(
    (t) => t.trim() && HAS_LETTER.test(t) && langOf(t) !== lang && !map.has(t.trim()),
  ).length;
  return {
    ...post,
    untranslated,
    title: pick(map, post.title),
    description: pick(map, post.description),
    content: await translateMarkdown(lang, post.content, map),
    poem_note: noteLines.map((l) => pick(map, l)).join("\n"),
    tags: withTags(post.tags, map, lang),
  };
}

export type { Post };

/** Translate every text of a post into `lang` right now (used when publishing, so the English page is complete before search engines see it). Returns how many texts are still missing. */
export async function warmPost(lang: string, post: PostWithTags): Promise<number> {
  if (lang === SOURCE_LANG) return 0;
  const texts = [post.title, post.description, ...tagTexts(post.tags, lang), ...splitLines(post.content).map((l) => l.body), ...post.poem_note.split("\n")];
  const map = await translateMany(lang, texts, { limit: 40 });
  return texts.filter((t) => t.trim() && HAS_LETTER.test(t) && langOf(t) !== lang && !map.has(t.trim())).length;
}
