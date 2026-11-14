# Amizhtham - home remedy blog

A blog for home remedies, built with **Next.js (vinext) on Cloudflare Workers**.

- **Home page:** white background, responsive card grid. Each card has a cover image, remedy tags, a title and a short description.
- **Every post has its own page:** `/remedy/<title-slug>`
- **Tag directories:** click a tag such as *Amla* to open `/tag/amla`, which lists only the posts that use it. `/tags` lists all remedies.
- **Admin:** `/admin` (password protected) to create, edit, unpublish (draft) and delete posts, with cover image upload.
- Search, related posts, sitemap (`/sitemap.xml`), `robots.txt`, SEO titles and descriptions, and a health disclaimer are included.

## Stack

| Part | Tool |
|---|---|
| Framework | Next.js App Router via **vinext** (Vite) |
| Hosting | **Cloudflare Workers** |
| Database | **Cloudflare D1** (SQLite). Tables are created automatically on first request |
| Images | **Cloudflare R2** |
| Styling | Tailwind CSS |

## Run it on your computer

```bash
npm install
cp .dev.vars.example .dev.vars      # then edit .dev.vars and set your own ADMIN_PASSWORD (8+ characters)
npm run dev                         # http://localhost:5173
```

Local D1 and R2 are simulated on your machine, so no Cloudflare account is needed to try it. Three sample posts are added the first time it runs; delete them from the admin page.

To test the production build locally: `npm run build && npm run start`.

## Deploy to Cloudflare

1. Log in: `npx cf auth login`
2. If your account id is not picked up automatically, set `CLOUDFLARE_ACCOUNT_ID` or add `accountId` to `cloudflare.config.ts`.
3. Deploy: `npm run deploy`
4. Set the admin password as a secret (do not put it in the code):
   `npx cf workers secrets update ADMIN_PASSWORD --worker amizhtham --text "your-long-password"`
5. Open `https://remedy-blog.<your-subdomain>.workers.dev/admin/login`.

The D1 database (`remedy-blog-db`) and R2 bucket (`remedy-blog-images`) are declared in `cloudflare.config.ts`. If the deploy says they do not exist, create them first:
`npx cf d1 create` and `npx cf r2 buckets create` (use the same names), then deploy again.

## Enabling image upload (R2)

Image upload needs R2 on your Cloudflare account. Enable **R2 Object Storage** in the dashboard, uncomment the `IMAGES` line in `cloudflare.config.ts`, and push. Until then the site works without cover images.

## Custom domain

1. Put your domain's DNS on Cloudflare (buy a `.com` there, or add a domain bought elsewhere and change its nameservers to the two Cloudflare gives you).
2. In `cloudflare.config.ts`, uncomment `domains` and set your names, e.g. `domains: ["yourdomain.com", "www.yourdomain.com"]`.
3. Run `npm run deploy`. Cloudflare creates the DNS records and the SSL certificate.
4. In the Cloudflare dashboard, add a Redirect Rule from `www` to the bare domain (or the reverse), so Google sees one main address.

## Tamil content

The page text around the posts is fixed (logo அமிழ்தம், முகப்பு, தேடல்), and **posts can be written in Tamil**: title, description, body and tags.

- **Web addresses always stay in English.** Fill the *URL name* box with English letters (e.g. `amla-hair-fall`). If the title is Tamil and the box is empty, a code such as `remedy-k3f9x2` is used.
- **Tags:** type Tamil names directly. To choose the English address of a Tamil tag, add it after a bar: `நெல்லிக்காய் | amla` gives `/tag/amla`. Typing the same Tamil name again reuses the tag.
- **Rename existing tags** (for example Amla to நெல்லிக்காய்) in **Admin > Tags**. Their English addresses do not change.

## Writing posts

In **Admin > New post**: title, optional URL name, tags (comma separated, e.g. `Amla, Honey`), short description (shown on the card), cover image, and the body.

Body formatting: `## Heading`, `- bullet`, `1. numbered`, `**bold**`, `*italic*`, `[text](https://link)`, `> quote`.

- Posts are published by default. Untick *Published* to keep a draft only you can see.
- A tag with no published posts disappears from the public tag list automatically.
- Deleting a post also deletes its cover image if no other post uses it.

## Security notes

- The admin password lives in a Cloudflare secret, never in the code. Sessions use a signed, HTTP-only cookie that lasts 7 days.
- Every admin action re-checks the login. Uploaded images are checked by file contents, limited to 5 MB, and stored under random names.
- Post text is HTML-escaped before display, so scripts in a post cannot run.
- For stronger protection, put **Cloudflare Access** in front of `/admin/*` (free for small teams) in addition to the password.

## Project layout

```
app/(site)/            public pages: home, /remedy/[slug], /tag/[slug], /tags
app/admin/             login, post list, new, edit, server actions
app/img/[key]/         serves cover images from R2
lib/db.ts              D1 queries, schema, sample posts
lib/auth.ts            admin session
lib/markdown.ts        safe post renderer
components/            cards, header, footer, admin form
cloudflare.config.ts   Worker, D1, R2, secret and domain settings
```

## Health content

Remedy posts should stay general ("traditionally used", "many people enjoy") and avoid promising cures. The footer and every post page include a disclaimer; keep it.

## Languages (automatic)

The site always opens in Tamil (the primary language). Visitors can switch with the 🌐 menu and the choice is
remembered in a cookie. Supported: Tamil, English, Hindi, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati.

- Posts are written once (Tamil is the source). Titles, descriptions, bodies and tag names are translated on
  demand with Workers AI (`AI` binding, model `@cf/meta/m2m100-1.2b`) and cached forever in the D1 `translations`
  table, so each text is translated only once. Editing a post re-translates only the text that changed.
- Up to 30 new translations are made per page view; anything not yet translated shows in its original language
  and fills in on the next visit.
- Web addresses always stay English (`/tag/amla`, `/remedy/<slug>`). The `tag` part can be changed per tag in Admin > Tags (e.g. `/fruit/amla`); the old address redirects.
- Interface text lives in `lib/ui.ts` (Tamil + hand-written English; other languages are machine-translated).
- The language menu (🌐) sets a cookie through `/lang?l=<code>`. The admin area stays in English.
- To add a language, add it to `LANGUAGES` in `lib/i18n.ts` (it must be supported by the m2m100 model) and to `lang` CSS if it needs a font.
