import { brandFor, mottoFor } from "@/lib/brand";
import { getLang } from "@/lib/i18n";
import { getUi } from "@/lib/ui";

export default async function SiteFooter() {
  const lang = await getLang();
  const ui = await getUi(lang);
  return (
    <footer className="mt-16 border-t border-[var(--line)] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-700 sm:px-6">
        <p lang={lang} className="max-w-3xl">
          {ui.disclaimerFooter}
        </p>
        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
          <a href="/contact" lang={lang} className="font-semibold hover:text-[var(--ink)]">{ui.contact}</a>
          © {new Date().getFullYear()} <span lang={lang === "ta" ? "ta" : "en"}>{brandFor(lang)}</span>
        </p>
        <p lang={lang === "ta" ? "ta" : "en"} className="mt-6 text-center">
          {mottoFor(lang)}
        </p>
      </div>
    </footer>
  );
}
