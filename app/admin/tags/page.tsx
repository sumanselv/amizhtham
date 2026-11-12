import AdminBar from "@/components/AdminBar";
import { saveTagNamesAction } from "../actions";
import { requireAdmin } from "@/lib/auth";
import { listAllTags } from "@/lib/db";
import { langOf } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const tags = await listAllTags();

  return (
    <>
      <AdminBar />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <h1 className="text-2xl font-bold">Tags</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Rename a tag, for example to Tamil. The web address (shown on the right) stays in English and does not change.
        </p>

        {sp.saved && <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">Tag names saved.</p>}

        {tags.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-[var(--line)] bg-white p-8 text-center text-[var(--muted)]">
            No tags yet. Tags appear here after you add them to a post.
          </p>
        ) : (
          <form action={saveTagNamesAction} className="mt-6 space-y-3 rounded-xl border border-[var(--line)] bg-white p-4 sm:p-6">
            {tags.map((tag) => (
              <div key={tag.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                <input
                  name={`tag_${tag.id}`}
                  defaultValue={tag.name}
                  maxLength={40}
                  lang={langOf(tag.name)}
                  aria-label={`Name for tag ${tag.slug}`}
                  className="field sm:flex-1"
                />
                <code className="text-xs text-[var(--muted)] sm:w-48 sm:text-right">/tag/{tag.slug}</code>
              </div>
            ))}
            <div className="pt-2">
              <button type="submit" className="btn btn-primary">
                Save tag names
              </button>
            </div>
          </form>
        )}
      </main>
    </>
  );
}
