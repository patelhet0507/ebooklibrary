"use client";

export type NotificationType = "DUE_DATE" | "NEW_RELEASE" | "RETURN_APPROVED" | "RETURN_REJECTED" | "FINE_CREATED";

const STORAGE_KEY = "notification_prefs";

const DEFAULTS: Record<NotificationType, boolean> = {
  DUE_DATE: true,
  NEW_RELEASE: true,
  RETURN_APPROVED: true,
  RETURN_REJECTED: true,
  FINE_CREATED: true,
};

export type NotificationPrefs = Record<NotificationType, boolean>;

export function getNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULTS;
}

export function setNotificationPrefs(prefs: NotificationPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
