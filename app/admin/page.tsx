import { AdminPostList } from "@/components/AdminPostList";

export const dynamic = "force-dynamic";

export default function AdminHome({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  return <AdminPostList filter="all" searchParams={searchParams} />;
}
