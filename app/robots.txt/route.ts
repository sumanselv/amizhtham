export function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const body = ["User-agent: *", "Allow: /", "Disallow: /admin", "", `Sitemap: ${origin}/sitemap.xml`, ""].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
