import Link from "next/link";
import type { PostWithTags } from "@/lib/db";
import { formatDate, langOf, tagHref } from "@/lib/slug";

export function coverUrl(key: string | null): string | null {
  return key ? `/img/${encodeURIComponent(key)}` : null;
}

export default function PostCard({ post, locale }: { post: PostWithTags; locale?: string }) {
  const cover = coverUrl(post.cover_image);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {/* The image area only exists when a cover was uploaded; otherwise the card is just text. */}
      {cover && (
        <div className="aspect-[2/1] w-full overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt={post.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
        </div>
      )}

      <div className="flex flex-col gap-2.5 p-4 sm:gap-3 sm:p-5">
        {post.tags.length > 0 && (
          <ul className="relative z-10 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li key={tag.id}>
                <Link
                  href={tagHref(tag)}
                  lang={langOf(tag.name)}
                  className="inline-block rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-dark)] hover:bg-[var(--brand)] hover:text-white"
                >
                  {tag.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Title and description take the space they need (long ones are trimmed), so each card fits its own text. */}
        <h2 lang={langOf(post.title)} className="line-clamp-3 text-base font-bold leading-snug text-[var(--ink)] sm:text-lg">
          <Link href={`/remedy/${encodeURIComponent(post.slug)}`} className="after:absolute after:inset-0 after:content-['']">
            {post.title}
          </Link>
        </h2>

        {post.description && (
          <p lang={langOf(post.description)} className="line-clamp-4 text-sm leading-6 text-slate-700">{post.description}</p>
        )}

        <p className="text-xs text-slate-600">{formatDate(post.created_at, locale)}</p>
      </div>
    </article>
  );
}
