"use client";

import { useState } from "react";

/** Search input; the button only shows up once the visitor has typed something (Enter always searches). */
export default function SearchBox({ idPrefix, query, label, lang }: { idPrefix: string; query: string; label: string; lang: string }) {
  const [value, setValue] = useState(query);
  const hasText = value.trim().length > 0;

  return (
    <form action="/" method="get" role="search" className="flex w-full gap-2">
      <label htmlFor={`${idPrefix}-q`} className="sr-only" lang={lang}>
        {label}
      </label>
      <input
        id={`${idPrefix}-q`}
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={label}
        lang={lang}
        className="field min-w-0 flex-1"
      />
      {hasText && (
        <button type="submit" lang={lang} className="btn btn-primary shrink-0">
          {label}
        </button>
      )}
    </form>
  );
}
