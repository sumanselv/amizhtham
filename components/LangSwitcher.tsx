import { LANGUAGES, getLang, languageOf } from "@/lib/i18n";
import { getUi } from "@/lib/ui";

/** Language picker. It starts on the visitor's phone/browser language; choosing one here is remembered. Works without JavaScript. */
export default async function LangSwitcher({ align = "right" }: { align?: "right" | "inline" }) {
  const lang = await getLang();
  const ui = await getUi(lang);
  const current = languageOf(lang);

  return (
    <details className={`group ${align === "right" ? "relative" : ""}`}>
      <summary
        aria-label={ui.language}
        className="flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 text-sm font-semibold hover:border-[var(--brand)] [&::-webkit-details-marker]:hidden"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
        </svg>
        <span lang={current.code}>{current.name}</span>
      </summary>
      <ul
        className={`z-30 mt-2 grid w-44 gap-0.5 rounded-xl border border-[var(--line)] bg-white p-1.5 shadow-lg ${
          align === "right" ? "absolute right-0" : ""
        }`}
      >
        {LANGUAGES.map((l) => (
          <li key={l.code}>
            <a
              href={`/lang?l=${l.code}`}
              lang={l.code}
              hrefLang={l.code}
              aria-current={l.code === lang ? "true" : undefined}
              className={`block rounded-lg px-3 py-1.5 text-sm hover:bg-slate-100 ${l.code === lang ? "bg-[var(--brand-soft)] font-bold text-[var(--brand-dark)]" : ""}`}
            >
              {l.name}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
