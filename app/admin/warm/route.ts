import { requireAdmin } from "@/lib/auth";
import { listPosts } from "@/lib/db";
import { warmPost } from "@/lib/i18n";

/** Admin only: /admin/warm translates every published post into English (a bit at a time). Open it again until it says "all done". */
export async function GET() {
  await requireAdmin();
  const { posts } = await listPosts({ pageSize: 200, withContent: true });
  let remaining = 0;
  const lines: string[] = [];
  const started = Date.now();
  let checked = 0;
  for (const post of posts) {
    if (Date.now() - started > 20_000) break; // keep each visit short
    const left = await warmPost("en", post);
    checked++;
    remaining += left;
    lines.push(`${left === 0 ? "done" : `${left} left`}: ${post.slug}`);
  }
  const more = posts.length > checked;
  const status = remaining === 0 && !more ? "all done" : "open this page again to continue";
  return new Response(`English translation of published posts: ${status}\n\n${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
