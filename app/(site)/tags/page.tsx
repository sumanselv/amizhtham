import type { Metadata } from "next";
import Link from "next/link";
import { listTags } from "@/lib/db";
import { langOf, tagHref } from "@/lib/slug";
import { getLang, localizeTags } from "@/lib/i18n";
import { getUi } from "@/lib/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const ui = await getUi(await getLang());
  return { title: ui.allRemedies, description: ui.allRemediesSub };
}

export default async function TagsPage() {
  const lang = await getLang();
  const [rawTags, ui] = await Promise.all([listTags(), getUi(lang)]);
  const tags = await localizeTags(lang, rawTags);
  return (
    <>
      <h1 lang={lang} className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">{ui.allRemedies}</h1>
      <p lang={lang} className="mt-2 text-[var(--muted)]">{ui.allRemediesSub}</p>

      {tags.length === 0 ? (
        <p lang={lang} className="mt-8 text-[var(--muted)]">{ui.noTags}</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:mt-8 sm:gap-4 lg:grid-cols-4">
          {tags.map((tag) => (
            <li key={tag.id}>
              <Link
                href={tagHref(tag)}
                className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white p-4 font-semibold hover:border-[var(--brand)] hover:shadow-sm"
              >
                <span lang={langOf(tag.name)}>{tag.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
