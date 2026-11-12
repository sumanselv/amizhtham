import { savePostAction } from "@/app/admin/actions";
import { coverUrl } from "@/components/PostCard";
import type { PostWithTags } from "@/lib/db";

export default function PostForm({ post, error, tagSuggestions }: { post?: PostWithTags; error?: string; tagSuggestions: string[] }) {
  return (
    <form action={savePostAction} encType="multipart/form-data" className="space-y-6">
      {post && <input type="hidden" name="id" value={post.id} />}

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
          URL name <span className="font-normal text-[var(--muted)]">(optional - made from the title if empty)</span>
        </label>
        <input id="slug" name="slug" defaultValue={post?.slug} className="field" placeholder="amla-juice-for-vitamin-c" />
        <p className="mt-1 text-xs text-[var(--muted)]">The post address will be /remedy/this-name. Changing it later breaks old links.</p>
      </div>

      <div>
        <label htmlFor="tags" className="mb-1 block text-sm font-semibold">
          Remedy tags <span className="font-normal text-[var(--muted)]">(comma separated, e.g. Amla, Honey)</span>
        </label>
        <input id="tags" name="tags" list="tag-list" defaultValue={post?.tags.map((t) => t.name).join(", ")} className="field" placeholder="Amla, Honey" />
        <datalist id="tag-list">
          {tagSuggestions.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
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
        <input id="cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="block w-full text-sm" />
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

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="published" defaultChecked={post ? post.published === 1 : true} />
        Published (untick to keep it as a draft that only you can see)
      </label>

      <div className="flex gap-3">
        <button type="submit" className="btn btn-primary">
          {post ? "Save changes" : "Publish post"}
        </button>
        <a href="/admin" className="btn btn-ghost">
          Cancel
        </a>
      </div>
    </form>
  );
}
