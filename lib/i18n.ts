import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "./db";
import { getEnv } from "./env";
import { langOf } from "./slug";
import type { Post, PostWithTags, Tag } from "./db";

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

/** The visitor's language: their saved choice (language menu), otherwise Tamil, the site's primary language. */
export const getLang = cache(async (): Promise<string> => {
  try {
    const saved = (await cookies()).get(LANG_COOKIE)?.value;
    if (isLang(saved)) return saved;
  } catch {
    /* no cookies available (e.g. during a static build) */
  }
  return SOURCE_LANG;
});

/* ------------------------------ translation ------------------------------ */

const MODEL = "@cf/meta/m2m100-1.2b";
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
export async function translateMany(lang: string, texts: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const todo = [...new Set(texts.map((t) => t.trim()).filter((t) => t && HAS_LETTER.test(t) && langOf(t) !== lang))];
  if (todo.length === 0) return out;

  try {
    const d1 = await db();
    const keyed = await Promise.all(todo.map(async (t) => ({ text: t, key: `${lang}:${await hash(t)}` })));

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
    const batch = missing.slice(0, Math.max(0, MAX_NEW_PER_REQUEST - b.used));
    b.used += batch.length;
    const fresh: { key: string; text: string; from: string }[] = [];
    let next = 0;
    const worker = async () => {
      while (next < batch.length) {
        const k = batch[next++];
        try {
          const res = (await ai.run(MODEL, {
            text: k.text.slice(0, MAX_TEXT),
            source_lang: langOf(k.text),
            target_lang: lang,
          })) as { translated_text?: string } | null;
          const translated = res?.translated_text?.trim();
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

function tagTexts(tags: Tag[]): string[] {
  return tags.map((t) => t.name);
}

function withTags(tags: Tag[], map: Map<string, string>): Tag[] {
  return tags.map((t) => ({ ...t, name: pick(map, t.name) }));
}

export async function localizeTags(lang: string, tags: Tag[]): Promise<Tag[]> {
  const map = await translateMany(lang, tagTexts(tags));
  return withTags(tags, map);
}

export async function localizePosts(lang: string, posts: PostWithTags[]): Promise<PostWithTags[]> {
  const map = await translateMany(
    lang,
    posts.flatMap((p) => [p.title, p.description, ...tagTexts(p.tags)]),
  );
  return posts.map((p) => ({ ...p, title: pick(map, p.title), description: pick(map, p.description), tags: withTags(p.tags, map) }));
}

/** Full post including its body (only used on the post page). */
export async function localizePost(lang: string, post: PostWithTags): Promise<PostWithTags> {
  const lines = splitLines(post.content).map((l) => l.body);
  const map = await translateMany(lang, [post.title, post.description, ...tagTexts(post.tags), ...lines]);
  return {
    ...post,
    title: pick(map, post.title),
    description: pick(map, post.description),
    content: await translateMarkdown(lang, post.content, map),
    tags: withTags(post.tags, map),
  };
}

export type { Post };
