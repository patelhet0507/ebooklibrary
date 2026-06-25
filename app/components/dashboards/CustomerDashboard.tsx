"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, CustomerDashboard as CustomerDashboardType, Transaction, Fine } from "@/lib/api";
import Link from "next/link";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CustomerDashboardType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      Promise.all([
        api.customer.getDashboard(user.id),
        api.customer.getTransactions(user.id),
        api.customer.getFines(user.id)
      ]).then(([statsData, transactionsData, finesData]) => {
        setStats(statsData);
        setTransactions(transactionsData);
        setFines(finesData);
      }).finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="spinner" />
    </div>
  );

  const recentTransactions = transactions.slice(0, 5);
  const pendingFines = fines.filter(f => f.status === "PENDING");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
        <p className="text-secondary mt-1">Welcome back, {user?.name}</p>
      </div>
      
      {/* Stats Grid */}
      {stats && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6 mb-8">
          <div className="stat-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="stat-label">Total Spent</p>
            </div>
            <p className="stat-value text-success">₹{stats.total_spent.toFixed(2)}</p>
          </div>
          
          <div className="stat-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="stat-label">Purchases</p>
            </div>
            <p className="stat-value">{stats.total_purchases}</p>
          </div>
          
          <div className="stat-card animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <p className="stat-label">Returned</p>
            </div>
            <p className="stat-value">{stats.books_returned}</p>
          </div>
          
          <div className="stat-card animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="stat-label">Owned Books</p>
            </div>
            <p className="stat-value">{stats.owned_books}</p>
          </div>

          <div className="stat-card animate-fade-in" style={{ animationDelay: "0.45s" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="stat-label">Active Rentals</p>
            </div>
            <p className="stat-value">{stats.active_rentals}</p>
          </div>

          <div className="stat-card animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="stat-label">Overdue Rentals</p>
            </div>
            <p className="stat-value text-danger">{stats.overdue_rentals}</p>
          </div>

          <div className="stat-card animate-fade-in" style={{ animationDelay: "0.55s" }}>
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
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-6 sm:grid-cols-3 mb-8">
        <Link href="/browse" className="card card-interactive p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Browse Books</h3>
            <p className="text-sm text-secondary">Discover new books</p>
          </div>
        </Link>
        
        <Link href="/transactions" className="card card-interactive p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">My Purchases</h3>
            <p className="text-sm text-secondary">View purchase history</p>
          </div>
        </Link>
        
        <Link href="/my/fines" className="card card-interactive p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Pay Fines</h3>
            <p className="text-sm text-secondary">Manage outstanding fines</p>
          </div>
        </Link>
      </div>

      {/* Pending Fines Alert */}
      {pendingFines.length > 0 && (
        <div className="alert alert-warning mb-8 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p>
            You have <strong>{pendingFines.length}</strong> pending fine(s).{" "}
             <Link href="/my/fines" className="underline font-medium">Pay now</Link>
          </p>
        </div>
      )}

      {/* Overdue Rentals Alert */}
      {stats && stats.overdue_rentals > 0 && (
        <div className="alert alert-danger mb-8 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>
            You have <strong>{stats.overdue_rentals}</strong> overdue rental(s). Return them to avoid additional fines.
          </p>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="card">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
             <Link href="/transactions" className="text-primary text-sm font-medium hover:underline">
              View all
            </Link>
          </div>
        </div>
        
        {recentTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="text-lg font-medium text-foreground mb-2">No activity yet</h3>
            <p className="text-secondary mb-4">Start browsing books to make your first purchase or rental.</p>
             <Link href="/browse" className="btn btn-primary">
              Browse Books
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Book ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t) => (
                  <tr key={t.id}>
                    <td className="font-mono text-sm">{t.book_id.slice(0, 8)}...</td>
                    <td>
                      <span className={`badge ${t.type === "PURCHASE" ? "badge-primary" : t.type === "RENT" ? "badge-info" : "badge-success"}`}>
                        {t.type === "RENT" ? `RENT (${t.rental_days}d)` : t.type}
                      </span>
                    </td>
                    <td className="font-semibold">₹{t.total_amount.toFixed(2)}</td>
                    <td>{t.due_date ? new Date(t.due_date).toLocaleDateString() : "-"}</td>
                    <td>
                      {t.returned_at ? (
                        <span className="badge badge-success">Returned</span>
                      ) : t.type === "RENT" && t.due_date && new Date(t.due_date) < new Date() ? (
                        <span className="badge badge-danger">Overdue!</span>
                      ) : t.type === "RENT" ? (
                        <span className="badge badge-warning">Due {new Date(t.due_date!).toLocaleDateString()}</span>
                      ) : t.type === "PURCHASE" ? (
                        <span className="badge badge-warning">Active</span>
                      ) : (
                        <span className="badge badge-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
