import { BRAND } from "@/lib/brand";
import { getLang } from "@/lib/i18n";
import { getUi } from "@/lib/ui";

export default async function SiteFooter() {
  const lang = await getLang();
  const ui = await getUi(lang);
  return (
    <footer className="mt-16 border-t border-[var(--line)] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm sm:px-6 text-[var(--muted)]">
        <p lang={lang} className="max-w-3xl">
          <strong className="text-[var(--ink)]">{ui.disclaimerTitle}</strong> {ui.disclaimerFooter}
        </p>
        <p className="mt-4">
          © {new Date().getFullYear()} <span lang="ta">{BRAND}</span>
        </p>
      </div>
    </footer>
  );
}
