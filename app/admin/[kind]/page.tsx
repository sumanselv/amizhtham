import { notFound } from "next/navigation";
import AdminBar from "@/components/AdminBar";
import { addEntryAction, saveEntriesAction } from "../actions";
import { requireAdmin } from "@/lib/auth";
import { listTagsBySection } from "@/lib/db";
import { KINDS, isKind, langOf } from "@/lib/slug";

export const dynamic = "force-dynamic";

/** One admin page per kind: Herbs, Causes, Authors and Books. Each can add, rename, re-address and delete its entries. */
export default async function EntriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ saved?: string; added?: string; error?: string }>;
}) {
  await requireAdmin();
  const { kind: key } = await params;
  if (!isKind(key)) notFound();
  const kind = KINDS[key];
  const sp = await searchParams;
  const entries = await listTagsBySection(kind.section);

  return (
    <>
      <AdminBar />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <h1 className="text-2xl font-bold">{kind.many}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {kind.hint} Each one has its own page on the site, for example <code>{kind.url}</code>. Link them to a post when you create or edit it.
        </p>

        {sp.added && <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">“{sp.added}” added. Link it to a post from the post form.</p>}
        {sp.saved && <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">Saved.</p>}
        {sp.error && (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {sp.error}
          </p>
        )}

        <form action={addEntryAction} encType="multipart/form-data" className="mt-6 rounded-xl border border-[var(--line)] bg-white p-4 sm:p-6">
          <input type="hidden" name="kind" value={key} />
          <h2 className="text-base font-bold">Add a {kind.one.toLowerCase()}</h2>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <input name="name" required maxLength={60} aria-label={`${kind.one} name (any language)`} placeholder={kind.example.split("|")[0].trim()} className="field sm:flex-1" />
            <div className="flex items-center gap-1 sm:w-64">
              <span className="whitespace-nowrap text-sm text-[var(--muted)]">/{kind.section}/</span>
              <input name="slug" maxLength={80} aria-label="English address" placeholder={kind.example.split("|")[1]?.trim()} className="field" />
            </div>
            <button type="submit" className="btn btn-primary">
              Add {kind.one.toLowerCase()}
            </button>
          </div>
          {key === "books" && (
            <div className="mt-3">
              <label htmlFor="pdf" className="mb-1 block text-sm font-semibold">
                Book PDF <span className="font-normal text-[var(--muted)]">(optional, up to 50 MB)</span>
              </label>
              <input id="pdf" name="pdf" type="file" accept="application/pdf,.pdf" className="field" />
            </div>
          )}
          <p className="mt-2 text-xs text-[var(--muted)]">The name can be in any language. The English address is optional: if empty, it is made from the English meaning of the name.</p>
        </form>

        {entries.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-[var(--line)] bg-white p-8 text-center text-[var(--muted)]">No {kind.many.toLowerCase()} yet. Add the first one above.</p>
        ) : (
          <form action={saveEntriesAction} encType="multipart/form-data" className="mt-6 space-y-4 rounded-xl border border-[var(--line)] bg-white p-4 sm:p-6">
            <input type="hidden" name="kind" value={key} />
            <div className="hidden gap-4 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] sm:flex">
              <span className="flex-1">Name (any language)</span>
              <span className="w-64">English address</span>
              <span className="w-16">Delete</span>
            </div>
            {entries.map((e) => (
              <div key={e.id} className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <input name={`name_${e.id}`} defaultValue={e.name} maxLength={60} lang={langOf(e.name)} aria-label={`Name of ${e.name}`} className="field sm:flex-1" />
                <div className="flex items-center gap-1 sm:w-64">
                  <span className="whitespace-nowrap text-sm text-[var(--muted)]">/{kind.section}/</span>
                  <input name={`slug_${e.id}`} defaultValue={e.slug} maxLength={80} aria-label={`English address of ${e.name}`} className="field" />
                </div>
                <label className="flex items-center gap-1.5 text-xs text-[var(--muted)] sm:w-16" title={e.post_count ? `Also removes it from ${e.post_count} post(s)` : undefined}>
                  <input type="checkbox" name={`del_${e.id}`} />
                  {e.post_count ? `${e.post_count} post${e.post_count > 1 ? "s" : ""}` : "unused"}
                </label>
              </div>
              {key === "books" && (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {e.pdf ? (
                    <>
                      <a href={`/pdf/${e.pdf}`} target="_blank" rel="noopener" className="font-semibold text-[var(--brand-dark)] underline">
                        View PDF
                      </a>
                      <label className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                        <input type="checkbox" name={`rmpdf_${e.id}`} /> Remove PDF
                      </label>
                      <span className="text-xs text-[var(--muted)]">Replace:</span>
                    </>
                  ) : (
                    <span className="text-xs text-[var(--muted)]">PDF:</span>
                  )}
                  <input name={`pdf_${e.id}`} type="file" accept="application/pdf,.pdf" aria-label={`PDF of ${e.name}`} className="max-w-full text-xs" />
                </div>
              )}
              </div>
            ))}
            <p className="text-xs text-[var(--muted)]">Tick the box and save to delete an entry. It is also removed from the posts that use it.</p>
            <div className="pt-2">
              <button type="submit" className="btn btn-primary">
                Save changes
              </button>
            </div>
          </form>
        )}
      </main>
    </>
  );
}
