"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function CustomerNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      router.push("/auth/login");
    }
  }, [user, router]);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.customer.notifications.get(user.id, { limit: 50 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.customer.markNotificationRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllRead = async () => {
    // For now, sequentially mark unread as read
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await handleMarkAsRead(n.id);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "UNREAD") return !n.is_read;
    if (filter === "READ") return n.is_read;
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "DUE_DATE":
        return (
          <div className="w-10 h-10 rounded-full bg-warning/10 text-warning flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case "NEW_RELEASE":
        return (
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        );
      case "RETURN_APPROVED":
        return (
          <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "RETURN_REJECTED":
        return (
          <div className="w-10 h-10 rounded-full bg-danger/10 text-danger flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case "FINE_CREATED":
        return (
          <div className="w-10 h-10 rounded-full bg-warning/10 text-warning flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.437L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="badge badge-primary">{unreadCount} unread</span>
            )}
          </h1>
          <p className="text-secondary mt-1">Stay updated with your account activity</p>
        </div>
        
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn btn-outline btn-sm whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b border-border pb-2">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${filter === "ALL" ? 'text-primary border-b-2 border-primary -mb-[9px]' : 'text-secondary hover:text-foreground'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("UNREAD")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${filter === "UNREAD" ? 'text-primary border-b-2 border-primary -mb-[9px]' : 'text-secondary hover:text-foreground'}`}
        >
          Unread
        </button>
        <button
          onClick={() => setFilter("READ")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${filter === "READ" ? 'text-primary border-b-2 border-primary -mb-[9px]' : 'text-secondary hover:text-foreground'}`}
        >
          Read
        </button>
      </div>

      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="card p-12 text-center text-secondary">
            <svg className="w-16 h-16 mx-auto mb-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.437L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-lg font-medium">No notifications yet</p>
            <p className="mt-1">We'll let you know when something important happens.</p>
          </div>
        ) : (
          filteredNotifications.map((notification, index) => (
            <div 
              key={notification.id} 
              className={`card p-4 flex gap-4 transition-all duration-200 hover:shadow-md animate-fade-in ${!notification.is_read ? 'bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800' : ''}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="relative flex-shrink-0">
                {!notification.is_read && (
                  <div className="absolute -left-1 -top-1 w-3 h-3 bg-primary rounded-full shadow-sm"></div>
                )}
                {getIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className={`text-base font-semibold truncate ${!notification.is_read ? 'text-foreground' : 'text-secondary'}`}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-muted whitespace-nowrap">
                    {timeAgo(notification.created_at)}
                  </span>
                </div>
                <p className={`text-sm ${!notification.is_read ? 'text-secondary font-medium' : 'text-muted'}`}>
                  {notification.message}
                </p>
              </div>
              
              {!notification.is_read && (
                <div className="flex-shrink-0 flex items-center justify-center">
                  <button 
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                    title="Mark as read"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
