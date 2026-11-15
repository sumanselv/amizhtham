import { tagHref } from "@/lib/slug";
import { listSlugsForSitemap } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** One <url> per language, each pointing at its alternates (hreflang). */
function entry(path: string, lastmod?: string): string[] {
  const ta = `${SITE_URL}${path}`;
  const en = `${SITE_URL}${path === "/" ? "/en" : `/en${path}`}`;
  const links = [
    `<xhtml:link rel="alternate" hreflang="ta" href="${esc(ta)}"/>`,
    `<xhtml:link rel="alternate" hreflang="en" href="${esc(en)}"/>`,
    `<xhtml:link rel="alternate" hreflang="x-default" href="${esc(ta)}"/>`,
  ].join("");
  const mod = lastmod ? `<lastmod>${esc(lastmod)}</lastmod>` : "";
  return [ta, en].map((loc) => `<url><loc>${esc(loc)}</loc>${mod}${links}</url>`);
}

export async function GET() {
  const { posts, tags } = await listSlugsForSitemap();

  const urls = [
    ...entry("/"),
    ...entry("/tags"),
    ...entry("/contact"),
    ...tags.flatMap((t) => entry(tagHref(t))),
    ...posts.flatMap((p) => entry(`/remedy/${encodeURIComponent(p.slug)}`, p.updated_at.slice(0, 10))),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
