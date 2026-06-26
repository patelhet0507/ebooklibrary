const store = new Map<string, { value: unknown; expiresAt: number }>();
const TAG_INDEX = new Map<string, Set<string>>();

function now() {
  return Date.now();
}

function sweep() {
  const ts = now();
  for (const [key, entry] of store) {
    if (ts > entry.expiresAt) {
      store.delete(key);
      for (const tagSet of TAG_INDEX.values()) {
        tagSet.delete(key);
      }
    }
  }
}

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: now() + ttlMs });
}

export function cacheDel(key: string): void {
  store.delete(key);
}

export function cacheTag(key: string, tag: string): void {
  if (!TAG_INDEX.has(tag)) TAG_INDEX.set(tag, new Set());
  TAG_INDEX.get(tag)!.add(key);
}

export function cacheInvalidate(tag: string): void {
  const keys = TAG_INDEX.get(tag);
  if (!keys) return;
  for (const key of keys) store.delete(key);
  TAG_INDEX.delete(tag);
}

import { NextResponse } from "next/server";

export function cachedResponse(body: unknown, ttlSeconds: number = 60) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`,
    },
  });
}

export function noCacheResponse(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...init?.headers,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

export async function cached<T>(
  key: string,
  fetch: () => Promise<T>,
  ttlMs: number = 60_000
): Promise<T> {
  const existing = cacheGet<T>(key);
  if (existing !== undefined) return existing;
  const value = await fetch();
  cacheSet(key, value, ttlMs);
  return value;
}

setInterval(sweep, 30_000);
