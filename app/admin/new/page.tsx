import AdminBar from "@/components/AdminBar";
import PostForm from "@/components/PostForm";
import { requireAdmin } from "@/lib/auth";
import { listAllTagNames } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewPostPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { error } = await searchParams;
  const tagSuggestions = await listAllTagNames();
  return (
    <>
      <AdminBar />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <h1 className="mb-6 text-2xl font-bold">New post</h1>
        <div className="rounded-xl border border-[var(--line)] bg-white p-6">
          <PostForm error={error} tagSuggestions={tagSuggestions} />
        </div>
      </main>
    </>
  );
}
