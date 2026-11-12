import Link from "next/link";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import { PAGE_SIZE, listPosts, listTags } from "@/lib/db";
import { langOf } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const [{ posts, total }, tags] = await Promise.all([listPosts({ q, page }), listTags()]);

  return (
    <>
      <section className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
          {q ? `Results for “${q}”` : "Simple home remedies, made instant"}
        </h1>
        {!q && <p className="mt-2 max-w-2xl text-sm text-[var(--muted)] sm:mt-3 sm:text-base">Browse traditional remedies by ingredient. Tap a tag to see every post that uses it.</p>}
      </section>

      {!q && tags.length > 0 && (
        <section aria-label="Browse by remedy" className="mb-8 flex flex-wrap gap-2 sm:mb-10">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tag/${encodeURIComponent(tag.slug)}`}
              lang={langOf(tag.name)}
              className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-sm font-medium hover:border-[var(--brand)] hover:text-[var(--brand-dark)] sm:px-4"
            >
              {tag.name} <span className="text-[var(--muted)]">({tag.post_count})</span>
            </Link>
          ))}
        </section>
      )}

      {posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--line)] p-10 text-center text-[var(--muted)]">
          {q ? "No remedies matched your search." : "No posts yet. Add your first remedy from the admin page."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} basePath="/" query={q || undefined} />
    </>
  );
}
