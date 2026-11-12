import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "remedy-blog",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-12",
    compatibilityFlags: ["nodejs_compat"],
    // Your custom domain (the domain's DNS must be on Cloudflare). Uncomment and edit, then run `npm run deploy`.
    // domains: ["yourdomain.com", "www.yourdomain.com"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      // Posts and tags live in D1 (SQLite). Tables are created automatically on first request.
      DB: bindings.d1({ name: "remedy-blog-db" }),
      // Cover images uploaded from the admin page.
      IMAGES: bindings.r2({ name: "remedy-blog-images" }),
      // Admin password. Set it with: npx cf secrets ... (see README), or in .dev.vars for local dev.
      ADMIN_PASSWORD: bindings.secret(),
    },
  }),
});
