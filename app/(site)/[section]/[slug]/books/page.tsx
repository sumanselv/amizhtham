import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { brandFor } from "@/lib/brand";
import { getTagBySlug, listBooksByAuthor } from "@/lib/db";
import { decodeParam, langOf, tagHref } from "@/lib/slug";
import { getLang, getPrefix, localizeTags, withPrefix } from "@/lib/i18n";
import { alternatesFor, shareMeta } from "@/lib/seo";
import { getUi } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ section: string; slug: string }> };

/** /author/<name>/books: every book by that author (books that share a post with the author). */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = await getTagBySlug(decodeParam(slug));
  const lang = await getLang();
  const ui = await getUi(lang);
  if (!author || author.section !== "author") return { title: ui.notFound };
  const title = `${ui.booksByAuthor}: ${author.name}`;
  const alternates = alternatesFor(lang, `${tagHref(author)}/books`);
  return { title, description: title, alternates, ...shareMeta({ lang, title: `${title} | ${brandFor(lang)}`, description: title, url: alternates.canonical, siteName: brandFor(lang) }) };
}

export default async function AuthorBooksPage({ params }: Props) {
  const { section, slug } = await params;
  const author = await getTagBySlug(decodeParam(slug));
  if (!author || author.section !== "author") notFound();
  const lang = await getLang();
  const prefix = await getPrefix();
  if (decodeParam(section) !== author.section) redirect(withPrefix(prefix, `${tagHref(author)}/books`));

  const ui = await getUi(lang);
  const [[tag], books] = await Promise.all([localizeTags(lang, [author]), listBooksByAuthor(author.slug)]);

  return (
    <>
      <nav className="mb-4 text-sm text-[var(--muted)]">
        <Link href={withPrefix(prefix, "/")} lang={lang} className="hover:text-[var(--ink)]">
          {ui.home}
        </Link>
        {" / "}
        <Link href={withPrefix(prefix, tagHref(author))} lang={langOf(tag.name)} className="hover:text-[var(--ink)]">
          {tag.name}
        </Link>
      </nav>

      <h1 lang={lang} className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
        {ui.booksByAuthor}: <span lang={langOf(tag.name)}>{tag.name}</span>
      </h1>

      {books.length === 0 ? (
        <p lang={lang} className="mt-8 rounded-xl border border-dashed border-[var(--line)] p-10 text-center text-[var(--muted)]">
          {ui.noBooks}
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:mt-8 sm:gap-4 lg:grid-cols-3">
          {books.map((b) => (
            <li key={b.id}>
              <Link
                href={withPrefix(prefix, tagHref(b))}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-white p-4 font-semibold hover:border-[var(--brand)] hover:shadow-sm"
              >
                <span lang={langOf(b.name)}>{b.name}</span>
                <span lang={lang} className="shrink-0 text-xs font-normal text-[var(--muted)]">
                  {b.post_count} {ui.postsCount}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
