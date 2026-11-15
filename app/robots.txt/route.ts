import { SITE_URL } from "@/lib/seo";

export function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /lang",
    "Disallow: /*?q=",
    "Disallow: /en/*?q=",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
