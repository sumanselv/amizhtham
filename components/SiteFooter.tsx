import { BRAND } from "@/lib/brand";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--line)] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm sm:px-6 text-[var(--muted)]">
        <p lang="ta" className="max-w-3xl">
          <strong className="text-[var(--ink)]">மருத்துவ அறிவிப்பு:</strong> இந்தத் தளத்தில் உள்ள வைத்தியங்கள் பாரம்பரிய வீட்டு வைத்தியங்கள்;
          அவை பொதுவான தகவலுக்காக மட்டுமே பகிரப்படுகின்றன. இவை மருத்துவ ஆலோசனை அல்ல; மருத்துவரின் ஆலோசனைக்கு மாற்றும் அல்ல. நீங்கள் கர்ப்பமாக
          இருந்தால், மருந்துகள் உட்கொண்டால் அல்லது உடல்நலப் பிரச்சினை இருந்தால், முதலில் தகுந்த நிபுணரிடம் ஆலோசியுங்கள்.
        </p>
        <p className="mt-4">
          © {new Date().getFullYear()} <span lang="ta">{BRAND}</span>
        </p>
      </div>
    </footer>
  );
}
