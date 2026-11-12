import Link from "next/link";
import Logo from "./Logo";

export const SITE_NAME = "Amizhtham";

export default function SiteHeader({ query = "" }: { query?: string }) {
  return (
    <header className="border-b border-[var(--line)] bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-[var(--brand-dark)]">
          <Logo className="h-9 w-9" />
          {SITE_NAME}
        </Link>
        <nav className="flex gap-5 text-sm font-medium text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--ink)]">
            Home
          </Link>
          <Link href="/tags" className="hover:text-[var(--ink)]">
            All remedies
          </Link>
        </nav>
        <form action="/" method="get" className="ml-auto flex w-full gap-2 sm:w-auto">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search remedies, e.g. amla"
            aria-label="Search remedies"
            className="field sm:w-64"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>
    </header>
  );
}
