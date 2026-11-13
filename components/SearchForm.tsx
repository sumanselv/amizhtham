import { getLang } from "@/lib/i18n";
import { getUi } from "@/lib/ui";

/** Search box and button, labelled in the visitor's language (Tamil: தேடல்). */
export default async function SearchForm({ query = "", idPrefix }: { query?: string; idPrefix: string }) {
  const lang = await getLang();
  const ui = await getUi(lang);
  return (
    <form action="/" method="get" role="search" className="flex w-full gap-2">
      <label htmlFor={`${idPrefix}-q`} className="sr-only" lang={lang}>
        {ui.search}
      </label>
      <input
        id={`${idPrefix}-q`}
        type="search"
        name="q"
        defaultValue={query}
        placeholder={ui.search}
        lang={lang}
        className="field min-w-0 flex-1"
      />
      <button type="submit" lang={lang} className="btn btn-primary shrink-0">
        {ui.search}
      </button>
    </form>
  );
}
