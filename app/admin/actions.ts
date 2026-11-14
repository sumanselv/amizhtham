"use server";

import { redirect } from "next/navigation";
import { checkPassword, endSession, requireAdmin, startSession } from "@/lib/auth";
import { createPost, deleteMessage, deletePost, getPostById, isImageInUse, listAllTags, updatePost, updateTag, type PostInput } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { cleanSection, parseTagInput, slugify } from "@/lib/slug";

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
  const images = getEnv().IMAGES;
  if (!images) redirect(`${backTo}?error=${encodeURIComponent("Image upload is not set up yet (R2 is not enabled). Save the post without an image for now.")}`);
  if (file.size > MAX_IMAGE_BYTES) redirect(`${backTo}?error=${encodeURIComponent("Image is larger than 5 MB.")}`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) redirect(`${backTo}?error=${encodeURIComponent("Cover must be a JPG, PNG, WebP, GIF or AVIF image.")}`);
  const key = `${crypto.randomUUID()}.${kind.ext}`;
  await images.put(key, bytes.buffer as ArrayBuffer, { httpMetadata: { contentType: kind.type } });
  return key;
}

async function removeImageIfUnused(key: string | null, exceptPostId?: number): Promise<void> {
  if (!key) return;
  const images = getEnv().IMAGES;
  if (!images) return;
  if (await isImageInUse(key, exceptPostId)) return;
  await images.delete(key);
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
  // Three buttons: "save" keeps the current state (a new post stays a draft), "publish" shows it on the site, "unpublish" hides it again.
  const rawIntent = String(formData.get("intent") ?? "save");
  const intent = rawIntent === "publish" || rawIntent === "unpublish" ? rawIntent : "save";
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

  const published = intent === "publish" ? true : intent === "unpublish" ? false : existing?.published === 1;
  const input: PostInput = { title, slug, description, content, cover_image: cover, published, tags };

  let postId = id;
  if (id) {
    await updatePost(id, input);
    if (replacedCover && replacedCover !== cover) await removeImageIfUnused(replacedCover, id);
  } else {
    postId = await createPost(input);
  }

  if (intent === "publish") redirect("/admin?saved=published");
  if (intent === "unpublish") redirect(`/admin/edit/${postId}?notice=unpublished`);
  // Plain save: stay on the post so the admin can keep editing.
  redirect(`/admin/edit/${postId}?notice=${published ? "saved-live" : "saved"}`);
}

export async function deletePostAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) redirect("/admin");
  const cover = await deletePost(id);
  await removeImageIfUnused(cover);
  redirect("/admin?deleted=1");
}

/* ------------------------------ tags ------------------------------ */

/** Save tag names (any language) and their English web addresses. */
export async function saveTagNamesAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const tags = await listAllTags();
  const taken: string[] = [];
  const reserved: string[] = [];
  for (const tag of tags) {
    const rawName = formData.get(`tag_${tag.id}`);
    const rawSlug = formData.get(`slug_${tag.id}`);
    if (typeof rawName !== "string" || typeof rawSlug !== "string") continue;
    const name = rawName.trim().replace(/\s+/g, " ").slice(0, 40) || tag.name;
    const slug = slugify(rawSlug) || tag.slug;
    const rawSection = formData.get(`section_${tag.id}`);
    let section = tag.section;
    if (typeof rawSection === "string") {
      const cleaned = cleanSection(rawSection);
      if (cleaned === null) reserved.push(rawSection.trim());
      else section = cleaned;
    }
    if (name === tag.name && slug === tag.slug && section === tag.section) continue;
    if ((await updateTag(tag.id, name, slug, section)) === "slug-taken") taken.push(slug);
  }
  if (reserved.length) {
    redirect(`/admin/tags?error=${encodeURIComponent(`These sections are used by the site itself, choose another: ${reserved.join(", ")}`)}`);
  }
  if (taken.length) {
    redirect(`/admin/tags?error=${encodeURIComponent(`These addresses are already used by another tag: ${taken.join(", ")}`)}`);
  }
  redirect("/admin/tags?saved=1");
}

/* ------------------------------ contact messages ------------------------------ */

export async function deleteMessageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (Number.isInteger(id) && id > 0) await deleteMessage(id);
  redirect("/admin/messages");
}
