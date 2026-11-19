import { savePostAction } from "@/app/admin/actions";
import { coverUrl } from "@/components/PostCard";
import type { PostWithTags, Tag } from "@/lib/db";
import { imagesEnabled } from "@/lib/env";
import { KINDS, type KindKey } from "@/lib/slug";

const NOTICES: Record<string, string> = {
  saved: "Saved. This post is a draft: it is stored in the database but NOT shown on the site until you click Publish.",
  "saved-live": "Changes saved. The post is live on the site.",
  unpublished: "Unpublished. The post is saved as a draft and is no longer shown on the site.",
};

export default function PostForm({ post, error, notice, entries }: { post?: PostWithTags; error?: string; notice?: string; entries: Tag[] }) {
  // Show "name | english-url" for tags whose name is not English, so their address is visible and kept.
  const live = post?.published === 1;
  const linked = new Set(post?.tags.map((t) => t.id) ?? []);
  return (
    <form action={savePostAction} encType="multipart/form-data" className="space-y-6">
      {post && <input type="hidden" name="id" value={post.id} />}

      {notice && NOTICES[notice] && (
        <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {NOTICES[notice]}
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-semibold">
          Title
        </label>
        <input id="title" name="title" required maxLength={150} defaultValue={post?.title} className="field" placeholder="Amla Juice for Daily Vitamin C" />
      </div>

      <div>
        <label htmlFor="slug" className="mb-1 block text-sm font-semibold">
          URL name <span className="font-normal text-[var(--muted)]">(English letters, optional)</span>
        </label>
        <input id="slug" name="slug" defaultValue={post?.slug} className="field" placeholder="amla-juice-for-vitamin-c" />
        <p className="mt-1 text-xs text-[var(--muted)]">The address stays in English: /remedy/this-name. If the title is in Tamil and this is empty, a code like remedy-k3f9x2 is used. Changing it later breaks old links.</p>
      </div>

      {/* Herbs, causes, authors and books: pick the ones that belong to this post. Add them first on their own admin pages, or type a new one here. */}
      <div className="grid gap-6 sm:grid-cols-2">
        {(Object.keys(KINDS) as KindKey[]).map((key) => {
          const kind = KINDS[key];
          const field = key === "herbs" ? "herb" : key === "causes" ? "cause" : key === "authors" ? "author" : "book";
          const options = entries.filter((e) => e.section === kind.section);
          return (
            <fieldset key={key} className="rounded-xl border border-[var(--line)] p-4">
              <legend className="px-1 text-sm font-semibold">{kind.many}</legend>
              {options.length === 0 ? (
                <p className="text-xs text-[var(--muted)]">
                  No {kind.many.toLowerCase()} yet. Add one below, or on the <a href={`/admin/${key}`} className="underline">{kind.many}</a> page.
                </p>
              ) : (
                <ul className="flex max-h-40 flex-col gap-1.5 overflow-y-auto">
                  {options.map((o) => (
                    <li key={o.id}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input type="checkbox" name={field} value={o.id} defaultChecked={linked.has(o.id)} className="h-4 w-4" />
                        <span>{o.name}</span>
                        <span className="text-xs text-[var(--muted)]">/{o.section}/{o.slug}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              <input
                name={`${key}_new`}
                aria-label={`Add new ${kind.one.toLowerCase()}`}
                placeholder={`Add new: ${kind.example}`}
                className="field mt-3"
              />
              <p className="mt-1 text-xs text-[var(--muted)]">
                Optional. Type a new name (any language) and it is created and linked. Separate several with commas.
              </p>
            </fieldset>
          );
        })}
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-semibold">
          Short description <span className="font-normal text-[var(--muted)]">(shown on the home page card)</span>
        </label>
        <textarea id="description" name="description" rows={3} maxLength={300} defaultValue={post?.description} className="field" />
      </div>

      <div>
        <label htmlFor="cover" className="mb-1 block text-sm font-semibold">
          Cover image <span className="font-normal text-[var(--muted)]">(JPG, PNG, WebP, GIF or AVIF, up to 5 MB)</span>
        </label>
        {post?.cover_image && (
          <div className="mb-3 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl(post.cover_image)!} alt="Current cover" className="h-24 w-40 rounded-lg border border-[var(--line)] object-cover" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="remove_cover" /> Remove this image
            </label>
          </div>
        )}
        {imagesEnabled() ? (
          <input id="cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="block w-full text-sm" />
        ) : (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Image upload is off until R2 is enabled on the Cloudflare account (see README).</p>
        )}
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-slate-50 p-4">
        <p className="text-sm font-semibold">Poem section <span className="font-normal text-[var(--muted)]">(optional)</span></p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          An original verse, shown in slanted type and <strong>never translated</strong>. After it come the poet&apos;s image and name, then your explanation.
        </p>
        <label htmlFor="poem" className="mb-1 mt-3 block text-sm font-semibold">
          Poem
        </label>
        <textarea id="poem" name="poem" rows={5} maxLength={3000} defaultValue={post?.poem} className="field italic" placeholder="One line per row, as it should appear" />
        <label htmlFor="poem_page" className="mb-1 mt-3 block text-sm font-semibold">
          Page no. <span className="font-normal text-[var(--muted)]">(optional, page of the poem in the book)</span>
        </label>
        <input id="poem_page" name="poem_page" maxLength={20} defaultValue={post?.poem_page} className="field max-w-[10rem]" placeholder="e.g. 42" inputMode="numeric" />
        <label htmlFor="poet" className="mb-1 mt-3 block text-sm font-semibold">
          Poet / author name <span className="font-normal text-[var(--muted)]">(never translated)</span>
        </label>
        <input id="poet" name="poet" maxLength={100} defaultValue={post?.poet} className="field" placeholder="Poet's name" />

        <label htmlFor="poet_image" className="mb-1 mt-3 block text-sm font-semibold">
          Poet image <span className="font-normal text-[var(--muted)]">(optional, shown after the poem)</span>
        </label>
        {post?.poet_image && (
          <div className="mb-3 flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl(post.poet_image)!} alt="Current poet image" className="h-20 w-20 rounded-full border border-[var(--line)] object-cover" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="remove_poet_image" /> Remove this image
            </label>
          </div>
        )}
        {imagesEnabled() ? (
          <input id="poet_image" name="poet_image" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="block w-full text-sm" />
        ) : (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Image upload is off until R2 is enabled on the Cloudflare account (see README).</p>
        )}

        <label htmlFor="poem_note" className="mb-1 mt-3 block text-sm font-semibold">
          Explanation <span className="font-normal text-[var(--muted)]">(meaning of the poem; this part IS translated for other languages)</span>
        </label>
        <textarea id="poem_note" name="poem_note" rows={4} maxLength={3000} defaultValue={post?.poem_note} className="field" placeholder="What the poem means, in simple words" />
      </div>

      <div>
        <label htmlFor="content" className="mb-1 block text-sm font-semibold">
          Post body
        </label>
        <textarea id="content" name="content" rows={18} defaultValue={post?.content} className="field font-mono text-sm leading-6" placeholder={"## What you need\n- 2 amla\n- 1 glass water\n\n## How to make it\n1. Wash and blend...\n"} />
        <p className="mt-1 text-xs text-[var(--muted)]">
          Formatting: <code>## Heading</code>, <code>- bullet</code>, <code>1. numbered</code>, <code>**bold**</code>, <code>*italic*</code>,{" "}
          <code>[link text](https://...)</code>, <code>&gt; quote</code>
        </p>
      </div>

      <p className="text-sm">
        Status:{" "}
        {live ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-800">Published (visible on the site)</span>
        ) : (
          <span className="rounded-full bg-slate-200 px-2 py-0.5 font-semibold text-slate-700">Draft (not visible on the site)</span>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" name="intent" value="save" className="btn btn-ghost border border-[var(--line)]">
          {live ? "Save changes" : "Save draft"}
        </button>
        {!live && (
          <button type="submit" name="intent" value="publish" className="btn btn-primary">
            Publish
          </button>
        )}
        {live && (
          <button type="submit" name="intent" value="unpublish" className="btn btn-ghost">
            Unpublish
          </button>
        )}
        <a href="/admin" className="btn btn-ghost">
          Cancel
        </a>
      </div>
    </form>
  );
}
