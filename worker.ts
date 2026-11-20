import handler from "vinext/server/fetch-handler";

/**
 * Front door of the site: serves a saved copy of public pages to anonymous visitors for a short time,
 * so most page views skip the database and rendering. Everything else goes straight to the site.
 */
const EDGE_SECONDS = 120;
type Ctx = { waitUntil(promise: Promise<unknown>): void };

function canCache(request: Request, url: URL): boolean {
  if (request.method !== "GET") return false;
  const p = url.pathname;
  // Never cache the admin, language switch, images, search results or the contact form.
  if (p.startsWith("/admin") || p.startsWith("/lang") || p.startsWith("/img/") || p.startsWith("/pdf/") || p.startsWith("/_next/")) return false;
  if (p === "/contact" || p === "/en/contact") return false;
  if (url.searchParams.has("q")) return false;
  // Visitors who are signed in as admin, or who picked a language, get their own page.
  const cookie = request.headers.get("cookie") ?? "";
  if (/(?:^|;\s*)(admin_session|lang)=/.test(cookie)) return false;
  return true;
}

export default {
  async fetch(request: Request, env: unknown, ctx: Ctx): Promise<Response> {
    const url = new URL(request.url);
    const worker = handler as unknown as { fetch: (r: Request, e: unknown, c: Ctx) => Promise<Response> };
    if (!canCache(request, url)) return worker.fetch(request, env, ctx);

    const cache = (caches as unknown as { default: Cache }).default;
    const key = new Request(url.toString(), { method: "GET" });
    const hit = await cache.match(key);
    if (hit) {
      const res = new Response(hit.body, hit);
      res.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
      res.headers.set("x-edge-cache", "HIT");
      return res;
    }

    const res = await worker.fetch(request, env, ctx);
    const isHtml = (res.headers.get("content-type") ?? "").includes("text/html");
    if (res.status === 200 && isHtml && !res.headers.has("set-cookie")) {
      const stored = new Response(res.clone().body, res);
      stored.headers.set("Cache-Control", `public, max-age=${EDGE_SECONDS}`);
      ctx.waitUntil(cache.put(key, stored));
      const out = new Response(res.body, res);
      out.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
      out.headers.set("x-edge-cache", "MISS");
      return out;
    }
    return res;
  },
};
