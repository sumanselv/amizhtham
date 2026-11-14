import type { Metadata } from "next";
import { getLang } from "@/lib/i18n";
import { getUi } from "@/lib/ui";
import { sendContactAction } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const ui = await getUi(await getLang());
  return { title: ui.contact, description: ui.contactSub };
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const sp = await searchParams;
  const lang = await getLang();
  const ui = await getUi(lang);

  return (
    <div lang={lang} className="mx-auto max-w-xl">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">{ui.contact}</h1>
      <p className="mt-2 text-[var(--muted)]">{ui.contactSub}</p>

      {sp.sent && (
        <p role="status" className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800">
          {ui.contactSent}
        </p>
      )}
      {sp.error && (
        <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {ui.contactError}
        </p>
      )}

      <form action={sendContactAction} className="mt-6 space-y-4">
        {/* Spam trap: hidden from people, visible to bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div>
          <label htmlFor="c-name" className="mb-1 block text-sm font-semibold">
            {ui.yourName}
          </label>
          <input id="c-name" name="name" required maxLength={100} autoComplete="name" className="field w-full" />
        </div>
        <div>
          <label htmlFor="c-email" className="mb-1 block text-sm font-semibold">
            {ui.yourEmail}
          </label>
          <input id="c-email" name="email" type="email" maxLength={150} autoComplete="email" className="field w-full" />
        </div>
        <div>
          <label htmlFor="c-message" className="mb-1 block text-sm font-semibold">
            {ui.yourMessage}
          </label>
          <textarea id="c-message" name="message" required rows={6} maxLength={3000} className="field w-full" />
        </div>
        <button type="submit" className="btn btn-primary">
          {ui.send}
        </button>
      </form>
    </div>
  );
}
