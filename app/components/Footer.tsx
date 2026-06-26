"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/app/components/Toast";
import { isSubscribed, setSubscribed } from "@/lib/newsletter";

export default function Footer() {
  const { user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [localSubscribed, setLocalSubscribed] = useState(false);
  const [justSubscribed, setJustSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  useEffect(() => { if (!user) setLocalSubscribed(isSubscribed()); }, [user]);
  const subscribed = justSubscribed || (user ? !!user.newsletter : localSubscribed);
  const { toast } = useToast();
  return (
    <footer className="border-t border-border mt-auto bg-white/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-base font-bold text-foreground">E-Book Library</span>
            </Link>
            <p className="text-sm text-secondary leading-relaxed max-w-xs">
              A modern multi-role digital book marketplace. Buy, rent, and manage books with an elegant, role-based platform.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2.5">
              <li><Link href="/browse" className="text-sm text-secondary hover:text-primary transition-colors">Browse Books</Link></li>
              <li><Link href="/transactions" className="text-sm text-secondary hover:text-primary transition-colors">My Purchases</Link></li>
              <li><Link href="/profile" className="text-sm text-secondary hover:text-primary transition-colors">Profile</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Newsletter</h3>
            {subscribed ? (
              <p className="text-sm text-success">You're subscribed! Stay tuned for updates.</p>
            ) : (
              <>
                <p className="text-sm text-secondary mb-3">Get notified about new book releases and offers.</p>
                <form onSubmit={(e) => { e.preventDefault(); if (subscribing || !email.trim()) return; if (!user) { router.push(`/auth/login?subscribe=true&email=${encodeURIComponent(email)}`); return; } setSubscribing(true); fetch("/api/newsletter/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).then(res => { if (!res.ok) throw new Error(); setJustSubscribed(true); toast("success", "Subscribed to newsletter!"); setEmail(""); }).catch(() => toast("error", "Failed to subscribe. Try again.")).finally(() => setSubscribing(false)); }} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="input text-sm flex-1"
                    required
                    disabled={subscribing}
                  />
                  <button type="submit" disabled={subscribing} className="btn btn-primary btn-sm">{subscribing ? "Subscribing..." : "Subscribe"}</button>
                </form>
              </>
            )}
          </div>
        </div>
        <div className="border-t border-border/60 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} E-Book Library. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-muted">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
