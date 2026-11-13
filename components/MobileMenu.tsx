"use client";

import { useEffect, useState } from "react";

/**
 * Three-line (hamburger) button for small screens. It opens a panel under the header
 * that holds the Home link and the search box. Hidden from the medium breakpoint up.
 */
export default function MobileMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
        className="-mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--ink)] hover:bg-slate-100 md:hidden"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 6.5h16M4 12h16M4 17.5h16" />
        </svg>
      </button>

      {open && (
        <div
          id="mobile-menu"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
          className="absolute inset-x-0 top-full z-30 space-y-4 border-b border-[var(--line)] bg-white p-4 shadow-lg md:hidden"
        >
          {children}
        </div>
      )}
    </>
  );
}
