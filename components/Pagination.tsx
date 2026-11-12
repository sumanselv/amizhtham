import Link from "next/link";

export default function Pagination({
  page,
  total,
  pageSize,
  basePath,
  query,
}: {
  page: number;
  total: number;
  pageSize: number;
  basePath: string;
  query?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <nav lang="ta" className="mt-10 flex items-center justify-center gap-3 text-sm" aria-label="பக்கங்கள்">
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn btn-ghost">
          ← புதியவை
        </Link>
      ) : (
        <span />
      )}
      <span className="text-[var(--muted)]">
        பக்கம் {page} / {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className="btn btn-ghost">
          பழையவை →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
