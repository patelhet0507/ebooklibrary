import { createHash } from "crypto";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "book";
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
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
