import SearchBox from "./SearchBox";
import { getLang } from "@/lib/i18n";
import { getUi } from "@/lib/ui";

/** Search box labelled in the visitor's language (Tamil: தேடல்). The button appears once something is typed. */
export default async function SearchForm({ query = "", idPrefix }: { query?: string; idPrefix: string }) {
  const lang = await getLang();
  const ui = await getUi(lang);
  return <SearchBox idPrefix={idPrefix} query={query} label={ui.search} lang={lang} />;
}
