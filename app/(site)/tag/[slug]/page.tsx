import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import { PAGE_SIZE, getTagBySlug, listPosts } from "@/lib/db";
import { decodeParam, langOf } from "@/lib/slug";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(decodeParam(slug));
  if (!tag) return { title: "Remedy not found" };
  return {
    title: `${tag.name} home remedies`,
    description: `All home remedies and posts that use ${tag.name}.`,
    alternates: { canonical: `/tag/${encodeURIComponent(tag.slug)}` },
  };
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const tag = await getTagBySlug(decodeParam(slug));
  if (!tag) notFound();

  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const { posts, total } = await listPosts({ tagSlug: tag.slug, page });

  return (
    <>
      <nav className="mb-4 text-sm text-[var(--muted)]">
        <Link href="/" lang="ta" className="hover:text-[var(--ink)]">
          முகப்பு
        </Link>
      </nav>

      <h1 lang={langOf(tag.name)} className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
        {tag.name}
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        {total} {total === 1 ? "post" : "posts"} using {tag.name}
      </p>

      {posts.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-[var(--line)] p-10 text-center text-[var(--muted)]">
          No published posts for this remedy yet.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} basePath={`/tag/${encodeURIComponent(tag.slug)}`} />
    </>
  );
}
