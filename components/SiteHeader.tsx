import Link from "next/link";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";
import SearchForm from "./SearchForm";
import LangSwitcher from "./LangSwitcher";
import { BRAND } from "@/lib/brand";
import { getLang } from "@/lib/i18n";
import { getUi } from "@/lib/ui";

export const SITE_NAME = BRAND;

export default async function SiteHeader({ query = "" }: { query?: string }) {
  const lang = await getLang();
  const ui = await getUi(lang);
  const HOME_LABEL = ui.home;
  return (
    <header className="relative border-b border-[var(--line)] bg-white">
      <div className="mx-auto flex max-w-6xl items-center px-4 py-3 sm:px-6 md:py-4">
        {/* Phones: empty spacer on the left, same width as the menu button, so the logo stays centred. */}
        <span aria-hidden="true" className="-ml-2 h-11 w-11 shrink-0 md:hidden" />

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
          <Link href="/" lang={lang} className="hover:text-[var(--ink)]">
            {HOME_LABEL}
          </Link>
        </nav>
        <div className="hidden md:ml-auto md:block md:w-72 lg:w-80">
          <SearchForm idPrefix="desktop" query={query} />
        </div>
        <div className="ml-3 hidden md:block">
          <LangSwitcher />
        </div>

        {/* Phones and small tablets: three-line menu on the right (Home link and search inside). */}
        <MobileMenu>
          <Link href="/" lang={lang} className="block rounded-lg px-3 py-2 text-lg font-semibold hover:bg-slate-100">
            {HOME_LABEL}
          </Link>
          <SearchForm idPrefix="mobile" query={query} />
          <div className="mt-3">
            <LangSwitcher align="inline" />
          </div>
        </MobileMenu>
      </div>
    </header>
  );
}
