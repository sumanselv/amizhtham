import { prefixFor, withPrefix } from "./i18n";

/** The one public address of the site (everything else redirects here). */
export const SITE_URL = "https://www.amizhtham.org";

/** Public URL of a page in a language. `path` is the Tamil/default address, e.g. "/remedy/amla" or "/". */
export function pageUrl(lang: "ta" | "en", path: string, query = ""): string {
  const p = withPrefix(prefixFor(lang), path);
  return `${SITE_URL}${p}${query}`;
}

/** canonical + hreflang alternates for a page. `lang` is the language of the page being rendered. */
export function alternatesFor(lang: string, path: string, query = "") {
  const self = lang === "en" ? "en" : "ta";
  return {
    canonical: pageUrl(self, path, query),
    languages: {
      ta: pageUrl("ta", path),
      en: pageUrl("en", path),
      "x-default": pageUrl("ta", path),
    },
  };
}

export const DEFAULT_SHARE_IMAGE = `${SITE_URL}/og.png`;

export function absoluteUrl(src: string | null | undefined): string {
  if (!src) return DEFAULT_SHARE_IMAGE;
  return src.startsWith("http") ? src : `${SITE_URL}${src}`;
}

/** Open Graph + Twitter share-preview metadata (WhatsApp, Facebook, X ...). */
export function shareMeta(opts: { lang: string; title: string; description: string; url: string; image?: string | null; type?: "website" | "article"; siteName: string }) {
  const image = absoluteUrl(opts.image);
  return {
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: opts.url,
      siteName: opts.siteName,
      type: opts.type ?? "website",
      locale: opts.lang === "en" ? "en_IN" : "ta_IN",
      images: [{ url: image }],
    },
    twitter: { card: "summary_large_image" as const, title: opts.title, description: opts.description, images: [image] },
  };
}
