import type { Metadata } from "next";
import Link from "next/link";
import { listTags } from "@/lib/db";
import { langOf } from "@/lib/slug";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "அனைத்து வைத்தியங்கள்",
  description: "எல்லா வீட்டு வைத்தியப் பொருட்களையும், அவற்றைப் பயன்படுத்தும் பதிவுகளையும் பாருங்கள்.",
};

export default async function TagsPage() {
  const tags = await listTags();
  return (
    <>
      <h1 lang="ta" className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">அனைத்து வைத்தியங்கள்</h1>
      <p lang="ta" className="mt-2 text-[var(--muted)]">ஒரு பொருளைத் தேர்ந்தெடுத்தால், அதைப் பயன்படுத்தும் அனைத்துப் பதிவுகளும் தெரியும்.</p>

      {tags.length === 0 ? (
        <p lang="ta" className="mt-8 text-[var(--muted)]">இன்னும் குறிச்சொற்கள் இல்லை.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:mt-8 sm:gap-4 lg:grid-cols-4">
          {tags.map((tag) => (
            <li key={tag.id}>
              <Link
                href={`/tag/${encodeURIComponent(tag.slug)}`}
                className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white p-4 font-semibold hover:border-[var(--brand)] hover:shadow-sm"
              >
                <span lang={langOf(tag.name)}>{tag.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
