import type { Metadata } from "next";
import "./globals.css";
import { getLang } from "@/lib/i18n";
import { getUi } from "@/lib/ui";

export async function generateMetadata(): Promise<Metadata> {
  const ui = await getUi(await getLang());
  return {
    title: { default: ui.siteTitle, template: "%s | அமிழ்தம்" },
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
