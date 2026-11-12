import { LOGO_SVG } from "@/lib/logo";

/** Browser-tab icon (favicon), served at /icon.svg. */
export function GET() {
  return new Response(LOGO_SVG, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
