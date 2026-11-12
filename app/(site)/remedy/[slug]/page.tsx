import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard, { coverUrl } from "@/components/PostCard";
import { getPostBySlug, listRelatedPosts } from "@/lib/db";
import { plainExcerpt, renderMarkdown } from "@/lib/markdown";
import { decodeParam, formatDate } from "@/lib/slug";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(decodeParam(slug));
  if (!post) return { title: "Remedy not found" };
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
  const post = await getPostBySlug(decodeParam(slug));
  if (!post) notFound();

  const related = await listRelatedPosts(post);
  const cover = coverUrl(post.cover_image);

  return (
    <article className="mx-auto max-w-3xl">
      <nav className="mb-4 text-sm text-[var(--muted)]">
        <Link href="/" className="hover:text-[var(--ink)]">
          Home
        </Link>
        {post.tags[0] && (
          <>
            {" / "}
            <Link href={`/tag/${encodeURIComponent(post.tags[0].slug)}`} className="hover:text-[var(--ink)]">
              {post.tags[0].name}
            </Link>
          </>
        )}
      </nav>

      <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{post.title}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {post.tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/tag/${encodeURIComponent(tag.slug)}`}
            className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-dark)] hover:bg-[var(--brand)] hover:text-white"
          >
            {tag.name}
          </Link>
        ))}
        <span className="text-sm text-[var(--muted)]">{formatDate(post.created_at)}</span>
      </div>

      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt={post.title} className="mt-6 w-full rounded-2xl border border-[var(--line)] object-cover" />
      )}

      {post.description && <p className="mt-6 text-lg leading-8 text-[var(--muted)]">{post.description}</p>}

      <div className="post-body mt-6" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />

      <p className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        This remedy is shared for general information and is not medical advice. Please check with a doctor if you are pregnant,
        on medication, or have a health condition.
      </p>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-xl font-bold">More remedies you may like</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
