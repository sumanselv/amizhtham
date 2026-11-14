"use server";

import { redirect } from "next/navigation";
import { createMessage } from "@/lib/db";

/** Saves a contact message; the site owner reads them in Admin > Messages. */
export async function sendContactAction(formData: FormData): Promise<void> {
  // Hidden field that real visitors never fill in; bots usually do.
  if (String(formData.get("website") ?? "").trim()) redirect("/contact?sent=1");

  const name = String(formData.get("name") ?? "").trim().slice(0, 100);
  const email = String(formData.get("email") ?? "").trim().slice(0, 150);
  const body = String(formData.get("message") ?? "").trim().slice(0, 3000);
  if (!name || !body || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) redirect("/contact?error=1");

  let ok = false;
  try {
    ok = await createMessage(name, email, body);
  } catch {
    ok = false;
  }
  redirect(ok ? "/contact?sent=1" : "/contact?error=1");
}
