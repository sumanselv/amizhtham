import { savePostAction } from "@/app/admin/actions";
import { coverUrl } from "@/components/PostCard";
import type { PostWithTags } from "@/lib/db";
import { imagesEnabled } from "@/lib/env";
import { tagSlugFor } from "@/lib/db";
import { slugify } from "@/lib/slug";

const NOTICES: Record<string, string> = {
  saved: "Saved. This post is a draft: it is stored in the database but NOT shown on the site until you click Publish.",
  "saved-live": "Changes saved. The post is live on the site.",
  unpublished: "Unpublished. The post is saved as a draft and is no longer shown on the site.",
};

export default function PostForm({ post, error, notice, tagSuggestions }: { post?: PostWithTags; error?: string; notice?: string; tagSuggestions: string[] }) {
  // Show "name | english-url" for tags whose name is not English, so their address is visible and kept.
  const live = post?.published === 1;
  // Prefill the category when all of this post's tags share one (other than the default "tag").
  const sections = [...new Set(post?.tags.map((t) => t.section) ?? [])];
  const categoryDefault = sections.length === 1 && sections[0] !== "tag" ? sections[0] : "";
  const tagDefault = post?.tags.map((t) => (tagSlugFor(t.name) === t.slug ? t.name : `${t.name} | ${t.slug}`)).join(", ");
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

      <div>
        <label htmlFor="tags" className="mb-1 block text-sm font-semibold">
          Remedy tags <span className="font-normal text-[var(--muted)]">(comma separated, any language)</span>
        </label>
        <input id="tags" name="tags" list="tag-list" defaultValue={tagDefault} className="field" placeholder="நெல்லிக்காய் | amla, தேன் | honey" />
        <p className="mt-1 text-xs text-[var(--muted)]">
          Tags can be in any language. The web address uses the English name: common names such as நெல்லிக்காய் become <code>/tag/amla</code> on their own.
          For any other tag add the English name after a bar, e.g. <code>கடலை மாவு | gram-flour</code>. You can fix addresses later in Admin &gt; Tags.
        </p>
        <datalist id="tag-list">
          {tagSuggestions.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>

      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-semibold">
          Category <span className="font-normal text-[var(--muted)]">(optional, English)</span>
        </label>
        <input id="category" name="category" defaultValue={categoryDefault} maxLength={30} className="field" placeholder="fruit" />
        <p className="mt-1 text-xs text-[var(--muted)]">
          Leave empty for the usual <code>/tag/amla</code>. Type <code>fruit</code> and this post&apos;s tags use <code>/fruit/amla</code> instead
          (old addresses redirect). It changes the tags above, so every post with those tags follows.
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
          An original verse. It is shown in slanted type on the post and is <strong>never translated</strong>, in any language.
        </p>
        <label htmlFor="poem" className="mb-1 mt-3 block text-sm font-semibold">
          Poem
        </label>
        <textarea id="poem" name="poem" rows={5} maxLength={3000} defaultValue={post?.poem} className="field italic" placeholder="One line per row, as it should appear" />
        <label htmlFor="poet" className="mb-1 mt-3 block text-sm font-semibold">
          Poet
        </label>
        <input id="poet" name="poet" maxLength={100} defaultValue={post?.poet} className="field" placeholder="Poet's name" />
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
