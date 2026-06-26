"use client";

const STORAGE_KEY = "newsletter_subscribed";

export function isSubscribed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function setSubscribed(subscribed: boolean) {
  localStorage.setItem(STORAGE_KEY, subscribed ? "true" : "false");
}
