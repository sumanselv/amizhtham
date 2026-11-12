import { getEnv } from "@/lib/env";

const KEY_PATTERN = /^[a-z0-9-]{8,64}\.(jpg|png|webp|gif|avif)$/;

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key: raw } = await params;
  let key = raw;
  try {
    key = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }
  if (!KEY_PATTERN.test(key)) return new Response("Not found", { status: 404 });

  const object = await getEnv().IMAGES.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      // Image keys are random and never reused, so they can be cached for a long time.
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: object.httpEtag,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
