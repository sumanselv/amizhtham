import { LOGO_PATH } from "@/lib/logo";

/** Green drop logo. Decorative: the brand name is written next to it. */
export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <defs>
        <linearGradient id="amizhtham-drop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4fb67a" />
          <stop offset="1" stopColor="#226039" />
        </linearGradient>
      </defs>
      <path d={LOGO_PATH} fill="url(#amizhtham-drop)" />
      <path d="M8.6 14.6c.2 2 1.5 3.3 3.2 3.6" fill="none" stroke="#ffffff" strokeOpacity=".75" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
