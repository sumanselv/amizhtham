import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import PostView, { postMetadata } from "@/components/PostView";
import { getPostBySlug } from "@/lib/db";
import { decodeParam, postPath } from "@/lib/slug";
import { getLang, getPrefix, withPrefix } from "@/lib/i18n";
import { getUi } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const raw = await getPostBySlug(decodeParam(slug));
  if (!raw) return { title: (await getUi(await getLang())).notFound };
  return postMetadata(raw, postPath(raw));
}

export default async function RemedyPage({ params }: Props) {
  const { slug } = await params;
  const raw = await getPostBySlug(decodeParam(slug));
  if (!raw) notFound();
  // A herb's medicinal-properties post lives at /herbs/<herb>: the old /remedy/ address goes there.
  if (raw.herb_slug) permanentRedirect(withPrefix(await getPrefix(), postPath(raw)));
  return <PostView raw={raw} path={postPath(raw)} />;
}
