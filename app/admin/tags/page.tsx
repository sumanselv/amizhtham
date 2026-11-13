import AdminBar from "@/components/AdminBar";
import { saveTagNamesAction } from "../actions";
import { requireAdmin } from "@/lib/auth";
import { listAllTags } from "@/lib/db";
import { langOf } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const tags = await listAllTags();

  return (
    <>
      <AdminBar />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <h1 className="text-2xl font-bold">Tags</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          The name can be in any language. The web address is always English, for example <code>/tag/amla</code>. Changing an address
          breaks old links to that tag.
        </p>

        {sp.saved && <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">Tags saved.</p>}
        {sp.error && (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {sp.error}
          </p>
        )}

        {tags.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-[var(--line)] bg-white p-8 text-center text-[var(--muted)]">
            No tags yet. Tags appear here after you add them to a post.
          </p>
        ) : (
          <form action={saveTagNamesAction} className="mt-6 space-y-4 rounded-xl border border-[var(--line)] bg-white p-4 sm:p-6">
            <div className="hidden gap-4 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] sm:flex">
              <span className="flex-1">Name (any language)</span>
              <span className="w-56">English web address</span>
            </div>
            {tags.map((tag) => (
              <div key={tag.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <input
                  name={`tag_${tag.id}`}
                  defaultValue={tag.name}
                  maxLength={40}
                  lang={langOf(tag.name)}
                  aria-label={`Name for /tag/${tag.slug}`}
                  className="field sm:flex-1"
                />
                <div className="flex items-center gap-1 sm:w-56">
                  <span className="text-sm text-[var(--muted)]">/tag/</span>
                  <input name={`slug_${tag.id}`} defaultValue={tag.slug} maxLength={80} aria-label={`English address for ${tag.name}`} className="field" />
                </div>
              </div>
            ))}
            <div className="pt-2">
              <button type="submit" className="btn btn-primary">
                Save tags
              </button>
            </div>
          </form>
        )}
      </main>
    </>
  );
}
