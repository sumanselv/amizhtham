import { BRAND } from "@/lib/brand";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--line)] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm sm:px-6 text-[var(--muted)]">
        <p className="max-w-3xl">
          <strong className="text-[var(--ink)]">Health disclaimer:</strong> The remedies on this site are traditional home
          remedies shared for general information only. They are not medical advice and are not a substitute for a doctor.
          If you are pregnant, taking medicines, or have a health condition, check with a qualified professional first.
        </p>
        <p className="mt-4">
          © {new Date().getFullYear()} <span lang="ta">{BRAND}</span>
        </p>
      </div>
    </footer>
  );
}
