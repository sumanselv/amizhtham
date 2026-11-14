import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard, { coverUrl } from "@/components/PostCard";
import { getPostBySlug, listRelatedPosts } from "@/lib/db";
import { plainExcerpt, renderMarkdown } from "@/lib/markdown";
import { decodeParam, formatDate, langOf, tagHref } from "@/lib/slug";
import { getLang, languageOf, localizePost, localizePosts } from "@/lib/i18n";
import { getUi } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const raw = await getPostBySlug(decodeParam(slug));
  const lang = await getLang();
  if (!raw) return { title: (await getUi(lang)).notFound };
  const post = { ...raw, ...(await localizePosts(lang, [raw]))[0] };
  const description = post.description || plainExcerpt(post.content);
  const image = coverUrl(post.cover_image);
  return {
    title: post.title,
    description,
    alternates: { canonical: `/remedy/${encodeURIComponent(post.slug)}` },
    openGraph: { title: post.title, description, type: "article", images: image ? [image] : undefined },
  };
}

export default async function RemedyPage({ params }: Props) {
  const { slug } = await params;
  const raw = await getPostBySlug(decodeParam(slug));
  if (!raw) notFound();

  const lang = await getLang();
  const ui = await getUi(lang);
  const post = await localizePost(lang, raw);
  const related = await localizePosts(lang, await listRelatedPosts(raw));
  const locale = languageOf(lang).locale;
  const cover = coverUrl(post.cover_image);

  return (
    <article className="mx-auto max-w-3xl">
      <nav className="mb-4 text-sm text-[var(--muted)]">
        <Link href="/" lang={lang} className="hover:text-[var(--ink)]">
          {ui.home}
        </Link>
        {post.tags[0] && (
          <>
            {" / "}
            <Link href={tagHref(post.tags[0])} lang={langOf(post.tags[0].name)} className="hover:text-[var(--ink)]">
              {post.tags[0].name}
            </Link>
          </>
        )}
      </nav>

      <h1 lang={langOf(post.title)} className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
        {post.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {post.tags.map((tag) => (
          <Link
            key={tag.id}
            href={tagHref(tag)}
            lang={langOf(tag.name)}
            className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-dark)] hover:bg-[var(--brand)] hover:text-white"
          >
            {tag.name}
          </Link>
        ))}
        <span className="text-sm text-[var(--muted)]">{formatDate(post.created_at, locale)}</span>
      </div>

      {cover && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--line)] bg-slate-100 sm:mt-6">
          {/* Fixed, screen-sized height so a large upload never fills the whole page. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt={post.title} className="block h-48 w-full object-cover min-[480px]:h-60 sm:h-72 lg:h-80" />
        </div>
      )}

      {post.description && (
        <p lang={langOf(post.description)} className="mt-5 text-base leading-7 text-[var(--muted)] sm:mt-6 sm:text-lg sm:leading-8">
          {post.description}
        </p>
      )}

      <div lang={langOf(post.title + post.content)} className="post-body mt-5 sm:mt-6" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />

      {related.length > 0 && (
        <section className="mt-10 sm:mt-14">
          <h2 lang={lang} className="mb-4 text-xl font-bold">{ui.related}</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
