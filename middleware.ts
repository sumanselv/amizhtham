import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * English pages live under /en (e.g. /en/remedy/amla-benefits) so search engines can index them.
 * /en/... is served by the same pages as /..., with the page language forced to English.
 * Visitors who chose English in the language menu are sent from / to /en.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    const headers = new Headers(request.headers);
    headers.set("x-site-lang", "en");
    return NextResponse.rewrite(url, { request: { headers } });
  }

  const wantsEnglish = request.cookies.get("lang")?.value === "en";
  if (wantsEnglish && (request.method === "GET" || request.method === "HEAD")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
    url.search = search;
    return NextResponse.redirect(url, 307);
  }

  const headers = new Headers(request.headers);
  headers.delete("x-site-lang"); // never trust this header from outside
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Public pages only: not admin, assets, images, language switch, sitemap, robots, icons.
  matcher: ["/((?!_next/|admin|img/|pdf/|lang|sitemap\\.xml|robots\\.txt|og\\.png|favicon).*)"],
};
