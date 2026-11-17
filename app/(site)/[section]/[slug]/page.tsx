import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { notFound, permanentRedirect } from "next/navigation";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import { PAGE_SIZE, getTagBySlug, listBooksByAuthor, listPosts } from "@/lib/db";
import { decodeParam, langOf, tagHref } from "@/lib/slug";
import { brandFor } from "@/lib/brand";
import { getLang, getPrefix, languageOf, localizePosts, localizeTags, withPrefix } from "@/lib/i18n";
import { alternatesFor, pageUrl, shareMeta } from "@/lib/seo";
import { getUi } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ section: string; slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const rawTag = await getTagBySlug(decodeParam(slug));
  const lang = await getLang();
  const ui = await getUi(lang);
  if (!rawTag) return { title: ui.notFound };
  const [tag] = await localizeTags(lang, [rawTag]);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const alternates = alternatesFor(lang, tagHref(rawTag), page > 1 ? `?page=${page}` : "");
  const title = rawTag.section === "author" || rawTag.section === "book" ? tag.name : `${tag.name} ${ui.tagSuffix}`;
  return {
    title,
    description: title,
    alternates,
    ...shareMeta({ lang, title: `${title} | ${brandFor(lang)}`, description: title, url: alternates.canonical, siteName: brandFor(lang) }),
  };
}

export default async function TagPage({ params, searchParams }: Props) {
  const { section, slug } = await params;
  const sp = await searchParams;
  const rawTag = await getTagBySlug(decodeParam(slug));
  if (!rawTag) notFound();
  // Old or mistyped prefix (e.g. /tag/amla after it moved to /fruit/amla): go to the current address.
  if (decodeParam(section) !== rawTag.section) permanentRedirect(withPrefix(await getPrefix(), tagHref(rawTag)) + (sp.page ? `?page=${encodeURIComponent(sp.page)}` : ""));

  const lang = await getLang();
  const prefix = await getPrefix();
  const ui = await getUi(lang);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const isAuthor = rawTag.section === "author";
  const [{ posts: rawPosts, total }, books] = await Promise.all([listPosts({ tagSlug: rawTag.slug, page }), isAuthor ? listBooksByAuthor(rawTag.slug) : Promise.resolve([])]);
  const [[tag], posts] = await Promise.all([localizeTags(lang, [rawTag]), localizePosts(lang, rawPosts)]);
  tag.slug = rawTag.slug; // the web address always stays English
  const locale = languageOf(lang).locale;

  const pLang = lang === "en" ? "en" : "ta";
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${tag.name} ${ui.tagSuffix}`,
      url: pageUrl(pLang, tagHref(rawTag)),
      inLanguage: pLang,
      isPartOf: { "@type": "WebSite", name: brandFor(lang), url: pageUrl(pLang, "/") },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: ui.home, item: pageUrl(pLang, "/") },
        { "@type": "ListItem", position: 2, name: tag.name, item: pageUrl(pLang, tagHref(rawTag)) },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <nav className="mb-4 text-sm text-[var(--muted)]">
        <Link href={withPrefix(prefix, "/")} lang={lang} className="hover:text-[var(--ink)]">
          {ui.home}
        </Link>
      </nav>

      <h1 lang={langOf(tag.name)} className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
        {tag.name}
      </h1>
      <p lang={lang} className="mt-2 text-[var(--muted)]">
        {ui.postsUsingThis}
      </p>

      {books.length > 0 && (
        <section aria-label={ui.booksByAuthor} className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--brand-soft)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 lang={lang} className="font-bold">{ui.booksByAuthor}</h2>
            <Link href={withPrefix(prefix, `${tagHref(rawTag)}/books`)} lang={lang} className="text-sm font-semibold text-[var(--brand-dark)] hover:underline">
              {ui.allBooks}
            </Link>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {books.map((b) => (
              <li key={b.id}>
                <Link href={withPrefix(prefix, tagHref(b))} lang={langOf(b.name)} className="inline-block rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-sm font-medium hover:border-[var(--brand)]">
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {posts.length === 0 ? (
        <p lang={lang} className="mt-8 rounded-xl border border-dashed border-[var(--line)] p-10 text-center text-[var(--muted)]">
          {ui.noTagPosts}
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 items-start gap-5 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} locale={locale} />
          ))}
        </div>
      )}

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} basePath={tagHref(rawTag)} />
    </>
  );
}
