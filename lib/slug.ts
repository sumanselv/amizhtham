/**
 * Turn a title or tag name into an English URL slug (a-z, 0-9 and hyphens).
 * Letters from other scripts (e.g. Tamil) are dropped, so URLs always stay in English.
 * Returns "" when nothing English is left.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Short random code (a-z, 0-9) used when a Tamil title or tag has no English URL name. */
export function randomCode(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return [...bytes].map((b) => (b % 36).toString(36)).join("");
}

/** "ta" when the text contains Tamil letters, otherwise "en". Used for the HTML lang attribute. */
export function langOf(text: string): "ta" | "en" {
  return /[\u0B80-\u0BFF]/.test(text) ? "ta" : "en";
}

/** Route params may arrive percent-encoded; decode safely. */
export function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ta-IN", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Kolkata" });
}

export interface TagInput {
  name: string;
  /** English URL name for the tag, if the admin typed one ("நெல்லிக்காய் | amla"). */
  slug?: string;
}

/**
 * Parse "Amla, நெல்லிக்காய் | amla, Honey" into unique tags (max 8).
 * A tag can be written in any language; "name | english-url" sets its English address.
 */
export function parseTagInput(raw: string): TagInput[] {
  const seen = new Set<string>();
  const out: TagInput[] = [];
  for (const part of raw.split(",")) {
    const [namePart, ...rest] = part.split("|");
    const name = (namePart ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    const slug = rest.length ? slugify(rest.join("|")) : "";
    out.push(slug ? { name, slug } : { name });
    if (out.length >= 8) break;
  }
  return out;
}
