import { redirect } from "next/navigation";
import { loginAction } from "../actions";
import { adminConfigured, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;
  const configured = adminConfigured();

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">Admin login</h1>

        {!configured ? (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            No admin password is set yet. Set the <code>ADMIN_PASSWORD</code> secret (at least 8 characters) - see the README.
          </p>
        ) : (
          <form action={loginAction} className="mt-4 space-y-4">
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                Wrong password. Try again.
              </p>
            )}
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-semibold">
                Password
              </label>
              <input id="password" name="password" type="password" required autoFocus autoComplete="current-password" className="field" />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Log in
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
