import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { notFound } from "next/navigation";
import PostCard, { coverUrl } from "@/components/PostCard";
import { getPostBySlug, listRelatedPosts } from "@/lib/db";
import { plainExcerpt, renderMarkdown } from "@/lib/markdown";
import { decodeParam, isPeopleSection, langOf, tagHref } from "@/lib/slug";
import { formatPostDate } from "@/lib/tamilcal";
import { brandFor } from "@/lib/brand";
import { getLang, getPrefix, languageOf, localizePost, localizePosts, withPrefix } from "@/lib/i18n";
import { alternatesFor, pageUrl, shareMeta, absoluteUrl } from "@/lib/seo";
import { getUi } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const raw = await getPostBySlug(decodeParam(slug));
  const lang = await getLang();
  if (!raw) return { title: (await getUi(lang)).notFound };
  const post = await localizePost(lang, raw);
  const description = post.description || plainExcerpt(post.content);
  const image = coverUrl(post.cover_image);
  const alternates = alternatesFor(lang, `/remedy/${encodeURIComponent(post.slug)}`);
  // An English page that is only partly translated yet is kept out of search results until it is complete.
  const incomplete = lang !== "ta" && post.untranslated > 0;
  return {
    title: post.title,
    description,
    alternates,
    ...shareMeta({ lang, title: post.title, description, url: alternates.canonical, image, type: "article", siteName: brandFor(lang) }),
    ...(incomplete ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function RemedyPage({ params }: Props) {
  const { slug } = await params;
  const raw = await getPostBySlug(decodeParam(slug));
  if (!raw) notFound();

  const lang = await getLang();
  const prefix = await getPrefix();
  const ui = await getUi(lang);
  const post = await localizePost(lang, raw);
  const related = await localizePosts(lang, await listRelatedPosts(raw));
  const locale = languageOf(lang).locale;
  const cover = coverUrl(post.cover_image);

  const pLang = lang === "en" ? "en" : "ta";
  const url = pageUrl(pLang, `/remedy/${encodeURIComponent(post.slug)}`);
  // Authors and books are shown on their own lines, not as tags.
  const tags = post.tags.filter((t) => !isPeopleSection(t.section));
  const authors = post.tags.filter((t) => t.section === "author");
  const books = post.tags.filter((t) => t.section === "book");
  const firstTag = tags[0];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title.slice(0, 110),
      description: post.description || plainExcerpt(post.content),
      image: [absoluteUrl(cover)],
      datePublished: post.created_at,
      dateModified: post.updated_at,
      inLanguage: pLang,
      mainEntityOfPage: url,
      url,
      keywords: tags.map((t) => t.name).join(", ") || undefined,
      author: { "@type": "Organization", name: brandFor(lang) },
      publisher: { "@type": "Organization", name: brandFor(lang) },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: ui.home, item: pageUrl(pLang, "/") },
        ...(firstTag ? [{ "@type": "ListItem", position: 2, name: firstTag.name, item: pageUrl(pLang, tagHref(firstTag)) }] : []),
        { "@type": "ListItem", position: firstTag ? 3 : 2, name: post.title, item: url },
      ],
    },
  ];

  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd data={jsonLd} />
      <nav className="mb-4 text-sm text-[var(--muted)]">
        <Link href={withPrefix(prefix, "/")} lang={lang} className="hover:text-[var(--ink)]">
          {ui.home}
        </Link>
        {tags[0] && (
          <>
            {" / "}
            <Link href={withPrefix(prefix, tagHref(tags[0]))} lang={langOf(tags[0].name)} className="hover:text-[var(--ink)]">
              {tags[0].name}
            </Link>
          </>
        )}
      </nav>

      <h1 lang={langOf(post.title)} className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
        {post.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={withPrefix(prefix, tagHref(tag))}
            lang={langOf(tag.name)}
            className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-dark)] hover:bg-[var(--brand)] hover:text-white"
          >
            {tag.name}
          </Link>
        ))}
        <span className="text-sm text-[var(--muted)]">{formatPostDate(post.created_at, lang, locale)}</span>
      </div>

      {(authors.length > 0 || books.length > 0) && (
        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--muted)]">
          {authors.length > 0 && (
            <span>
              <span lang={lang}>{ui.author}</span>:{" "}
              {authors.map((a, i) => (
                <span key={a.id}>
                  {i > 0 && ", "}
                  <Link href={withPrefix(prefix, tagHref(a))} lang={langOf(a.name)} className="font-semibold text-[var(--ink)] hover:text-[var(--brand-dark)]">
                    {a.name}
                  </Link>
                </span>
              ))}
            </span>
          )}
          {books.length > 0 && (
            <span>
              <span lang={lang}>{ui.book}</span>:{" "}
              {books.map((b, i) => (
                <span key={b.id}>
                  {i > 0 && ", "}
                  <Link href={withPrefix(prefix, tagHref(b))} lang={langOf(b.name)} className="font-semibold text-[var(--ink)] hover:text-[var(--brand-dark)]">
                    {b.name}
                  </Link>
                </span>
              ))}
            </span>
          )}
        </p>
      )}

      {cover && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--line)] bg-slate-100 sm:mt-6">
          {/* Fixed, screen-sized height so a large upload never fills the whole page. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt={post.title} className="block h-48 w-full object-cover min-[480px]:h-60 sm:h-72 lg:h-80" />
        </div>
      )}

      <div lang={langOf(post.title + post.content)} className="post-body mt-5 sm:mt-6" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />

      {(post.poem || post.poet || post.poet_image) && (
        // Only the poem (and its poet) is highlighted.
        <section className="mt-8 rounded-r-xl border-l-4 border-[var(--brand)] bg-[var(--brand-soft)] px-5 py-4 sm:mt-10 sm:px-6">
          {post.poem && (
            // Original verse: kept exactly as written (never machine-translated; browsers are told not to translate it either).
            <blockquote translate="no" lang={langOf(post.poem)} className="notranslate whitespace-pre-line text-lg italic leading-8 text-[var(--ink)] sm:text-xl sm:leading-9">
              {post.poem}
            </blockquote>
          )}
          {(post.poet || post.poet_image) && (
            <div translate="no" className={`notranslate flex items-center gap-3 ${post.poem ? "mt-4" : ""}`}>
              {post.poet_image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl(post.poet_image)!} alt={post.poet || ""} className="h-16 w-16 shrink-0 rounded-full border border-white object-cover shadow-sm sm:h-20 sm:w-20" />
              )}
              {post.poet && (
                <p lang={langOf(post.poet)} className="font-semibold text-[var(--brand-dark)]">
                  {post.poet}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {post.poem_note && (
        // The explanation is ordinary text (and is translated for other languages).
        <p lang={langOf(post.poem_note)} className="mt-5 whitespace-pre-line text-base leading-7 text-[var(--ink)] sm:mt-6">
          {post.poem_note}
        </p>
      )}

      {related.length > 0 && (
        <section className="mt-10 sm:mt-14">
          <h2 lang={lang} className="mb-4 text-xl font-bold">{ui.related}</h2>
          <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
