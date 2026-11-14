import AdminBar from "@/components/AdminBar";
import { deleteMessageAction } from "../actions";
import { requireAdmin } from "@/lib/auth";
import { listMessages } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  await requireAdmin();
  const messages = await listMessages();

  return (
    <>
      <AdminBar />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Messages sent from the Contact page, newest first.</p>

        {messages.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-[var(--line)] bg-white p-8 text-center text-[var(--muted)]">No messages yet.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {messages.map((m) => (
              <li key={m.id} className="rounded-xl border border-[var(--line)] bg-white p-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-semibold">{m.name}</span>
                  {m.email && (
                    <a href={`mailto:${m.email}`} className="text-sm text-[var(--brand-dark)] underline">
                      {m.email}
                    </a>
                  )}
                  <span className="text-xs text-[var(--muted)]">{new Date(m.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{m.body}</p>
                <form action={deleteMessageAction} className="mt-3">
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="btn btn-ghost text-sm">
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
