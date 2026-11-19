"use server";

import { redirect } from "next/navigation";
import { checkPassword, endSession, requireAdmin, startSession } from "@/lib/auth";
import { createPost, createTag, deleteTag, listTagsBySection, deleteMessage, deletePost, getPostById, getTagBySlug, getTagByName, isPlaceholderSlug, tagSlugFor, isImageInUse, updatePost, updateTag, type PostInput } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { translateMany, warmPost } from "@/lib/i18n";
import { AUTHOR_SECTION, BOOK_SECTION, CAUSE_SECTION, HERB_SECTION, KINDS, isKind, randomCode, parseTagInput, slugify, type TagInput } from "@/lib/slug";

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

/** Tags written in another language get an English web address from their English meaning (e.g. அறுகம்புல் -> /herbs/scutch-grass), not a random code. */
async function withEnglishAddresses(tags: TagInput[]): Promise<TagInput[]> {
  const out: TagInput[] = [];
  for (const t of tags) {
    if (t.slug || tagSlugFor(t.name)) {
      out.push(t); // typed by the admin, or already known
      continue;
    }
    const existing = await getTagByName(t.name);
    if (existing && !isPlaceholderSlug(existing.slug)) {
      out.push(t); // reuse the existing tag and its address
      continue;
    }
    const english = (await translateMany("en", [t.name])).get(t.name);
    const slug = english ? slugify(english) : "";
    out.push(slug && !(await getTagBySlug(slug)) ? { ...t, slug } : t);
  }
  return out;
}

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
  // Herbs, causes, authors and books: pick existing ones from the lists, and/or type new names to create them on the spot.
  const asSection = (raw: string, section: string): TagInput[] => parseTagInput(raw).map((t) => ({ ...t, section }));
  const tagIds = ["herb", "cause", "author", "book"]
    .flatMap((k) => formData.getAll(k))
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);
  const tags = await withEnglishAddresses([
    ...asSection(String(formData.get("herbs_new") ?? ""), HERB_SECTION),
    ...asSection(String(formData.get("causes_new") ?? ""), CAUSE_SECTION),
    ...asSection(String(formData.get("authors_new") ?? ""), AUTHOR_SECTION),
    ...asSection(String(formData.get("books_new") ?? ""), BOOK_SECTION),
  ]);
  const poemNote = String(formData.get("poem_note") ?? "").replace(/\r\n?/g, "\n").trim();
  const poemPage = String(formData.get("poem_page") ?? "").trim().slice(0, 20);
  const poem = String(formData.get("poem") ?? "").replace(/\r\n?/g, "\n").trim();
  const poet = String(formData.get("poet") ?? "").trim();
  if (!title) redirect(`${backTo}?error=${encodeURIComponent("Title is required.")}`);
  if (title.length > 150) redirect(`${backTo}?error=${encodeURIComponent("Title is too long (max 150 characters).")}`);
  if (description.length > 300) redirect(`${backTo}?error=${encodeURIComponent("Description is too long (max 300 characters).")}`);
  if (poem.length > 3000) redirect(`${backTo}?error=${encodeURIComponent("Poem is too long (max 3000 characters).")}`);
  if (poemNote.length > 3000) redirect(`${backTo}?error=${encodeURIComponent("Poem explanation is too long (max 3000 characters).")}`);
  if (poet.length > 100) redirect(`${backTo}?error=${encodeURIComponent("Poet name is too long (max 100 characters).")}`);
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

  // Poet image: same rules as the cover image.
  let poetImage = existing?.poet_image ?? null;
  let replacedPoetImage: string | null = null;
  const poetUpload = formData.get("poet_image");
  if (poetUpload instanceof File && poetUpload.size > 0) {
    replacedPoetImage = poetImage;
    poetImage = await storeImage(poetUpload, backTo);
  } else if (formData.get("remove_poet_image") === "on") {
    replacedPoetImage = poetImage;
    poetImage = null;
  }

  const published = intent === "publish" ? true : intent === "unpublish" ? false : existing?.published === 1;
  const input: PostInput = { title, slug, description, content, cover_image: cover, published, tags, tag_ids: tagIds, poem, poet, poet_image: poetImage, poem_note: poemNote, poem_page: poemPage };

  let postId = id;
  if (id) {
    await updatePost(id, input);
    if (replacedCover && replacedCover !== cover) await removeImageIfUnused(replacedCover, id);
    if (replacedPoetImage && replacedPoetImage !== poetImage) await removeImageIfUnused(replacedPoetImage, id);
  } else {
    postId = await createPost(input);
  }

  // Translate the post into English now, so its /en page is complete before search engines visit it.
  if (published && postId) {
    try {
      const fresh = await getPostById(postId);
      if (fresh) await warmPost("en", fresh);
    } catch {
      /* best effort: the page also translates itself when visited */
    }
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
  for (const key of await deletePost(id)) await removeImageIfUnused(key);
  redirect("/admin?deleted=1");
}

/* ------------------------------ tags ------------------------------ */

/** Add a herb, cause, author or book on its own (no post needed). */
export async function addEntryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const kindRaw = String(formData.get("kind") ?? "");
  if (!isKind(kindRaw)) redirect("/admin");
  const kind = KINDS[kindRaw];
  const back = `/admin/${kindRaw}`;
  const fail = (msg: string): never => redirect(`${back}?error=${encodeURIComponent(msg)}`);

  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
  const rawSlug = String(formData.get("slug") ?? "").trim();
  if (!name) fail("Type a name.");
  if (rawSlug && !slugify(rawSlug)) fail("The English address must use English letters or numbers, e.g. amla.");

  // English address: typed, taken from the name, or translated from its meaning.
  const [input] = await withEnglishAddresses([rawSlug ? { name, slug: slugify(rawSlug) } : { name }]);
  const slug = input.slug || tagSlugFor(name) || `tag-${randomCode()}`;

  const result = await createTag(name, slug, kind.section);
  if (result === "exists") fail(`"${name}" or the address "${slug}" already exists.`);
  redirect(`${back}?added=${encodeURIComponent(name)}`);
}

/** Save the names and English addresses of one kind of entry, and delete the ones that are ticked. */
export async function saveEntriesAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const kindRaw = String(formData.get("kind") ?? "");
  if (!isKind(kindRaw)) redirect("/admin");
  const back = `/admin/${kindRaw}`;
  const entries = await listTagsBySection(KINDS[kindRaw].section);
  const taken: string[] = [];
  for (const entry of entries) {
    if (formData.get(`del_${entry.id}`) === "on") {
      await deleteTag(entry.id);
      continue;
    }
    const rawName = formData.get(`name_${entry.id}`);
    const rawSlug = formData.get(`slug_${entry.id}`);
    if (typeof rawName !== "string" || typeof rawSlug !== "string") continue;
    const name = rawName.trim().replace(/\s+/g, " ").slice(0, 60) || entry.name;
    const slug = slugify(rawSlug) || entry.slug;
    if (name === entry.name && slug === entry.slug) continue;
    if ((await updateTag(entry.id, name, slug, entry.section)) === "slug-taken") taken.push(slug);
  }
  if (taken.length) redirect(`${back}?error=${encodeURIComponent(`These addresses are already used: ${taken.join(", ")}`)}`);
  redirect(`${back}?saved=1`);
}

/* ------------------------------ contact messages ------------------------------ */

export async function deleteMessageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (Number.isInteger(id) && id > 0) await deleteMessage(id);
  redirect("/admin/messages");
}
