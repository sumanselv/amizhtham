import { notFound } from "next/navigation";
import AdminBar from "@/components/AdminBar";
import PostForm from "@/components/PostForm";
import { requireAdmin } from "@/lib/auth";
import { getPostById, listAllTagNames } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;
  const postId = Number(id);
  if (!Number.isInteger(postId)) notFound();

  const [post, tagSuggestions] = await Promise.all([getPostById(postId), listAllTagNames()]);
  if (!post) notFound();

  return (
    <>
      <AdminBar />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <h1 className="mb-6 text-2xl font-bold">Edit post</h1>
        <div className="rounded-xl border border-[var(--line)] bg-white p-6">
          <PostForm post={post} error={error} tagSuggestions={tagSuggestions} />
        </div>
      </main>
    </>
  );
}
