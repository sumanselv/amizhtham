import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Amizhtham - Simple Home Remedies", template: "%s | Amizhtham" },
  description: "Simple, traditional home remedies with easy ingredients. Browse by remedy such as amla, turmeric, ginger and more.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-[var(--ink)] antialiased">{children}</body>
    </html>
  );
}
