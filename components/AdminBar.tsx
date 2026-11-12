import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";

export default function AdminBar() {
  return (
    <header className="border-b border-[var(--line)] bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
        <span className="font-bold text-[var(--brand-dark)]">Admin</span>
        <nav className="flex gap-4 text-sm font-medium text-[var(--muted)]">
          <Link href="/admin" className="hover:text-[var(--ink)]">
            All posts
          </Link>
          <Link href="/admin/new" className="hover:text-[var(--ink)]">
            New post
          </Link>
          <Link href="/" target="_blank" className="hover:text-[var(--ink)]">
            View site ↗
          </Link>
        </nav>
        <form action={logoutAction} className="ml-auto">
          <button type="submit" className="btn btn-ghost">
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
