import { LOGO_PATH, LOGO_SPROUT } from "@/lib/logo";

/** Green nectar-drop logo with a herb sprout. Decorative: the brand name is written next to it. */
export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <defs>
        <linearGradient id="amizhtham-drop" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#63c78f" />
          <stop offset=".55" stopColor="#2f8a56" />
          <stop offset="1" stopColor="#1b5232" />
        </linearGradient>
        <radialGradient id="amizhtham-shine" cx=".3" cy=".25" r=".6">
          <stop offset="0" stopColor="#fff" stopOpacity=".45" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={LOGO_PATH} fill="url(#amizhtham-drop)" />
      <path d={LOGO_PATH} fill="url(#amizhtham-shine)" />
      <g dangerouslySetInnerHTML={{ __html: LOGO_SPROUT }} />
    </svg>
  );
}
