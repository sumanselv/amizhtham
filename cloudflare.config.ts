import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "amizhtham",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-12",
    compatibilityFlags: ["nodejs_compat"],
    // Custom domains (the domain's DNS must be on Cloudflare).
    domains: ["amizhtham.org", "www.amizhtham.org"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      // Posts and tags live in D1 (SQLite). Tables are created automatically on first request.
      DB: bindings.d1({ name: "remedy-blog-db", id: "879bbb17-6c05-46a6-a2a9-1b80e1efc692" }),
      // Cover images uploaded from the admin page.
      IMAGES: bindings.r2({ name: "remedy-blog-images" }),
      // Admin password. Set it with: npx cf secrets ... (see README), or in .dev.vars for local dev.
      ADMIN_PASSWORD: bindings.secret(),
      // Workers AI: automatic translation into the visitor's language (results are cached in D1).
      AI: bindings.ai(),
    },
  }),
});
