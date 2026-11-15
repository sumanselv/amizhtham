import AdminBar from "@/components/AdminBar";
import { addTagAction, saveTagNamesAction } from "../actions";
import { requireAdmin } from "@/lib/auth";
import { listAllTags } from "@/lib/db";
import { langOf } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage({ searchParams }: { searchParams: Promise<{ saved?: string; added?: string; error?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const tags = await listAllTags();

  return (
    <>
      <AdminBar />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <h1 className="text-2xl font-bold">Tags</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          The name can be in any language. The web address is always English and has two parts: a section and a name, for example{" "}
          <code>/tag/amla</code>. Change the section to group tags, e.g. <code>/fruit/amla</code>. Old links to the previous address
          redirect to the new one.
        </p>

        {sp.added && <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">Tag “{sp.added}” added. It shows on the site once a post uses it.</p>}
        {sp.saved && <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">Tags saved.</p>}
        {sp.error && (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {sp.error}
          </p>
        )}

        <form action={addTagAction} className="mt-6 rounded-xl border border-[var(--line)] bg-white p-4 sm:p-6">
          <h2 className="text-base font-bold">Add a tag</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">Create a tag on its own, without a post. Tag the posts later by typing its name in a post.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <input name="name" required maxLength={40} aria-label="Tag name (any language)" placeholder="நெல்லிக்காய்" className="field sm:flex-1" />
            <div className="flex items-center gap-1 sm:w-72">
              <span className="text-sm text-[var(--muted)]">/</span>
              <input name="section" maxLength={30} aria-label="Address section" placeholder="tag" className="field w-28 shrink-0" />
              <span className="text-sm text-[var(--muted)]">/</span>
              <input name="slug" maxLength={80} aria-label="English address" placeholder="amla" className="field" />
            </div>
            <button type="submit" className="btn btn-primary">Add tag</button>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">Section and English address are optional: empty section means <code>tag</code>, and an empty address is made from the English meaning of the name.</p>
        </form>

        {tags.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-[var(--line)] bg-white p-8 text-center text-[var(--muted)]">
            No tags yet. Add one above, or type tags in a post.
          </p>
        ) : (
          <form action={saveTagNamesAction} className="mt-6 space-y-4 rounded-xl border border-[var(--line)] bg-white p-4 sm:p-6">
            <div className="hidden gap-4 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] sm:flex">
              <span className="flex-1">Name (any language)</span>
              <span className="w-72">English web address (section / name)</span>
            </div>
            {tags.map((tag) => (
              <div key={tag.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <input
                  name={`tag_${tag.id}`}
                  defaultValue={tag.name}
                  maxLength={40}
                  lang={langOf(tag.name)}
                  aria-label={`Name for /${tag.section}/${tag.slug}`}
                  className="field sm:flex-1"
                />
                <div className="flex items-center gap-1 sm:w-72">
                  <span className="text-sm text-[var(--muted)]">/</span>
                  <input name={`section_${tag.id}`} defaultValue={tag.section} maxLength={30} aria-label={`Address section for ${tag.name}`} className="field w-28 shrink-0" />
                  <span className="text-sm text-[var(--muted)]">/</span>
                  <input name={`slug_${tag.id}`} defaultValue={tag.slug} maxLength={80} aria-label={`English address for ${tag.name}`} className="field" />
                </div>
                {!tag.post_count && (
                  <label className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                    <input type="checkbox" name={`del_${tag.id}`} /> Delete (no posts)
                  </label>
                )}
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
