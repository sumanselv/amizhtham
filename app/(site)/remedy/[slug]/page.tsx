import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PostView, { postMetadata } from "@/components/PostView";
import { getPostBySlug } from "@/lib/db";
import { decodeParam, postPath } from "@/lib/slug";
import { getLang } from "@/lib/i18n";
import { getUi } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const raw = await getPostBySlug(decodeParam(slug));
  if (!raw) return { title: (await getUi(await getLang())).notFound };
  if (raw.herb_slug) return { title: (await getUi(await getLang())).notFound };
  return postMetadata(raw, postPath(raw));
}

export default async function RemedyPage({ params }: Props) {
  const { slug } = await params;
  const raw = await getPostBySlug(decodeParam(slug));
  if (!raw) notFound();
  // A medicinal-properties post lives only at /herbs/<herb>; it has no /remedy/ address.
  if (raw.herb_slug) notFound();
  return <PostView raw={raw} path={postPath(raw)} />;
}
