"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav className="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-xl font-bold text-foreground">E-Book Library</span>
          </Link>
          
          <div className="flex items-center gap-1">
            {user ? (
              <>
                {user.role === "SELLER" && (
                  <>
                    <Link href="/seller/dashboard" className="btn btn-ghost">
                      Dashboard
                    </Link>
                    <Link href="/seller/books" className="btn btn-ghost">
                      My Books
                    </Link>
                    <Link href="/customer/books" className="btn btn-ghost">
                      Browse
                    </Link>
                  </>
                )}
                {user.role === "CUSTOMER" && (
                  <>
                    <Link href="/customer/dashboard" className="btn btn-ghost">
                      Dashboard
                    </Link>
                    <Link href="/customer/books" className="btn btn-ghost">
                      Browse
                    </Link>
                    <Link href="/customer/transactions" className="btn btn-ghost">
                      Purchases
                    </Link>
                  </>
                )}
                {user.role === "MODERATOR" && (
                  <>
                    <Link href="/moderator/dashboard" className="btn btn-ghost">
                      Dashboard
                    </Link>
                    <Link href="/customer/books" className="btn btn-ghost">
                      Browse
                    </Link>
                  </>
                )}
                <div className="ml-2 pl-2 border-l border-border flex items-center gap-3">
                  <Link href="/profile" className="flex items-center gap-2 hover:bg-background/50 rounded-lg px-2 py-1 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted">Level {user.level}</p>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="btn btn-ghost text-danger hover:text-danger"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn btn-ghost">
                  Login
                </Link>
                <Link href="/auth/register" className="btn btn-primary">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
