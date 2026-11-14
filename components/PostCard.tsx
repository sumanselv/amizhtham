import Link from "next/link";
import type { PostWithTags } from "@/lib/db";
import { formatDate, langOf, tagHref } from "@/lib/slug";

const PLACEHOLDER_TONES = [
  "from-emerald-100 to-lime-50",
  "from-amber-100 to-orange-50",
  "from-teal-100 to-cyan-50",
  "from-rose-100 to-pink-50",
  "from-green-100 to-emerald-50",
];

export function coverUrl(key: string | null): string | null {
  return key ? `/img/${encodeURIComponent(key)}` : null;
}

export default function PostCard({ post, locale }: { post: PostWithTags; locale?: string }) {
  const cover = coverUrl(post.cover_image);
  const tone = PLACEHOLDER_TONES[post.id % PLACEHOLDER_TONES.length];
  const firstTag = post.tags[0]?.name ?? "🌿";

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="aspect-[2/1] w-full overflow-hidden bg-slate-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={post.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${tone}`}>
            <span className="text-5xl font-bold text-[var(--brand)]/60">{firstTag.slice(0, 1).toUpperCase()}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <ul className="relative z-10 flex h-7 flex-wrap gap-2 overflow-hidden">
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

        {/* Fixed-height text block: title and description sit close together, and every card stays the same size. */}
        <div className="flex h-[8.5rem] flex-col gap-1.5 overflow-hidden">
          <h2 lang={langOf(post.title)} className="line-clamp-2 shrink-0 text-lg font-bold leading-snug text-[var(--ink)]">
            <Link href={`/remedy/${encodeURIComponent(post.slug)}`} className="after:absolute after:inset-0 after:content-['']">
              {post.title}
            </Link>
          </h2>

          <p lang={langOf(post.description)} className="line-clamp-3 text-sm leading-6 text-slate-700">{post.description}</p>
        </div>

        <p className="mt-auto pt-1 text-xs text-slate-600">{formatDate(post.created_at, locale)}</p>
      </div>
    </article>
  );
}
