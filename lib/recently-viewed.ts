"use client";

export interface RecentlyViewedBook {
  id: string;
  slug?: string;
  title: string;
  author: string;
  cover_image?: string;
  viewed_at: number;
}

const STORAGE_KEY = "recently_viewed";
const MAX_ITEMS = 10;

export function getRecentlyViewed(): RecentlyViewedBook[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(book: Omit<RecentlyViewedBook, "viewed_at">) {
  const items = getRecentlyViewed().filter((b) => b.id !== book.id);
  items.unshift({ ...book, viewed_at: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}
