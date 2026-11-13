import { LANG_COOKIE, isLang } from "@/lib/i18n";

/** /lang?l=hi saves the visitor's language choice and sends them back to the page they were on. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("l");

  let back = "/";
  const ref = request.headers.get("referer");
  if (ref) {
    try {
      const r = new URL(ref);
      if (r.origin === url.origin && !r.pathname.startsWith("/lang")) back = r.pathname + r.search;
    } catch {
      /* ignore a bad referer */
    }
  }

  const headers = new Headers({ Location: back, "Cache-Control": "no-store" });
  if (isLang(code)) {
    headers.append("Set-Cookie", `${LANG_COOKIE}=${code}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`);
  }
  return new Response(null, { status: 303, headers });
}
