import { getEnv, type D1Like } from "./env";
import { randomCode, slugify, type TagInput } from "./slug";
import { englishNameFor } from "./tagnames";

export interface Tag {
  id: number;
  name: string;
  slug: string;
  /** First part of the tag address, "tag" by default (/tag/amla); the admin can change it (/fruit/amla). */
  section: string;
  post_count?: number;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  description: string;
  content: string;
  cover_image: string | null;
  /** Optional original verse, shown in slanted type and never translated. */
  poem: string;
  /** Name of the poet, never translated. */
  poet: string;
  published: number;
  created_at: string;
  updated_at: string;
}

export interface PostWithTags extends Post {
  tags: Tag[];
}

export const PAGE_SIZE = 12;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    cover_image TEXT,
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
  )`,
  `CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags(tag_id)`,
  `CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(published, created_at)`,
  `CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  // Cached machine translations, keyed by language + hash of the source text.
  `CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS translations (key TEXT PRIMARY KEY, text TEXT NOT NULL)`,
];

let ready: Promise<D1Like> | null = null;

/** Returns the database, creating the tables (and a few sample posts) on first use. */
export function db(): Promise<D1Like> {
  if (!ready) {
    ready = init().catch((err) => {
      ready = null; // retry on next request
      throw err;
    });
  }
  return ready;
}

async function init(): Promise<D1Like> {
  const d1 = getEnv().DB;
  await d1.batch(SCHEMA.map((sql) => d1.prepare(sql)));
  // Older databases: add the poem / poet columns.
  const postCols = await d1.prepare("PRAGMA table_info(posts)").all<{ name: string }>();
  for (const col of ["poem", "poet"]) {
    if (!postCols.results.some((c) => c.name === col)) {
      await d1.prepare(`ALTER TABLE posts ADD COLUMN ${col} TEXT NOT NULL DEFAULT ''`).run();
    }
  }
  // Older databases: add the tag address prefix column.
  const cols = await d1.prepare("PRAGMA table_info(tags)").all<{ name: string }>();
  if (!cols.results.some((c) => c.name === "section")) {
    await d1.prepare("ALTER TABLE tags ADD COLUMN section TEXT NOT NULL DEFAULT 'tag'").run();
  }
  const seeded = await d1.prepare("SELECT value FROM meta WHERE key = 'seeded'").first();
  if (!seeded) {
    await d1.prepare("INSERT OR IGNORE INTO meta (key, value) VALUES ('seeded', '1')").run();
    const { n } = (await d1.prepare("SELECT COUNT(*) AS n FROM posts").first<{ n: number }>()) ?? { n: 0 };
    if (n === 0) await seedSamples(d1);
  }
  return d1;
}

/* ------------------------------ reading ------------------------------ */

export async function listPosts(opts: {
  tagSlug?: string;
  q?: string;
  includeDrafts?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<{ posts: PostWithTags[]; total: number }> {
  const d1 = await db();
  const pageSize = opts.pageSize ?? PAGE_SIZE;
  const page = Math.max(1, opts.page ?? 1);

  const joins: string[] = [];
  const where: string[] = [];
  const params: unknown[] = [];

  if (opts.tagSlug) {
    joins.push("JOIN post_tags pt ON pt.post_id = p.id JOIN tags t ON t.id = pt.tag_id AND t.slug = ?");
    params.push(opts.tagSlug);
  }
  if (!opts.includeDrafts) where.push("p.published = 1");
  if (opts.q && opts.q.trim()) {
    const like = `%${opts.q.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    where.push(
      `(p.title LIKE ? ESCAPE '\\' OR p.description LIKE ? ESCAPE '\\' OR EXISTS (
        SELECT 1 FROM post_tags x JOIN tags y ON y.id = x.tag_id WHERE x.post_id = p.id AND y.name LIKE ? ESCAPE '\\'))`,
    );
    params.push(like, like, like);
  }

  const base = `FROM posts p ${joins.join(" ")} ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
  const totalRow = await d1
    .prepare(`SELECT COUNT(DISTINCT p.id) AS n ${base}`)
    .bind(...params)
    .first<{ n: number }>();
  const rows = await d1
    .prepare(`SELECT DISTINCT p.* ${base} ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?`)
    .bind(...params, pageSize, (page - 1) * pageSize)
    .all<Post>();

  return { posts: await attachTags(d1, rows.results), total: totalRow?.n ?? 0 };
}

async function attachTags(d1: D1Like, posts: Post[]): Promise<PostWithTags[]> {
  if (posts.length === 0) return [];
  const ids = posts.map((p) => p.id);
  const marks = ids.map(() => "?").join(",");
  const rows = await d1
    .prepare(
      `SELECT pt.post_id AS post_id, t.id AS id, t.name AS name, t.slug AS slug, t.section AS section
       FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
       WHERE pt.post_id IN (${marks}) ORDER BY t.name`,
    )
    .bind(...ids)
    .all<Tag & { post_id: number }>();
  const byPost = new Map<number, Tag[]>();
  for (const r of rows.results) {
    const list = byPost.get(r.post_id) ?? [];
    list.push({ id: r.id, name: r.name, slug: r.slug, section: r.section });
    byPost.set(r.post_id, list);
  }
  return posts.map((p) => ({ ...p, tags: byPost.get(p.id) ?? [] }));
}

export async function getPostBySlug(slug: string, includeDrafts = false): Promise<PostWithTags | null> {
  const d1 = await db();
  const row = await d1
    .prepare(`SELECT * FROM posts WHERE slug = ? ${includeDrafts ? "" : "AND published = 1"}`)
    .bind(slug)
    .first<Post>();
  if (!row) return null;
  return (await attachTags(d1, [row]))[0];
}

export async function getPostById(id: number): Promise<PostWithTags | null> {
  const d1 = await db();
  const row = await d1.prepare("SELECT * FROM posts WHERE id = ?").bind(id).first<Post>();
  if (!row) return null;
  return (await attachTags(d1, [row]))[0];
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const d1 = await db();
  return d1.prepare("SELECT id, name, slug, section FROM tags WHERE slug = ?").bind(slug).first<Tag>();
}

/** All tags that have at least one published post, with counts. */
export async function listTags(): Promise<Tag[]> {
  const d1 = await db();
  const rows = await d1
    .prepare(
      `SELECT t.id AS id, t.name AS name, t.slug AS slug, t.section AS section, COUNT(p.id) AS post_count
       FROM tags t
       JOIN post_tags pt ON pt.tag_id = t.id
       JOIN posts p ON p.id = pt.post_id AND p.published = 1
       GROUP BY t.id ORDER BY t.name`,
    )
    .all<Tag>();
  return rows.results;
}

/** Every tag (including ones only used by drafts) for the admin rename page. */
export async function listAllTags(): Promise<Tag[]> {
  const d1 = await db();
  const rows = await d1
    .prepare(
      `SELECT t.id AS id, t.name AS name, t.slug AS slug, t.section AS section, COUNT(pt.post_id) AS post_count
       FROM tags t LEFT JOIN post_tags pt ON pt.tag_id = t.id GROUP BY t.id ORDER BY t.name`,
    )
    .all<Tag>();
  return rows.results;
}

/** Change a tag's display name and English address. Returns "slug-taken" if another tag already uses the address. */
export async function updateTag(id: number, name: string, slug: string, section = "tag"): Promise<"ok" | "slug-taken"> {
  const d1 = await db();
  const clash = await d1.prepare("SELECT id FROM tags WHERE slug = ? AND id != ?").bind(slug, id).first();
  if (clash) return "slug-taken";
  await d1.prepare("UPDATE tags SET name = ?, slug = ?, section = ? WHERE id = ?").bind(name, slug, section, id).run();
  return "ok";
}

export async function listAllTagNames(): Promise<string[]> {
  const d1 = await db();
  const rows = await d1.prepare("SELECT name FROM tags ORDER BY name").all<{ name: string }>();
  return rows.results.map((r) => r.name);
}

export async function listRelatedPosts(post: PostWithTags, limit = 3): Promise<PostWithTags[]> {
  if (post.tags.length === 0) return [];
  const d1 = await db();
  const tagIds = post.tags.map((t) => t.id);
  const marks = tagIds.map(() => "?").join(",");
  const rows = await d1
    .prepare(
      `SELECT p.*, COUNT(*) AS shared FROM posts p
       JOIN post_tags pt ON pt.post_id = p.id
       WHERE pt.tag_id IN (${marks}) AND p.id != ? AND p.published = 1
       GROUP BY p.id ORDER BY shared DESC, p.created_at DESC LIMIT ?`,
    )
    .bind(...tagIds, post.id, limit)
    .all<Post>();
  return attachTags(d1, rows.results);
}

export async function listSlugsForSitemap(): Promise<{ posts: { slug: string; updated_at: string }[]; tags: { section: string; slug: string }[] }> {
  const d1 = await db();
  const posts = await d1
    .prepare("SELECT slug, updated_at FROM posts WHERE published = 1 ORDER BY created_at DESC")
    .all<{ slug: string; updated_at: string }>();
  const tags = await listTags();
  return { posts: posts.results, tags: tags.map((t) => ({ section: t.section, slug: t.slug })) };
}

/* ------------------------------ writing ------------------------------ */

async function uniqueSlug(d1: D1Like, base: string, ignoreId?: number): Promise<string> {
  const root = base || `remedy-${randomCode()}`;
  let candidate = root;
  for (let i = 2; i < 200; i++) {
    const hit = await d1
      .prepare("SELECT id FROM posts WHERE slug = ? AND id != ?")
      .bind(candidate, ignoreId ?? -1)
      .first();
    if (!hit) return candidate;
    candidate = `${root}-${i}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

/** The English web address for a tag name: typed by the admin, taken from the name itself, or a known translation. */
export function tagSlugFor(name: string, typed?: string): string {
  return typed || slugify(name) || slugify(englishNameFor(name));
}

/** Save a post's tags. A non-empty `category` becomes the address section of those tags (/category/tag-name); empty leaves them as they are. */
async function setPostTags(d1: D1Like, postId: number, tags: TagInput[], category = ""): Promise<void> {
  await d1.prepare("DELETE FROM post_tags WHERE post_id = ?").bind(postId).run();
  for (const input of tags) {
    const name = input.name;
    const english = tagSlugFor(name, input.slug);
    // A tag written in another language (typed or known address) takes over the display name
    // of the English tag with that address, e.g. Amla becomes நெல்லிக்காய்.
    const renameOnMatch = !!input.slug || (!slugify(name) && !!english);

    // 1. Same name already exists: reuse that tag.
    let tag = await d1.prepare("SELECT id FROM tags WHERE name = ?").bind(name).first<{ id: number }>();
    if (!tag) {
      // 2. Otherwise find or create the tag by its English address.
      const slug = english || `tag-${randomCode()}`;
      tag = await d1.prepare("SELECT id FROM tags WHERE slug = ?").bind(slug).first<{ id: number }>();
      if (tag) {
        if (renameOnMatch) await d1.prepare("UPDATE tags SET name = ? WHERE id = ?").bind(name, tag.id).run();
      } else {
        await d1.prepare("INSERT INTO tags (name, slug) VALUES (?, ?)").bind(name, slug).run();
        tag = await d1.prepare("SELECT id FROM tags WHERE slug = ?").bind(slug).first<{ id: number }>();
      }
    }
    if (tag && category) {
      await d1.prepare("UPDATE tags SET section = ? WHERE id = ?").bind(category, tag.id).run();
    }
    if (tag) {
      await d1.prepare("INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)").bind(postId, tag.id).run();
    }
  }
  // Remove tags nobody uses any more so the tag directory stays clean.
  await d1.prepare("DELETE FROM tags WHERE id NOT IN (SELECT DISTINCT tag_id FROM post_tags)").run();
}

export interface PostInput {
  title: string;
  slug?: string;
  description: string;
  content: string;
  cover_image: string | null;
  published: boolean;
  tags: TagInput[];
  /** Address section for this post's tags, e.g. "fruit" gives /fruit/amla. Empty keeps the current section ("tag" for new tags). */
  category?: string;
  poem?: string;
  poet?: string;
}

export async function createPost(input: PostInput): Promise<number> {
  const d1 = await db();
  const now = new Date().toISOString();
  const slug = await uniqueSlug(d1, slugify(input.slug || input.title));
  await d1
    .prepare(
      `INSERT INTO posts (title, slug, description, content, cover_image, poem, poet, published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(input.title, slug, input.description, input.content, input.cover_image, input.poem ?? "", input.poet ?? "", input.published ? 1 : 0, now, now)
    .run();
  const row = await d1.prepare("SELECT id FROM posts WHERE slug = ?").bind(slug).first<{ id: number }>();
  const id = row!.id;
  await setPostTags(d1, id, input.tags, input.category);
  return id;
}

export async function updatePost(id: number, input: PostInput): Promise<void> {
  const d1 = await db();
  const slug = await uniqueSlug(d1, slugify(input.slug || input.title), id);
  await d1
    .prepare(
      `UPDATE posts SET title = ?, slug = ?, description = ?, content = ?, cover_image = ?, poem = ?, poet = ?, published = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(input.title, slug, input.description, input.content, input.cover_image, input.poem ?? "", input.poet ?? "", input.published ? 1 : 0, new Date().toISOString(), id)
    .run();
  await setPostTags(d1, id, input.tags, input.category);
}

export async function deletePost(id: number): Promise<string | null> {
  const d1 = await db();
  const row = await d1.prepare("SELECT cover_image FROM posts WHERE id = ?").bind(id).first<{ cover_image: string | null }>();
  await d1.prepare("DELETE FROM post_tags WHERE post_id = ?").bind(id).run();
  await d1.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
  await d1.prepare("DELETE FROM tags WHERE id NOT IN (SELECT DISTINCT tag_id FROM post_tags)").run();
  return row?.cover_image ?? null;
}

/** Is this image key still used by any other post? */
export async function isImageInUse(key: string, exceptPostId?: number): Promise<boolean> {
  const d1 = await db();
  const hit = await d1
    .prepare("SELECT id FROM posts WHERE cover_image = ? AND id != ?")
    .bind(key, exceptPostId ?? -1)
    .first();
  return !!hit;
}

/* ------------------------------ sample data ------------------------------ */

async function seedSamples(d1: D1Like): Promise<void> {
  const now = Date.now();
  const samples = [
    {
      title: "Amla Juice for a Daily Vitamin C Boost",
      description: "A simple, traditional way to enjoy amla (Indian gooseberry) as a daily drink.",
      tags: ["Amla"],
      content: `## About
Amla (Indian gooseberry) is widely used in Indian kitchens and in Ayurveda. It is naturally rich in vitamin C.

## What you need
- 2 fresh amla
- 1 glass water
- A little honey or jaggery (optional)

## How to make it
1. Wash the amla and remove the seeds.
2. Blend with water and strain.
3. Add honey if you like, and drink fresh.

## Notes
Amla is sour, so start with a small amount. This is a **sample post** - edit or delete it from the admin page.`,
    },
    {
      title: "Turmeric Milk (Haldi Doodh) Before Bed",
      description: "A warm, comforting bedtime drink that families have shared for generations.",
      tags: ["Turmeric", "Milk"],
      content: `## About
Haldi doodh is a classic home drink made with turmeric and warm milk.

## What you need
- 1 cup milk
- 1/2 tsp turmeric powder
- A pinch of black pepper
- Honey to taste (add after it cools a little)

## How to make it
1. Warm the milk gently.
2. Stir in turmeric and pepper and simmer for 2-3 minutes.
3. Let it cool slightly, add honey, and sip.

This is a **sample post** - edit or delete it from the admin page.`,
    },
    {
      title: "Ginger and Honey Tea for a Scratchy Throat",
      description: "A soothing cup that many people reach for when the weather changes.",
      tags: ["Ginger", "Honey"],
      content: `## About
Ginger tea with honey is a familiar comfort drink during cold weather.

## What you need
- 1 inch fresh ginger, crushed
- 1 cup water
- 1 tsp honey
- A few drops of lemon (optional)

## How to make it
1. Boil the ginger in water for 5 minutes.
2. Strain into a cup and let it cool a little.
3. Stir in honey and lemon.

This is a **sample post** - edit or delete it from the admin page.`,
    },
  ];

  let i = 0;
  for (const s of samples) {
    const created = new Date(now - i * 60_000).toISOString();
    i++;
    const slug = slugify(s.title);
    await d1
      .prepare(
        `INSERT OR IGNORE INTO posts (title, slug, description, content, cover_image, published, created_at, updated_at)
         VALUES (?, ?, ?, ?, NULL, 1, ?, ?)`,
      )
      .bind(s.title, slug, s.description, s.content, created, created)
      .run();
    const row = await d1.prepare("SELECT id FROM posts WHERE slug = ?").bind(slug).first<{ id: number }>();
    if (row) await setPostTags(d1, row.id, s.tags.map((name) => ({ name })));
  }
}

/* ------------------------------ contact messages ------------------------------ */

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  body: string;
  created_at: string;
}

/** Saves a message from the contact page. Returns false when too many arrived in the last hour. */
export async function createMessage(name: string, email: string, body: string): Promise<boolean> {
  const d1 = await db();
  const since = new Date(Date.now() - 3600_000).toISOString();
  const recent = await d1.prepare("SELECT COUNT(*) AS n FROM messages WHERE created_at > ?").bind(since).first<{ n: number }>();
  if ((recent?.n ?? 0) >= 30) return false;
  await d1
    .prepare("INSERT INTO messages (name, email, body, created_at) VALUES (?, ?, ?, ?)")
    .bind(name, email, body, new Date().toISOString())
    .run();
  return true;
}

export async function listMessages(): Promise<ContactMessage[]> {
  const d1 = await db();
  const rows = await d1.prepare("SELECT id, name, email, body, created_at FROM messages ORDER BY id DESC LIMIT 200").all<ContactMessage>();
  return rows.results;
}

export async function deleteMessage(id: number): Promise<void> {
  const d1 = await db();
  await d1.prepare("DELETE FROM messages WHERE id = ?").bind(id).run();
}
