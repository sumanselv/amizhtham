/** Search box and button, both labelled in Tamil (தேடல்). */
export default function SearchForm({ query = "", idPrefix }: { query?: string; idPrefix: string }) {
  return (
    <form action="/" method="get" role="search" className="flex w-full gap-2">
      <label htmlFor={`${idPrefix}-q`} className="sr-only" lang="ta">
        தேடல்
      </label>
      <input
        id={`${idPrefix}-q`}
        type="search"
        name="q"
        defaultValue={query}
        placeholder="தேடல்"
        lang="ta"
        className="field min-w-0 flex-1"
      />
      <button type="submit" lang="ta" className="btn btn-primary shrink-0">
        தேடல்
      </button>
    </form>
  );
}
