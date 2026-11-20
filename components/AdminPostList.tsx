import Link from "next/link";
import AdminBar from "@/components/AdminBar";
import DeleteButton from "@/components/DeleteButton";
import { deletePostAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { listPosts } from "@/lib/db";
import { formatDate, postPath } from "@/lib/slug";

export type PostFilter = "all" | "remedy" | "properties";

const TITLES: Record<PostFilter, string> = { all: "All posts", remedy: "Remedy posts", properties: "Medicinal properties" };

/** The admin list of posts: all of them, only remedies, or only medicinal-properties posts. */
export async function AdminPostList({ filter, searchParams }: { filter: PostFilter; searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const everything = await listPosts({ includeDrafts: true, pageSize: 200 });
  const posts = everything.posts.filter((p) => (filter === "remedy" ? !p.herb_page : filter === "properties" ? !!p.herb_page : true));
  const total = posts.length;

  return (
    <>
      <AdminBar />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">{TITLES[filter]} ({total})</h1>
          <Link href={filter === "all" ? "/admin/new" : `/admin/new?type=${filter}`} className="btn btn-primary">
            + New {filter === "properties" ? "medicinal properties post" : filter === "remedy" ? "remedy post" : "post"}
          </Link>
        </div>

        {sp.saved && <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{sp.saved === "published" ? "Post published. It is now visible on the site." : "Post saved."}</p>}
        {sp.deleted && <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">Post deleted.</p>}

        <div className="mt-6 overflow-hidden rounded-xl border border-[var(--line)] bg-white">
          {posts.length === 0 ? (
            <p className="p-8 text-center text-[var(--muted)]">Nothing here yet. Create the first one.</p>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {posts.map((post) => (
                <li key={post.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{post.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${post.published ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"}`}
                      >
                        {post.published ? "Published" : "Draft"}
                      </span>
                      <span>{formatDate(post.published_at ?? post.created_at)}</span>
                      {post.tags.map((t) => (
                        <span key={t.id} className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[var(--brand-dark)]">
                          {t.name}
                        </span>
                      ))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.published === 1 && (
                      <Link href={postPath(post)} target="_blank" className="btn btn-ghost">
                        View
                      </Link>
                    )}
                    <Link href={`/admin/edit/${post.id}`} className="btn btn-ghost">
                      Edit
                    </Link>
                    <form action={deletePostAction}>
                      <input type="hidden" name="id" value={post.id} />
                      <DeleteButton title={post.title} />
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
