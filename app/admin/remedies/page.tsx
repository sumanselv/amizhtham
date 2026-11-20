import { AdminPostList } from "@/components/AdminPostList";

export const dynamic = "force-dynamic";

export default function Page({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  return <AdminPostList filter="remedy" searchParams={searchParams} />;
}
