"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/app/components/Toast";
import { api } from "@/lib/api";

export default function SellerKYC() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user) router.push("/auth/login");
    else if (user.role !== "SELLER") router.push("/");
  }, [user, router]);

  useEffect(() => { document.title = "Seller Verification | E-Book Library"; }, []);

  const [form, setForm] = useState({
    businessName: "",
    gstin: "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    pincode: user?.pincode || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await api.seller.submitKYC(user.id, form);
      setSubmitted(true);
      toast("success", "Verification details submitted! We'll review your application.");
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to submit verification details");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
        <div className="card p-8 text-center">
          <div className="mb-4 text-4xl">✅</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Verification Submitted</h2>
          <p className="text-secondary mb-6">Thank you! We'll review your application and notify you once it's approved.</p>
          <button onClick={() => router.push("/")} className="btn btn-primary">Return to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Seller Verification</h1>
        <p className="text-secondary mt-1">Complete your profile to start selling books</p>
      </div>
      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">Business / Store Name *</label>
              <input type="text" required value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="input" aria-label="Business Name" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">GSTIN (optional)</label>
              <input type="text" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} className="input" placeholder="22AAAAA0000A1Z5" aria-label="GSTIN" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Phone *</label>
              <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" aria-label="Phone Number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Pincode</label>
              <input type="text" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} className="input" aria-label="Pincode" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">Address</label>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input resize-none" rows={2} aria-label="Address" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">City</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" aria-label="City" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">State</label>
              <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="input" aria-label="State" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? "Submitting..." : "Submit for Verification"}
          </button>
        </form>
      </div>
    </div>
  );
}
