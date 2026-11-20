import { getEnv } from "@/lib/env";

const KEY_PATTERN = /^[a-z0-9-]{8,64}\.pdf$/;

/** Book PDFs are shown in the browser's own PDF viewer. */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key: raw } = await params;
  let key = raw;
  try {
    key = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }
  if (!KEY_PATTERN.test(key)) return new Response("Not found", { status: 404 });
  const store = getEnv().IMAGES;
  if (!store) return new Response("Not found", { status: 404 });
  const object = await store.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=86400",
      ETag: object.httpEtag,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
