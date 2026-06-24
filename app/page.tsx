"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-success/5 py-20 sm:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%233b82f6%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-6 animate-fade-in">
            E-Book Library
          </h1>
          <p className="text-xl text-secondary max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            A complete digital book marketplace with role-based access for sellers, customers, and moderators.
          </p>
          
          {!user ? (
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <Link href="/auth/login" className="btn btn-primary text-base px-8 py-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login
              </Link>
              <Link href="/auth/register" className="btn btn-outline text-base px-8 py-3">
                Create Account
              </Link>
            </div>
          ) : (
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <p className="text-secondary mb-4">Welcome back, {user.name}!</p>
              {user.role === "SELLER" && (
                <Link href="/seller/dashboard" className="btn btn-primary text-base px-8 py-3">
                  Go to Dashboard
                </Link>
              )}
              {user.role === "CUSTOMER" && (
                <Link href="/customer/books" className="btn btn-primary text-base px-8 py-3">
                  Browse Books
                </Link>
              )}
              {user.role === "MODERATOR" && (
                <Link href="/moderator/reports" className="btn btn-primary text-base px-8 py-3">
                  View Reports
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Built for Everyone
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="card card-interactive p-8 text-center animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">For Sellers</h3>
              <p className="text-secondary">
                List your books, manage inventory with easy stock controls, and track your earnings with detailed analytics.
              </p>
            </div>

            <div className="card card-interactive p-8 text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-success/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">For Customers</h3>
              <p className="text-secondary">
                Browse, purchase, and return books easily with a generous 14-day return window.
              </p>
            </div>

            <div className="card card-interactive p-8 text-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-warning/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">For Moderators</h3>
              <p className="text-secondary">
                Manage the platform, track returns, handle fines, and view comprehensive reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-4 text-center">
            <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <p className="text-4xl font-bold text-primary">14</p>
              <p className="text-secondary mt-1">Day Returns</p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <p className="text-4xl font-bold text-success">15%</p>
              <p className="text-secondary mt-1">Commission Rate</p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <p className="text-4xl font-bold text-warning">₹5</p>
              <p className="text-secondary mt-1">Daily Fine</p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <p className="text-4xl font-bold text-danger">24/7</p>
              <p className="text-secondary mt-1">Access</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-secondary text-sm">
        <p>E-Book Library &copy; {new Date().getFullYear()}. Built with Next.js & FastAPI.</p>
      </footer>
    </div>
  );
}
