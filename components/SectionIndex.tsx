import type { Metadata } from "next";
import Link from "next/link";
import { listTagsInSection } from "@/lib/db";
import { langOf, tagHref } from "@/lib/slug";
import { brandFor } from "@/lib/brand";
import { getLang, getPrefix, localizeTags, withPrefix } from "@/lib/i18n";
import { alternatesFor, shareMeta } from "@/lib/seo";
import { getUi } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Kind = "herbs" | "causes";

export async function indexMetadata(kind: Kind): Promise<Metadata> {
  const lang = await getLang();
  const ui = await getUi(lang);
  const title = ui[kind];
  const description = kind === "herbs" ? ui.herbsSub : ui.causesSub;
  const alternates = alternatesFor(lang, `/${kind}`);
  return { title, description, alternates, ...shareMeta({ lang, title: `${title} | ${brandFor(lang)}`, description, url: alternates.canonical, siteName: brandFor(lang) }) };
}

/** A page listing every herb (or every cause) that has a published post. */
export default async function SectionIndex({ kind }: { kind: Kind }) {
  const lang = await getLang();
  const prefix = await getPrefix();
  const [raw, ui] = await Promise.all([listTagsInSection(kind), getUi(lang)]);
  const entries = await localizeTags(lang, raw);
  return (
    <>
      <h1 lang={lang} className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">{ui[kind]}</h1>
      <p lang={lang} className="mt-2 text-[var(--muted)]">{kind === "herbs" ? ui.herbsSub : ui.causesSub}</p>

      {entries.length === 0 ? (
        <p lang={lang} className="mt-8 text-[var(--muted)]">{ui.noEntries}</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:mt-8 sm:gap-4 lg:grid-cols-4">
          {entries.map((tag, i) => (
            <li key={tag.id}>
              <Link
                href={withPrefix(prefix, tagHref(raw[i]))}
                className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white p-4 font-semibold hover:border-[var(--brand)] hover:shadow-sm"
              >
                <span lang={langOf(tag.name)}>{tag.name}</span>
                <span className="text-sm font-normal text-[var(--muted)]">{raw[i].post_count}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
