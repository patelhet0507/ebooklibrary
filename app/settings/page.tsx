"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getNotificationPrefs, setNotificationPrefs, NotificationType, NotificationPrefs } from "@/lib/notification-preferences";
import { useToast } from "@/app/components/Toast";

const NOTIFICATION_LABELS: Record<NotificationType, { label: string; desc: string }> = {
  DUE_DATE: { label: "Rental Due Reminders", desc: "Get reminded when your rental is due" },
  NEW_RELEASE: { label: "New Book Releases", desc: "Be notified when books in your favorite genres are added" },
  RETURN_APPROVED: { label: "Return Approved", desc: "Get notified when your return is approved" },
  RETURN_REJECTED: { label: "Return Rejected", desc: "Get notified when your return is rejected" },
  FINE_CREATED: { label: "Fine Notices", desc: "Get notified when a fine is created" },
};

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<NotificationPrefs>(getNotificationPrefs());

  useEffect(() => {
    if (!user) router.push("/auth/login");
  }, [user, router]);

  useEffect(() => { document.title = "Settings | E-Book Library"; }, []);

  const toggle = (type: NotificationType) => {
    const updated = { ...prefs, [type]: !prefs[type] };
    setPrefs(updated);
    setNotificationPrefs(updated);
    toast("success", `${NOTIFICATION_LABELS[type].label} ${updated[type] ? "enabled" : "disabled"}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-secondary mt-1">Manage your notification preferences</p>
      </div>

      <div className="card divide-y divide-border">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">Email Notifications</h2>
          <p className="text-sm text-secondary">Choose which notifications you receive via email</p>
        </div>
        {(Object.keys(NOTIFICATION_LABELS) as NotificationType[]).map((type) => (
          <div key={type} className="flex items-center justify-between p-6">
            <div>
              <p className="font-medium text-foreground">{NOTIFICATION_LABELS[type].label}</p>
              <p className="text-sm text-secondary">{NOTIFICATION_LABELS[type].desc}</p>
            </div>
            <button
              onClick={() => toggle(type)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                prefs[type] ? "bg-primary" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  prefs[type] ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
