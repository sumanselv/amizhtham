import { listSlugsForSitemap } from "@/lib/db";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const { posts, tags } = await listSlugsForSitemap();

  const urls = [
    `<url><loc>${origin}/</loc></url>`,
    `<url><loc>${origin}/tags</loc></url>`,
    ...tags.map((t) => `<url><loc>${esc(`${origin}/tag/${encodeURIComponent(t)}`)}</loc></url>`),
    ...posts.map(
      (p) => `<url><loc>${esc(`${origin}/remedy/${encodeURIComponent(p.slug)}`)}</loc><lastmod>${esc(p.updated_at.slice(0, 10))}</lastmod></url>`,
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
