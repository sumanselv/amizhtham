import { LANG_COOKIE, isLang } from "@/lib/i18n";

/** /lang?l=hi saves the visitor's language choice and sends them back to the page they were on. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("l");

  let back = "/";
  let backPath = "/";
  let backSearch = "";
  const ref = request.headers.get("referer");
  if (ref) {
    try {
      const r = new URL(ref);
      if (r.origin === url.origin && !r.pathname.startsWith("/lang")) {
        backPath = r.pathname;
        backSearch = r.search;
      }
    } catch {
      /* ignore a bad referer */
    }
  }

  // English pages have their own /en addresses; every other language uses the normal address.
  const plain = backPath === "/en" ? "/" : backPath.startsWith("/en/") ? backPath.slice(3) : backPath;
  const isAdmin = plain.startsWith("/admin");
  back = (code === "en" && !isAdmin ? (plain === "/" ? "/en" : `/en${plain}`) : plain) + backSearch;

  const headers = new Headers({ Location: back, "Cache-Control": "no-store" });
  if (isLang(code)) {
    headers.append("Set-Cookie", `${LANG_COOKIE}=${code}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`);
  }
  return new Response(null, { status: 303, headers });
}
