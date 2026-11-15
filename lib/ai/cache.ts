/**
 * Dev-only cache of Gemini responses, to save the free-tier quota while testing.
 *
 * - On only when NODE_ENV !== "production" and AI_CACHE !== "off".
 *   (Vercel runs production, so the live site always calls Gemini.)
 * - Keyed by the exact request (model + thinking level + system prompt + user
 *   message + output schema), so ANY change to the prompt, the transcript, or
 *   the answers is a cache miss and calls Gemini for real.
 * - Stored in .ai-cache/ (git-ignored). Delete the folder to start fresh.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DIR = join(process.cwd(), ".ai-cache");

export function aiCacheEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.AI_CACHE !== "off";
}

export function aiCacheKey(parts: unknown[]) {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 32);
}

export async function aiCacheGet(key: string): Promise<unknown | undefined> {
  if (!aiCacheEnabled()) return undefined;
  try {
    return JSON.parse(await readFile(join(DIR, `${key}.json`), "utf8"));
  } catch {
    return undefined;
  }
}

export async function aiCacheSet(key: string, value: unknown) {
  if (!aiCacheEnabled()) return;
  try {
    await mkdir(DIR, { recursive: true });
    await writeFile(join(DIR, `${key}.json`), JSON.stringify(value));
  } catch (err) {
    console.warn("[ai-cache] couldn't write", err);
  }
}
