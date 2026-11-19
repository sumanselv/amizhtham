import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import { PAGE_SIZE, listPosts } from "@/lib/db";
import { brandFor } from "@/lib/brand";
import { getLang, languageOf, localizePosts } from "@/lib/i18n";
import { SITE_URL, alternatesFor, pageUrl, shareMeta } from "@/lib/seo";
import { getUi } from "@/lib/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }): Promise<Metadata> {
  const sp = await searchParams;
  const lang = await getLang();
  const ui = await getUi(lang);
  const brand = brandFor(lang);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const alternates = alternatesFor(lang, "/", page > 1 && !sp.q ? `?page=${page}` : "");
  const meta = shareMeta({ lang, title: brand, description: ui.siteDescription, url: alternates.canonical, siteName: brand });
  // Search results are not worth indexing (endless combinations); the plain home page is.
  return { alternates, ...meta, ...(sp.q ? { robots: { index: false, follow: true } } : {}) };
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const lang = await getLang();
  const [{ posts: rawPosts, total }, ui] = await Promise.all([listPosts({ q, page }), getUi(lang)]);
  const posts = await localizePosts(lang, rawPosts);
  const locale = languageOf(lang).locale;

  const brand = brandFor(lang);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: brand,
      alternateName: lang === "ta" ? "Amizhtham" : "அமிழ்தம்",
      url: pageUrl(lang === "en" ? "en" : "ta", "/"),
      inLanguage: lang === "en" ? "en" : "ta",
      potentialAction: { "@type": "SearchAction", target: `${pageUrl(lang === "en" ? "en" : "ta", "/")}?q={search_term_string}`, "query-input": "required name=search_term_string" },
    },
    { "@context": "https://schema.org", "@type": "Organization", name: brand, url: SITE_URL },
  ];

  return (
    <>
      {!q && <JsonLd data={jsonLd} />}
      {q ? (
        <h1 lang={lang} className="mb-6 text-2xl font-extrabold tracking-tight sm:mb-8 sm:text-3xl">
          {`${ui.searchResults}: “${q}”`}
        </h1>
      ) : (
        <h1 className="sr-only">{brandFor(lang)}</h1>
      )}

      {posts.length === 0 ? (
        <p lang={lang} className="rounded-xl border border-dashed border-[var(--line)] p-10 text-center text-[var(--muted)]">
          {q ? ui.noResults : ui.noPosts}
        </p>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} locale={locale} />
          ))}
        </div>
      )}

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} basePath="/" query={q || undefined} />
    </>
  );
}
