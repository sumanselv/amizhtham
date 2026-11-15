import { savePostAction } from "@/app/admin/actions";
import { coverUrl } from "@/components/PostCard";
import type { PostWithTags } from "@/lib/db";
import { imagesEnabled } from "@/lib/env";
import { isPlaceholderSlug, tagSlugFor } from "@/lib/db";
import { slugify, AUTHOR_SECTION, BOOK_SECTION } from "@/lib/slug";

const NOTICES: Record<string, string> = {
  saved: "Saved. This post is a draft: it is stored in the database but NOT shown on the site until you click Publish.",
  "saved-live": "Changes saved. The post is live on the site.",
  unpublished: "Unpublished. The post is saved as a draft and is no longer shown on the site.",
};

export default function PostForm({ post, error, notice, tagSuggestions }: { post?: PostWithTags; error?: string; notice?: string; tagSuggestions: string[] }) {
  // Show "name | english-url" for tags whose name is not English, so their address is visible and kept.
  const live = post?.published === 1;
  const HERB = "plant";
  const CAUSE = "causes";
  const inSection = (name: string) => post?.tags.filter((t) => t.section === name) ?? [];
  // Tags from before Herbs and Causes existed (/tag/...): kept until they are moved into Herbs or Causes.
  const otherTags = post?.tags.filter((t) => ![HERB, CAUSE, AUTHOR_SECTION, BOOK_SECTION].includes(t.section)) ?? [];
  // "name" or "name | english-address" (the address is only written when it was chosen by hand).
  const label = (t: { name: string; slug: string }) => {
    const plain = tagSlugFor(t.name) === t.slug || isPlaceholderSlug(t.slug);
    return plain ? t.name : `${t.name} | ${t.slug}`;
  };
  const join = (list: { name: string; slug: string }[]) => list.map(label).join(", ");
  const herbsDefault = join(inSection(HERB));
  const causesDefault = join(inSection(CAUSE));
  const authorsDefault = join(inSection(AUTHOR_SECTION));
  const booksDefault = join(inSection(BOOK_SECTION));
  const otherDefault = join(otherTags);
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

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="herbs" className="mb-1 block text-sm font-semibold">
            Herbs <span className="font-normal text-[var(--muted)]">(comma separated, any language)</span>
          </label>
          <input id="herbs" name="herbs" list="tag-list" defaultValue={herbsDefault} className="field" placeholder="அறுகம்புல் | scutch-grass, நெல்லிக்காய்" />
        </div>
        <div>
          <label htmlFor="causes" className="mb-1 block text-sm font-semibold">
            Causes <span className="font-normal text-[var(--muted)]">(comma separated, any language)</span>
          </label>
          <input id="causes" name="causes" list="tag-list" defaultValue={causesDefault} className="field" placeholder="இருமல் | cough, காய்ச்சல்" />
        </div>
        <p className="text-xs text-[var(--muted)] sm:col-span-2">
          Type names in any language. The web address is made from the English meaning automatically: a herb gets <code>/plant/scutch-grass</code>, a cause gets <code>/causes/cough</code>.
          To choose the English name yourself, add it after a bar, e.g. <code>கடலை மாவு | gram-flour</code>. You can change addresses later in Admin &gt; Tags.
        </p>
        <datalist id="tag-list">
          {tagSuggestions.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>

      {otherTags.length > 0 && (
        <div>
          <label htmlFor="tags" className="mb-1 block text-sm font-semibold">
            Other tags <span className="font-normal text-[var(--muted)]">(older tags)</span>
          </label>
          <input id="tags" name="tags" defaultValue={otherDefault} className="field" />
          <p className="mt-1 text-xs text-[var(--muted)]">These tags were added before Herbs and Causes existed. Move each one into Herbs or Causes above (and delete it from here) to give it a <code>/plant/</code> or <code>/causes/</code> address. Left here, it stays as it is.</p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="authors" className="mb-1 block text-sm font-semibold">
            Authors <span className="font-normal text-[var(--muted)]">(optional, comma separated)</span>
          </label>
          <input id="authors" name="authors" defaultValue={authorsDefault} className="field" placeholder="திருவள்ளுவர் | valluvar" />
        </div>
        <div>
          <label htmlFor="books" className="mb-1 block text-sm font-semibold">
            Books <span className="font-normal text-[var(--muted)]">(optional, comma separated)</span>
          </label>
          <input id="books" name="books" defaultValue={booksDefault} className="field" placeholder="திருக்குறள் | thirukkural" />
        </div>
        <p className="text-xs text-[var(--muted)] sm:col-span-2">
          Each author and book is added as a tag with its own page: <code>/author/valluvar</code> and <code>/book/thirukkural</code>. Names are shown as written and are not translated.
        </p>
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
