import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "அமிழ்தம் - எளிய வீட்டு வைத்தியம்", template: "%s | அமிழ்தம்" },
  description: "எளிய பொருட்களுடன் பாரம்பரிய வீட்டு வைத்தியங்கள். நெல்லிக்காய், மஞ்சள், இஞ்சி போன்ற பொருட்கள் வாரியாகப் பாருங்கள்.",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ta">
      <body className="min-h-screen bg-white text-[var(--ink)] antialiased">{children}</body>
    </html>
  );
}
