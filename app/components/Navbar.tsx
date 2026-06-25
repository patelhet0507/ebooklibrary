"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const navLink = (href: string, label: string, icon?: string) => (
    <Link
      href={href}
      className="relative px-3 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors rounded-xl hover:bg-primary-light group"
    >
      {label}
      <span className="absolute inset-x-3 -bottom-px h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
    </Link>
  );

  const iconLink = (href: string, label: string, children: React.ReactNode) => (
    <Link
      href={href}
      className="relative p-2 text-secondary hover:text-primary transition-colors rounded-xl hover:bg-primary-light group"
      title={label}
    >
      {children}
    </Link>
  );

  return (
    <nav className="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-bold text-foreground">E-Book Library</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                {user.role === "SELLER" && (
                  <>
                    {navLink("/seller/dashboard", "Dashboard")}
                    {navLink("/seller/books", "My Books")}
                    {navLink("/customer/books", "Browse")}
                  </>
                )}
                {user.role === "CUSTOMER" && (
                  <>
                    {navLink("/customer/dashboard", "Dashboard")}
                    {navLink("/customer/books", "Browse")}
                    {navLink("/customer/transactions", "Purchases")}
                    {iconLink("/customer/wishlist", "Wishlist",
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    )}
                    {iconLink("/customer/notifications", "Notifications",
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.437L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    )}
                  </>
                )}
                {user.role === "MODERATOR" && (
                  <>
                    {navLink("/moderator/dashboard", "Dashboard")}
                    {navLink("/moderator/reports", "Analytics")}
                    {navLink("/moderator/coupons", "Coupons")}
                    {navLink("/customer/books", "Browse")}
                  </>
                )}
                <div className="ml-3 pl-3 border-l border-border flex items-center gap-2">
                  <Link href="/profile" className="flex items-center gap-2.5 hover:bg-primary-light rounded-xl px-3 py-1.5 transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shadow-sm">
                      <span className="text-sm font-semibold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted">Level {user.level}</p>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-secondary hover:text-danger transition-colors rounded-xl hover:bg-red-50"
                    title="Logout"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <>
                {navLink("/auth/login", "Login")}
                <Link href="/auth/register" className="btn btn-primary btn-sm ml-2">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl text-secondary hover:text-primary hover:bg-primary-light transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 animate-slide-in">
            <div className="flex flex-col gap-1 pt-2 border-t border-border">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center">
                      <span className="text-base font-semibold text-white">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted">{user.email} &middot; Level {user.level}</p>
                    </div>
                  </div>
                  {user.role === "SELLER" && (
                    <>
                      <Link href="/seller/dashboard" className="px-3 py-2 text-sm rounded-xl hover:bg-primary-light transition-colors" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                      <Link href="/seller/books" className="px-3 py-2 text-sm rounded-xl hover:bg-primary-light transition-colors" onClick={() => setMobileOpen(false)}>My Books</Link>
                      <Link href="/customer/books" className="px-3 py-2 text-sm rounded-xl hover:bg-primary-light transition-colors" onClick={() => setMobileOpen(false)}>Browse</Link>
                    </>
                  )}
                  {user.role === "CUSTOMER" && (
                    <>
                      <Link href="/customer/dashboard" className="px-3 py-2 text-sm rounded-xl hover:bg-primary-light transition-colors" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                      <Link href="/customer/books" className="px-3 py-2 text-sm rounded-xl hover:bg-primary-light transition-colors" onClick={() => setMobileOpen(false)}>Browse</Link>
                      <Link href="/customer/transactions" className="px-3 py-2 text-sm rounded-xl hover:bg-primary-light transition-colors" onClick={() => setMobileOpen(false)}>Purchases</Link>
                      <Link href="/customer/wishlist" className="px-3 py-2 text-sm rounded-xl hover:bg-primary-light transition-colors" onClick={() => setMobileOpen(false)}>Wishlist</Link>
                      <Link href="/customer/notifications" className="px-3 py-2 text-sm rounded-xl hover:bg-primary-light transition-colors" onClick={() => setMobileOpen(false)}>Notifications</Link>
                    </>
                  )}
                  {user.role === "MODERATOR" && (
                    <>
                      <Link href="/moderator/dashboard" className="px-3 py-2 text-sm rounded-xl hover:bg-primary-light transition-colors" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                      <Link href="/moderator/reports" className="px-3 py-2 text-sm rounded-xl hover:bg-primary-light transition-colors" onClick={() => setMobileOpen(false)}>Analytics</Link>
                      <Link href="/moderator/coupons" className="px-3 py-2 text-sm rounded-xl hover:bg-primary-light transition-colors" onClick={() => setMobileOpen(false)}>Coupons</Link>
                      <Link href="/customer/books" className="px-3 py-2 text-sm rounded-xl hover:bg-primary-light transition-colors" onClick={() => setMobileOpen(false)}>Browse</Link>
                    </>
                  )}
                  <hr className="border-border my-2" />
                  <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="px-3 py-2 text-sm text-left rounded-xl hover:bg-red-50 text-danger transition-colors">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="px-3 py-2 text-sm rounded-xl hover:bg-primary-light transition-colors" onClick={() => setMobileOpen(false)}>Login</Link>
                  <Link href="/auth/register" className="px-3 py-2 text-sm font-medium text-primary rounded-xl hover:bg-primary-light transition-colors" onClick={() => setMobileOpen(false)}>Create Account</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
