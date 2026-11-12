import Link from "next/link";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";
import SearchForm from "./SearchForm";
import { BRAND } from "@/lib/brand";

export const SITE_NAME = BRAND;

const HOME_LABEL = "முகப்பு";

export default function SiteHeader({ query = "" }: { query?: string }) {
  return (
    <header className="relative border-b border-[var(--line)] bg-white">
      <div className="mx-auto flex max-w-6xl items-center px-4 py-3 sm:px-6 md:py-4">
        {/* Phones and small tablets: three-line menu on the left, logo in the centre. */}
        <MobileMenu>
          <Link href="/" lang="ta" className="block rounded-lg px-3 py-2 text-lg font-semibold hover:bg-slate-100">
            {HOME_LABEL}
          </Link>
          <SearchForm idPrefix="mobile" query={query} />
        </MobileMenu>

        <Link
          href="/"
          lang="ta"
          className="mx-auto flex items-center gap-2 text-2xl font-bold text-[var(--brand-dark)] md:mx-0 md:text-[1.7rem]"
        >
          <Logo className="h-9 w-9 md:h-10 md:w-10" />
          {SITE_NAME}
        </Link>

        {/* Desktop: Home link and search box in the bar. */}
        <nav className="ml-10 hidden text-base font-semibold text-[var(--muted)] md:block">
          <Link href="/" lang="ta" className="hover:text-[var(--ink)]">
            {HOME_LABEL}
          </Link>
        </nav>
        <div className="hidden md:ml-auto md:block md:w-72 lg:w-80">
          <SearchForm idPrefix="desktop" query={query} />
        </div>

        {/* Keeps the logo exactly centred on phones (same width as the menu button). */}
        <span aria-hidden="true" className="h-11 w-11 shrink-0 -mr-2 md:hidden" />
      </div>
    </header>
  );
}
