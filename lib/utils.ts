import { createHash } from "crypto";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "book";
}

export function parseGenres(genre: string | null | undefined): string[] {
  if (!genre) return [];
  try {
    const parsed = JSON.parse(genre);
    if (Array.isArray(parsed)) return parsed;
    return [genre];
  } catch {
    return [genre];
  }
}

export function stringifyGenres(genres: string[]): string {
  return JSON.stringify(genres);
}
