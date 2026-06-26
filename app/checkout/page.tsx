"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, UserRole } from "@/lib/api";
import Link from "next/link";

type Step = "form" | "password" | "processing";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const bookId = searchParams.get("book_id");
  const type = searchParams.get("type") || "buy";
  const days = parseInt(searchParams.get("days") || "1");
  const { user, setUser } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [subscribe, setSubscribe] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { document.title = "Checkout | E-Book Library"; }, []);

  useEffect(() => {
    if (bookId) {
      api.books.get(bookId).then(b => setBookTitle(b.title)).catch(() => {});
    }
  }, [bookId]);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    if (!bookId) { setError("Missing book information"); setSubmitting(false); return; }

    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        throw new Error("Server error");
      }
      const data = await res.json();
      setIsNewUser(!data.exists);
      setStep("password");
    } catch {
      setError("Failed to verify email. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!bookId) return;
    setStep("processing");
    setError(null);

    try {
      let currentUser = user;

      if (!currentUser) {
        if (isNewUser) {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              name,
              password,
              role: "CUSTOMER" as UserRole,
              phone,
              address,
              city,
              state,
              pincode,
              newsletter: subscribe,
            }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: "Registration failed" }));
            throw new Error(err.detail || "Registration failed");
          }
          currentUser = await res.json().catch(() => { throw new Error("Invalid server response"); });
          setUser(currentUser);
        } else {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: "Invalid email or password" }));
            throw new Error(err.detail || "Invalid email or password");
          }
          currentUser = await res.json().catch(() => { throw new Error("Invalid server response"); });
          setUser(currentUser);
        }

        if (subscribe && email) {
          fetch("/api/newsletter/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          }).catch(() => {});
        }
      }

      if (!currentUser) throw new Error("Authentication failed");

      let transaction;
      if (type === "rent") {
        transaction = await api.customer.rent(currentUser.id, {
          book_id: bookId,
          quantity: 1,
          type: "RENT",
          rental_days: days,
        });
      } else {
        transaction = await api.customer.purchase(currentUser.id, {
          book_id: bookId,
          quantity: 1,
        });
      }

      router.push(`/payment?transactionId=${transaction.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed. Please try again.");
      setStep("password");
    }
  };

  if (!bookId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="text-center">
          <p className="text-secondary mb-4">No book selected for checkout.</p>
          <Link href="/" className="btn btn-primary">Browse Books</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary/5 via-background to-success/5">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
          {bookTitle && <p className="text-secondary mt-1">{bookTitle} &mdash; {type === "rent" ? "Rent" : "Buy"}</p>}
        </div>

        <div className="card p-8">
          {error && (
            <div className="alert alert-danger mb-6">{error}</div>
          )}

          {step === "form" && (
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Name *</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="input" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email *</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Phone *</label>
                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Address *</label>
                <textarea required rows={2} value={address} onChange={e => setAddress(e.target.value)} className="input resize-none" placeholder="Street, area, landmark" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">City *</label>
                  <input type="text" required value={city} onChange={e => setCity(e.target.value)} className="input" placeholder="Mumbai" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">State *</label>
                  <input type="text" required value={state} onChange={e => setState(e.target.value)} className="input" placeholder="Maharashtra" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Pincode *</label>
                <input type="text" required value={pincode} onChange={e => setPincode(e.target.value)} className="input" placeholder="400001" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={subscribe} onChange={e => setSubscribe(e.target.checked)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                <span className="text-sm text-secondary">Subscribe to our newsletter</span>
              </label>
              <button type="submit" disabled={submitting} className="btn btn-primary w-full">{submitting ? "Checking..." : "Continue"}</button>
            </form>
          )}

          {step === "password" && (
            <div className="space-y-5">
              <div className="bg-background rounded-xl p-4">
                <p className="text-sm text-secondary">
                  {isNewUser
                    ? "Create a password for your new account:"
                    : "Enter your password to continue:"}
                </p>
                <p className="text-sm font-medium text-foreground mt-1">{email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="Enter password" autoFocus />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep("form")} className="btn btn-outline flex-1">Back</button>
                <button onClick={handleConfirm} disabled={!password} className="btn btn-primary flex-1">
                  {isNewUser ? "Create Account & Checkout" : "Sign In & Checkout"}
                </button>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="spinner !w-8 !h-8 !border-3" />
              <p className="text-secondary">Processing your order...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="spinner" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
