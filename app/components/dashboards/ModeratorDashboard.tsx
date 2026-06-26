"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ModeratorDashboard as ModeratorDashboardType, TopSeller, ReturnRequest } from "@/lib/api";
import Link from "next/link";
import Modal from "@/app/components/Modal";
import EmptyState from "@/app/components/EmptyState";

export default function ModeratorDashboard() {
  useAuth();
  const [stats, setStats] = useState<ModeratorDashboardType | null>(null);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [pendingReturns, setPendingReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");
  const [approving, setApproving] = useState<string | null>(null);
  const [confirmApprove, setConfirmApprove] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.moderator.getDashboard(),
      api.moderator.getTopSellers(period),
      api.moderator.getPendingReturns()
    ]).then(([statsData, sellersData, returnsData]) => {
      setStats(statsData);
      setTopSellers(sellersData);
      setPendingReturns(returnsData);
    }).finally(() => setLoading(false));
  }, [period]);

  const handleApprove = async (transactionId: string) => {
    setConfirmApprove(null);
    setApproving(transactionId);
    try {
      await api.moderator.approveReturn(transactionId);
      setPendingReturns(pendingReturns.filter(r => r.id !== transactionId));
      setModalMessage({ type: "success", text: "Return approved!" });
    } catch (err) {
      setModalMessage({ type: "error", text: err instanceof Error ? err.message : "Approval failed" });
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setRejecting(true);
    try {
      await api.moderator.rejectReturn(rejectTarget, rejectReason);
      setPendingReturns(pendingReturns.filter(r => r.id !== rejectTarget));
      setRejectTarget(null);
      setRejectReason("");
      setModalMessage({ type: "success", text: "Return rejected. Customer has been notified via email." });
    } catch (err) {
      setModalMessage({ type: "error", text: err instanceof Error ? err.message : "Rejection failed" });
    } finally {
      setRejecting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="spinner" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Moderator Dashboard</h1>
        <p className="text-secondary mt-1">Platform overview and analytics</p>
      </div>
      
      {/* Stats Grid */}
      {stats && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="stat-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="stat-label">Total Revenue</p>
            </div>
            <p className="stat-value text-success">₹{stats.total_earnings.toFixed(2)}</p>
          </div>
          
          <div className="stat-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="stat-label">Total Sales</p>
            </div>
            <p className="stat-value">{stats.total_sales}</p>
          </div>
          
          <div className="stat-card animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="stat-label">Pending Fines</p>
            </div>
            <p className="stat-value text-warning">₹{stats.pending_fines.toFixed(2)}</p>
          </div>
          
          <div className="stat-card animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21l-7-7-7 7M12 3l2.5 5.5L19 8.5l-4.5 4L16 18l-4-2.5L8 18l1.5-5.5L5 8.5l4.5-.5L12 3z" />
                </svg>
              </div>
              <p className="stat-label">Commission Earned</p>
            </div>
            <p className="stat-value text-info">₹{stats.total_commission.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Platform Stats */}
      {stats && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total_books}</p>
                <p className="text-sm text-secondary">Total Books</p>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total_users}</p>
                <p className="text-sm text-secondary">Total Users</p>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total_sellers}</p>
                <p className="text-sm text-secondary">Sellers</p>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total_customers}</p>
                <p className="text-sm text-secondary">Customers</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Link href="/manage-books" className="card card-interactive p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="font-medium text-sm">Manage Books</span>
        </Link>
        
        <Link href="/admin/users" className="card card-interactive p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <span className="font-medium text-sm">Manage Users</span>
        </Link>
        
        <Link href="/admin/returns" className="card card-interactive p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          <span className="font-medium text-sm">Track Returns</span>
        </Link>
        
        <Link href="/admin/fines" className="card card-interactive p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="font-medium text-sm">Manage Fines</span>
        </Link>
        
        <Link href="/admin/reports" className="card card-interactive p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="font-medium text-sm">View Reports</span>
        </Link>
      </div>

      {/* Pending Returns */}
      {pendingReturns.length > 0 && (
        <div className="card mb-8">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Pending Return Requests</h2>
            <Link href="/admin/returns" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Customer</th>
                  <th>Days</th>
                  <th>Amount</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingReturns.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.book_title}</td>
                    <td>{r.customer_name}</td>
                    <td>{r.rental_days}</td>
                    <td className="font-semibold">₹{r.total_amount.toFixed(2)}</td>
                    <td className="text-sm">
                      {r.return_requested_at
                        ? new Date(r.return_requested_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmApprove(r.id)}
                          disabled={approving === r.id}
                          className="btn btn-primary text-sm"
                        >
                          {approving === r.id ? "Approving..." : "Approve"}
                        </button>
                        <button
                          onClick={() => { setRejectTarget(r.id); setRejectReason(""); }}
                          className="btn btn-outline text-sm text-danger border-danger"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Sellers */}
      <div className="card">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Top Sellers</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setPeriod("day")}
                className={`btn btn-sm ${period === "day" ? "btn-primary" : "btn-outline"}`}
              >
                Today
              </button>
              <button
                onClick={() => setPeriod("week")}
                className={`btn btn-sm ${period === "week" ? "btn-primary" : "btn-outline"}`}
              >
                This Week
              </button>
              <button
                onClick={() => setPeriod("month")}
                className={`btn btn-sm ${period === "month" ? "btn-primary" : "btn-outline"}`}
              >
                This Month
              </button>
            </div>
          </div>
        </div>

        {topSellers.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16 mx-auto text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            title="No sales data"
            description="No sales recorded for this period."
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Seller</th>
                  <th>Total Sales</th>
                  <th>Books Sold</th>
                </tr>
              </thead>
              <tbody>
                {topSellers.map((seller, index) => (
                  <tr key={seller.seller_id}>
                    <td>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? "bg-yellow-100 text-yellow-700" :
                        index === 1 ? "bg-gray-100 text-gray-700" :
                        index === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-primary/10 text-primary"
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {seller.seller_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium">{seller.seller_name}</span>
                      </div>
                    </td>
                    <td className="font-semibold text-success">₹{seller.total_sales.toFixed(2)}</td>
                    <td>{seller.books_sold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Approve Modal */}
      <Modal isOpen={!!confirmApprove} onClose={() => setConfirmApprove(null)} title="Approve Return">
        <p className="text-secondary mb-6">Approve this return? The book will be added back to stock and late fees will be calculated if overdue.</p>
        <div className="flex gap-3">
          <button onClick={() => setConfirmApprove(null)} className="btn btn-outline flex-1">Cancel</button>
          <button onClick={() => confirmApprove && handleApprove(confirmApprove)} className="btn btn-primary flex-1">Approve Return</button>
        </div>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal isOpen={!!rejectTarget} onClose={() => { setRejectTarget(null); setRejectReason(""); }} title="Reject Return">
        <div className="space-y-4">
          <p className="text-secondary">Provide a reason for rejecting this return. The customer will be notified via email.</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="input min-h-[100px] w-full"
            rows={4}
          />
          <div className="flex gap-3">
            <button onClick={() => { setRejectTarget(null); setRejectReason(""); }} className="btn btn-outline flex-1">Cancel</button>
            <button
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejecting}
              className="btn btn-danger flex-1"
            >
              {rejecting ? "Rejecting..." : "Reject Return"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Message Modal */}
      <Modal isOpen={!!modalMessage} onClose={() => setModalMessage(null)} title={modalMessage?.type === "success" ? "Success" : "Error"}>
        <p className="text-secondary mb-6">{modalMessage?.text}</p>
        <button onClick={() => setModalMessage(null)} className="btn btn-primary w-full">OK</button>
      </Modal>
    </div>
  );
}
