"use server";

import { redirect } from "next/navigation";
import { checkPassword, endSession, requireAdmin, startSession } from "@/lib/auth";
import { createPost, deletePost, getPostById, isImageInUse, updatePost, type PostInput } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { parseTagInput } from "@/lib/slug";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/* ------------------------------ login / logout ------------------------------ */

export async function loginAction(formData: FormData): Promise<void> {
  const password = String(formData.get("password") ?? "");
  if (await checkPassword(password)) {
    await startSession();
    redirect("/admin");
  }
  await new Promise((resolve) => setTimeout(resolve, 800)); // slow down guessing
  redirect("/admin/login?error=1");
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/admin/login");
}

/* ------------------------------ images ------------------------------ */

type ImageKind = { ext: string; type: string };

/** Identify an image by its first bytes instead of trusting the file name or browser-supplied type. */
function sniffImage(b: Uint8Array): ImageKind | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", type: "image/png" };
  if (b.length > 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return { ext: "gif", type: "image/gif" };
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50)
    return { ext: "webp", type: "image/webp" };
  if (b.length > 12 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 && b[8] === 0x61 && b[9] === 0x76 && b[10] === 0x69 && b[11] === 0x66)
    return { ext: "avif", type: "image/avif" };
  return null;
}

async function storeImage(file: File, backTo: string): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) redirect(`${backTo}?error=${encodeURIComponent("Image is larger than 5 MB.")}`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) redirect(`${backTo}?error=${encodeURIComponent("Cover must be a JPG, PNG, WebP, GIF or AVIF image.")}`);
  const key = `${crypto.randomUUID()}.${kind.ext}`;
  await getEnv().IMAGES.put(key, bytes.buffer as ArrayBuffer, { httpMetadata: { contentType: kind.type } });
  return key;
}

async function removeImageIfUnused(key: string | null, exceptPostId?: number): Promise<void> {
  if (!key) return;
  if (await isImageInUse(key, exceptPostId)) return;
  await getEnv().IMAGES.delete(key);
}

/* ------------------------------ posts ------------------------------ */

export async function savePostAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const idRaw = String(formData.get("id") ?? "");
  const id = idRaw ? Number(idRaw) : null;
  if (id !== null && !Number.isInteger(id)) redirect("/admin");
  const backTo = id ? `/admin/edit/${id}` : "/admin/new";

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  const slug = String(formData.get("slug") ?? "").trim();
  const published = formData.get("published") === "on";
  const tags = parseTagInput(String(formData.get("tags") ?? ""));

  if (!title) redirect(`${backTo}?error=${encodeURIComponent("Title is required.")}`);
  if (title.length > 150) redirect(`${backTo}?error=${encodeURIComponent("Title is too long (max 150 characters).")}`);
  if (description.length > 300) redirect(`${backTo}?error=${encodeURIComponent("Description is too long (max 300 characters).")}`);
  if (content.length > 100_000) redirect(`${backTo}?error=${encodeURIComponent("Post body is too long.")}`);

  const existing = id ? await getPostById(id) : null;
  if (id && !existing) redirect("/admin");

  let cover = existing?.cover_image ?? null;
  let replacedCover: string | null = null; // old file to clean up after the post is saved
  const removeCover = formData.get("remove_cover") === "on";
  const upload = formData.get("cover");

  if (upload instanceof File && upload.size > 0) {
    replacedCover = cover;
    cover = await storeImage(upload, backTo);
  } else if (removeCover) {
    replacedCover = cover;
    cover = null;
  }

  const input: PostInput = { title, slug, description, content, cover_image: cover, published, tags };

  if (id) {
    await updatePost(id, input);
    if (replacedCover && replacedCover !== cover) await removeImageIfUnused(replacedCover, id);
  } else {
    await createPost(input);
  }

  redirect("/admin?saved=1");
}

export async function deletePostAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect("/admin");
  const cover = await deletePost(id);
  await removeImageIfUnused(cover);
  redirect("/admin?deleted=1");
}
