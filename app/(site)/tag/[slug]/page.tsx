import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import { PAGE_SIZE, getTagBySlug, listPosts } from "@/lib/db";
import { decodeParam, langOf } from "@/lib/slug";
import { getLang, languageOf, localizePosts, localizeTags } from "@/lib/i18n";
import { getUi } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const rawTag = await getTagBySlug(decodeParam(slug));
  const lang = await getLang();
  const ui = await getUi(lang);
  if (!rawTag) return { title: ui.notFound };
  const [tag] = await localizeTags(lang, [rawTag]);
  return {
    title: `${tag.name} ${ui.tagSuffix}`,
    description: `${tag.name} ${ui.tagSuffix}`,
    alternates: { canonical: `/tag/${encodeURIComponent(tag.slug)}` },
  };
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const rawTag = await getTagBySlug(decodeParam(slug));
  if (!rawTag) notFound();

  const lang = await getLang();
  const ui = await getUi(lang);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const { posts: rawPosts, total } = await listPosts({ tagSlug: rawTag.slug, page });
  const [[tag], posts] = await Promise.all([localizeTags(lang, [rawTag]), localizePosts(lang, rawPosts)]);
  tag.slug = rawTag.slug; // the web address always stays English
  const locale = languageOf(lang).locale;

  return (
    <>
      <nav className="mb-4 text-sm text-[var(--muted)]">
        <Link href="/" lang={lang} className="hover:text-[var(--ink)]">
          {ui.home}
        </Link>
      </nav>

      <h1 lang={langOf(tag.name)} className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
        {tag.name}
      </h1>
      <p lang={lang} className="mt-2 text-[var(--muted)]">
        {ui.postsUsingThis}
      </p>

      {posts.length === 0 ? (
        <p lang={lang} className="mt-8 rounded-xl border border-dashed border-[var(--line)] p-10 text-center text-[var(--muted)]">
          {ui.noTagPosts}
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} locale={locale} />
          ))}
        </div>
      )}

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} basePath={`/tag/${encodeURIComponent(tag.slug)}`} />
    </>
  );
}
