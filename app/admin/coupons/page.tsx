"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import Modal from "@/app/components/Modal";
import EmptyState from "@/app/components/EmptyState";

interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  min_order_amount: number;
  max_discount?: number;
  usage_limit: number;
  used_count: number;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
  created_at: string;
  usages?: { user: { name: string; email: string } }[];
}

export default function ModeratorCoupons() {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => { document.title = "Coupons | E-Book Library"; }, []);
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, usages: 0, avgDiscount: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "PERCENTAGE" as 'PERCENTAGE' | 'FIXED',
    discount_value: "",
    min_order_amount: "0",
    max_discount: "",
    usage_limit: "1",
    valid_until: ""
  });

  useEffect(() => {
    if (user && user.role === "MODERATOR") {
      fetchCoupons();
    } else if (user) {
      router.push("/");
    } else {
      router.push("/auth/login");
    }
  }, [user, router]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const data = await api.moderator.coupons.list({ limit: 100 });
      setCoupons(data.coupons);
      
      // Calculate stats
      const activeCount = data.coupons.filter(c => c.is_active).length;
      const totalUsages = data.coupons.reduce((sum, c) => sum + c.used_count, 0);
      const percentageCoupons = data.coupons.filter(c => c.discount_type === 'PERCENTAGE');
      const avgDiscount = percentageCoupons.length > 0 
        ? percentageCoupons.reduce((sum, c) => sum + c.discount_value, 0) / percentageCoupons.length 
        : 0;
        
      setStats({
        total: data.total,
        active: activeCount,
        usages: totalUsages,
        avgDiscount
      });
    } catch (err) {
      setErrorMessage("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      code: "",
      description: "",
      discount_type: "PERCENTAGE",
      discount_value: "",
      min_order_amount: "0",
      max_discount: "",
      usage_limit: "100",
      valid_until: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_amount: coupon.min_order_amount.toString(),
      max_discount: coupon.max_discount ? coupon.max_discount.toString() : "",
      usage_limit: coupon.usage_limit.toString(),
      valid_until: coupon.valid_until ? new Date(coupon.valid_until).toISOString().split('T')[0] : ""
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (coupon: Coupon) => {
    setActionLoading("toggle-" + coupon.id);
    try {
      const updated = await api.moderator.coupons.update(coupon.id, { is_active: !coupon.is_active });
      setCoupons(coupons.map(c => c.id === coupon.id ? updated : c));
      setStats(prev => ({ ...prev, active: prev.active + (updated.is_active ? 1 : -1) }));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to update coupon status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this coupon? This cannot be undone.")) return;
    
    setActionLoading("delete-" + id);
    try {
      await api.moderator.coupons.delete(id);
      setCoupons(coupons.filter(c => c.id !== id));
      fetchCoupons(); // Refresh stats
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to delete coupon");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actionLoading) return;
    
    setActionLoading("save");
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        description: formData.description || undefined,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: parseFloat(formData.min_order_amount || "0"),
        max_discount: formData.discount_type === 'PERCENTAGE' && formData.max_discount ? parseFloat(formData.max_discount) : undefined,
        usage_limit: parseInt(formData.usage_limit || "1"),
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : undefined,
      };

      if (editingId) {
        await api.moderator.coupons.update(editingId, payload);
      } else {
        await api.moderator.coupons.create(payload);
      }
      
      setIsModalOpen(false);
      fetchCoupons();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save coupon");
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a small toast notification here
  };

  if (loading) return <div className="flex justify-center p-12"><div className="spinner" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Coupons & Gift Codes</h1>
          <p className="text-secondary mt-1">Manage discount coupons and track usage</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Coupon
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="stat-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <p className="stat-label">Total Coupons</p>
          <p className="stat-value">{stats.total}</p>
        </div>
        <div className="stat-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <p className="stat-label">Active Coupons</p>
          <p className="stat-value text-success">{stats.active}</p>
        </div>
        <div className="stat-card animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <p className="stat-label">Total Usages</p>
          <p className="stat-value text-primary">{stats.usages}</p>
        </div>
        <div className="stat-card animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <p className="stat-label">Avg % Discount</p>
          <p className="stat-value text-warning">{stats.avgDiscount.toFixed(1)}%</p>
        </div>
      </div>

      {coupons.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16 mx-auto text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
          title="No coupons found"
          description="Create one to get started."
        />
      ) : (
        <div className="card table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Discount</th>
                <th>Min Order</th>
                <th>Usage</th>
                <th>Valid Until</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className={!coupon.is_active ? 'opacity-70' : ''}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{coupon.code}</span>
                      <button 
                        onClick={() => copyToClipboard(coupon.code)}
                        className="text-secondary hover:text-primary transition-colors"
                        title="Copy to clipboard"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    {coupon.description && <p className="text-xs text-muted mt-1">{coupon.description}</p>}
                  </td>
                  <td>
                    <span className={`badge ${coupon.discount_type === 'PERCENTAGE' ? 'badge-primary' : 'badge-success'}`}>
                      {coupon.discount_type}
                    </span>
                  </td>
                  <td className="font-medium">
                    {coupon.discount_type === 'PERCENTAGE' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                    {coupon.max_discount && <span className="text-xs text-muted block">max ₹{coupon.max_discount}</span>}
                  </td>
                  <td className="text-secondary">
                    {coupon.min_order_amount > 0 ? `₹${coupon.min_order_amount}` : "—"}
                  </td>
                  <td>
                    <div className="flex flex-col gap-1 w-24">
                      <div className="flex justify-between text-xs">
                        <span className={coupon.used_count >= coupon.usage_limit ? "text-danger font-medium" : "text-secondary"}>
                          {coupon.used_count} / {coupon.usage_limit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full ${coupon.used_count >= coupon.usage_limit ? "bg-danger" : "bg-primary"}`} 
                          style={{ width: `${Math.min(100, (coupon.used_count / coupon.usage_limit) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm">
                    {coupon.valid_until ? (
                      <span className={new Date(coupon.valid_until) < new Date() ? "text-danger" : "text-secondary"}>
                        {new Date(coupon.valid_until).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-success text-xs font-medium">No expiry</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleActive(coupon)}
                      disabled={actionLoading === "toggle-" + coupon.id}
                      className={`badge cursor-pointer ${coupon.is_active ? 'badge-success hover:bg-success hover:text-white' : 'badge-danger hover:bg-danger hover:text-white'} transition-colors`}
                    >
                      {actionLoading === "toggle-" + coupon.id ? "..." : (coupon.is_active ? "Active" : "Inactive")}
                    </button>
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(coupon)}
                        className="p-1.5 text-secondary hover:text-primary hover:bg-primary/10 rounded transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(coupon.id)}
                        disabled={actionLoading === "delete-" + coupon.id}
                        className="p-1.5 text-secondary hover:text-danger hover:bg-danger/10 rounded transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Coupon" : "Create Coupon"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Code *</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              disabled={!!editingId}
              placeholder="e.g. SUMMER50"
              className="input uppercase font-mono"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Internal note about this coupon"
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Discount Type *</label>
              <div className="flex gap-4 h-[42px] items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="discount_type"
                    value="PERCENTAGE"
                    checked={formData.discount_type === 'PERCENTAGE'}
                    onChange={() => setFormData({ ...formData, discount_type: 'PERCENTAGE' })}
                    className="text-primary"
                  />
                  <span className="text-sm">Percentage (%)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="discount_type"
                    value="FIXED"
                    checked={formData.discount_type === 'FIXED'}
                    onChange={() => setFormData({ ...formData, discount_type: 'FIXED' })}
                    className="text-primary"
                  />
                  <span className="text-sm">Fixed (₹)</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Discount Value *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                className="input"
                placeholder={formData.discount_type === 'PERCENTAGE' ? "e.g. 15" : "e.g. 100"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Min Order Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.min_order_amount}
                onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                className="input"
              />
            </div>
            {formData.discount_type === 'PERCENTAGE' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Max Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.max_discount}
                  onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                  placeholder="No limit"
                  className="input"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Usage Limit *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Valid Until</label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" disabled={actionLoading === "save"} className="btn btn-primary flex-1">
              {actionLoading === "save" ? "Saving..." : "Save Coupon"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Error Alert Modal */}
      <Modal isOpen={!!errorMessage} onClose={() => setErrorMessage(null)} title="Error">
        <p className="text-secondary mb-6">{errorMessage}</p>
        <button onClick={() => setErrorMessage(null)} className="btn btn-primary w-full">OK</button>
      </Modal>
    </div>
  );
}
