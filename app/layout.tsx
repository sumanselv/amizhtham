import type { Metadata } from "next";
import "./globals.css";
import { brandFor } from "@/lib/brand";
import { getLang } from "@/lib/i18n";
import { getUi } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const ui = await getUi(lang);
  const brand = brandFor(lang);
  return {
    title: { default: brand, template: `%s | ${brand}` },
    description: ui.siteDescription,
    icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <body className="min-h-screen bg-white text-[var(--ink)] antialiased">{children}</body>
    </html>
  );
}
