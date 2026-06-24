"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, SellerEarnings, Book } from "@/lib/api";
import Link from "next/link";

export default function SellerDashboard() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<SellerEarnings | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");

  useEffect(() => {
    if (user) {
      Promise.all([
        api.seller.getEarnings(user.id, period),
        api.seller.getBooks(user.id)
      ]).then(([earningsData, booksData]) => {
        setEarnings(earningsData[0] || null);
        setBooks(booksData);
      }).finally(() => setLoading(false));
    }
  }, [user, period]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="spinner" />
    </div>
  );

  const lowStockBooks = books.filter(b => b.stock < 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Seller Dashboard</h1>
        <p className="text-secondary mt-1">Welcome back, {user?.name}</p>
      </div>
      
      {/* Period Selector */}
      <div className="flex gap-2 mb-6">
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

      {/* Stats Grid */}
      {earnings && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="stat-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="stat-label">Earnings</p>
            </div>
            <p className="stat-value text-success">₹{earnings.earnings.toFixed(2)}</p>
          </div>
          
          <div className="stat-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="stat-label">Sales</p>
            </div>
            <p className="stat-value">{earnings.sales_count}</p>
          </div>
          
          <div className="stat-card animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <p className="stat-label">Commission Paid</p>
            </div>
            <p className="stat-value text-warning">₹{earnings.commission_paid.toFixed(2)}</p>
          </div>
          
          <div className="stat-card animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="stat-label">Total Books</p>
            </div>
            <p className="stat-value">{books.length}</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-6 sm:grid-cols-2 mb-8">
        <Link href="/seller/books" className="card card-interactive p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Manage Books</h3>
            <p className="text-sm text-secondary">View and edit your inventory</p>
          </div>
        </Link>
        
        <Link href="/seller/books/new" className="card card-interactive p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Add New Book</h3>
            <p className="text-sm text-secondary">List a new book for sale</p>
          </div>
        </Link>

        <Link href="/seller/returns" className="card card-interactive p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Return Requests</h3>
            <p className="text-sm text-secondary">Approve customer returns</p>
          </div>
        </Link>
      </div>

      {/* Low Stock Alert */}
      {lowStockBooks.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground">Low Stock Alert</h3>
          </div>
          <p className="text-secondary mb-4">The following books have less than 5 copies in stock:</p>
          <div className="space-y-2">
            {lowStockBooks.map(book => (
              <div key={book.id} className="flex items-center justify-between p-3 bg-warning/5 rounded-lg">
                <span className="font-medium">{book.title}</span>
                <span className="badge badge-warning">{book.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
