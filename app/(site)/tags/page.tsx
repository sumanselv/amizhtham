import type { Metadata } from "next";
import Link from "next/link";
import { listTags } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All remedies",
  description: "Browse every home remedy ingredient and see the posts that use it.",
};

export default async function TagsPage() {
  const tags = await listTags();
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">All remedies</h1>
      <p className="mt-2 text-[var(--muted)]">Pick an ingredient to see every post that uses it.</p>

      {tags.length === 0 ? (
        <p className="mt-8 text-[var(--muted)]">No tags yet.</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tags.map((tag) => (
            <li key={tag.id}>
              <Link
                href={`/tag/${encodeURIComponent(tag.slug)}`}
                className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white p-4 font-semibold hover:border-[var(--brand)] hover:shadow-sm"
              >
                <span>{tag.name}</span>
                <span className="rounded-full bg-[var(--brand-soft)] px-2.5 py-0.5 text-xs text-[var(--brand-dark)]">{tag.post_count}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
