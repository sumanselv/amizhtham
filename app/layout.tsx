import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Instant Remedy - Simple Home Remedies", template: "%s | Instant Remedy" },
  description: "Simple, traditional home remedies with easy ingredients. Browse by remedy such as amla, turmeric, ginger and more.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-[var(--ink)] antialiased">{children}</body>
    </html>
  );
}
