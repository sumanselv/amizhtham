import { OG_PNG_BASE64 } from "@/lib/ogImage";

export function GET() {
  const bin = atob(OG_PNG_BASE64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Response(bytes, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
}
