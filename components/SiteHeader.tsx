import Link from "next/link";
import MobileMenu from "./MobileMenu";
import SearchForm from "./SearchForm";
import LangSwitcher from "./LangSwitcher";
import { brandFor } from "@/lib/brand";
import { getLang, prefixFor, withPrefix } from "@/lib/i18n";
import { getUi } from "@/lib/ui";

export default async function SiteHeader({ query = "" }: { query?: string }) {
  const lang = await getLang();
  const ui = await getUi(lang);
  const HOME_LABEL = ui.home;
  const brand = brandFor(lang);
  const home = withPrefix(prefixFor(lang), "/");
  const contact = withPrefix(prefixFor(lang), "/contact");
  const herbs = withPrefix(prefixFor(lang), "/herbs");
  const causes = withPrefix(prefixFor(lang), "/causes");
  return (
    <header className="relative border-b border-[var(--line)] bg-white">
      <div className="mx-auto flex max-w-6xl items-center px-4 py-3 sm:px-6 md:py-4">
        {/* Phones: empty spacer on the left, same width as the menu button, so the brand name stays centred. */}
        <span aria-hidden="true" className="-ml-2 h-11 w-11 shrink-0 md:hidden" />

        <Link
          href={home}
          lang={lang === "ta" ? "ta" : "en"}
          className="mx-auto flex items-center gap-2 text-2xl font-bold text-[var(--brand-dark)] md:mx-0 md:text-[1.7rem]"
        >
          {brand}
        </Link>

        {/* Desktop: Home link and search box in the bar. */}
        <nav className="ml-10 hidden text-base font-semibold text-[var(--muted)] md:block">
          <Link href={home} lang={lang} className="hover:text-[var(--ink)]">
            {HOME_LABEL}
          </Link>
          <Link href={herbs} lang={lang} className="ml-6 hover:text-[var(--ink)]">
            {ui.herbs}
          </Link>
          <Link href={causes} lang={lang} className="ml-6 hover:text-[var(--ink)]">
            {ui.causes}
          </Link>
          <Link href={contact} lang={lang} className="ml-6 hover:text-[var(--ink)]">
            {ui.contact}
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
          <Link href={home} lang={lang} className="block rounded-lg px-3 py-2 text-lg font-semibold hover:bg-slate-100">
            {HOME_LABEL}
          </Link>
          <Link href={herbs} lang={lang} className="block rounded-lg px-3 py-2 text-lg font-semibold hover:bg-slate-100">
            {ui.herbs}
          </Link>
          <Link href={causes} lang={lang} className="block rounded-lg px-3 py-2 text-lg font-semibold hover:bg-slate-100">
            {ui.causes}
          </Link>
          <Link href={contact} lang={lang} className="block rounded-lg px-3 py-2 text-lg font-semibold hover:bg-slate-100">
            {ui.contact}
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
