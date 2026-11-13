import { env } from "cloudflare:workers";

/** Minimal shapes of the Cloudflare bindings this app uses. */
export interface D1Result<T> {
  results: T[];
}
export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}
export interface D1Like {
  prepare(sql: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown[]>;
}
export interface R2ObjectBodyLike {
  body: ReadableStream;
  httpEtag: string;
  httpMetadata?: { contentType?: string };
}
export interface R2Like {
  put(
    key: string,
    value: ArrayBuffer | ReadableStream | string,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  get(key: string): Promise<R2ObjectBodyLike | null>;
  delete(key: string): Promise<void>;
}

export interface AiLike {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

export interface AppEnv {
  DB: D1Like;
  /** Workers AI, used for automatic translation. Optional: without it text stays in its original language. */
  AI?: AiLike;
  IMAGES?: R2Like;
  ADMIN_PASSWORD: string;
}

/** True when the R2 image bucket is bound to this Worker. */
export function imagesEnabled(): boolean {
  return !!(env as unknown as AppEnv).IMAGES;
}

export function getEnv(): AppEnv {
  return env as unknown as AppEnv;
}
