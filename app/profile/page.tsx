"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, User, UserProfileUpdate } from "@/lib/api";
import Modal from "@/app/components/Modal";

export const dynamic = "force-dynamic";

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (user) {
      api.profile.get(user.id).then((data) => {
        setProfile(data);
        setFormData({
          name: data.name,
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
        });
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const updateData: UserProfileUpdate = {
        name: formData.name,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        pincode: formData.pincode || undefined,
      };

      const updated = await api.profile.update(user.id, updateData);
      setProfile(updated);
      setEditing(false);
      setSaving(false);
      setShowSuccess(true);
    } catch (err) {
      setSaving(false);
    }
  };

  const startEditing = () => {
    setEditing(true);
  };

  const cancelEditing = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        pincode: profile.pincode || "",
      });
    }
    setEditing(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="spinner" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-secondary mt-1">Manage your account information</p>
        </div>
        {!editing && (
          <button onClick={startEditing} className="btn btn-outline">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        )}
      </div>

      {/* XP Progress */}
      {profile && (
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">L{profile.level}</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">Level {profile.level}</p>
                <p className="text-sm text-secondary">{profile.xp} XP</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-secondary">
                {1000 - (profile.xp % 1000)} XP to next level
              </p>
            </div>
          </div>
          <div className="w-full bg-border rounded-full h-3">
            <div
              className="bg-primary rounded-full h-3 transition-all duration-500"
              style={{ width: `${((profile.xp % 1000) / 1000) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Profile Form */}
      <div className="card p-6">
        {editing && (
          <div className="flex items-center gap-2 px-4 py-2.5 mb-6 rounded-xl bg-primary/5 border border-primary/10 text-sm text-primary font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            You are editing your profile. Save or cancel when done.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Enter your full name"
              disabled={!editing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <input
              type="email"
              disabled
              value={user?.email || ""}
              className="input bg-background"
            />
            <p className="text-xs text-secondary mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input"
              placeholder="Enter phone number"
              disabled={!editing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Address</label>
            <textarea
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input resize-none"
              placeholder="Enter your address"
              disabled={!editing}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="input"
                placeholder="City"
                disabled={!editing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="input"
                placeholder="State"
                disabled={!editing}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Pincode</label>
            <input
              type="text"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              className="input w-32"
              placeholder="Pincode"
              disabled={!editing}
            />
          </div>

          {editing && (
            <div className="pt-4 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary flex-1"
              >
                {saving ? (
                  <>
                    <span className="spinner !w-4 !h-4 !border-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Success Modal */}
      <Modal isOpen={showSuccess} onClose={() => setShowSuccess(false)} title="Profile Updated">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-secondary mb-6">Your profile has been saved successfully.</p>
          <button
            onClick={() => setShowSuccess(false)}
            className="btn btn-primary w-full"
          >
            OK
          </button>
        </div>
      </Modal>
    </div>
  );
}
