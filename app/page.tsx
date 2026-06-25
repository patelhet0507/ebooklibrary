"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/[0.04] via-background to-blue-400/[0.04] py-24 sm:py-36">
        {/* Decorative background blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-400/5 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-primary/[0.03] to-blue-400/[0.03] blur-[80px] rotate-12" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Multi-Role Digital Library Platform
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-foreground mb-6 animate-fade-in-up leading-[1.1]">
            Your Digital Library,{" "}
            <span className="text-gradient">Reimagined</span>
          </h1>

          <p className="text-lg sm:text-xl text-secondary max-w-2xl mx-auto mb-10 animate-fade-in-up leading-relaxed" style={{ animationDelay: "0.15s" }}>
            A complete digital book marketplace with role-based access for sellers, customers, and moderators.
            Buy, rent, and manage books with ease.
          </p>

          {!user ? (
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
              <Link href="/auth/login" className="btn btn-primary btn-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </Link>
              <Link href="/auth/register" className="btn btn-outline btn-lg">
                Create Free Account
              </Link>
            </div>
          ) : (
            <div className="animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
              <p className="text-secondary mb-6 text-lg">Welcome back, <span className="font-semibold text-foreground">{user.name}</span>!</p>
              <div className="flex flex-wrap justify-center gap-3">
                {user.role === "SELLER" && (
                  <Link href="/seller/dashboard" className="btn btn-primary btn-lg">
                    Go to Dashboard
                  </Link>
                )}
                {user.role === "CUSTOMER" && (
                  <Link href="/customer/books" className="btn btn-primary btn-lg">
                    Browse Books
                  </Link>
                )}
                {user.role === "MODERATOR" && (
                  <Link href="/moderator/dashboard" className="btn btn-primary btn-lg">
                    Moderator Dashboard
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="relative">
        <div className="section-divider" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {[
              { value: "14", label: "Day Returns", color: "text-primary" },
              { value: "15%", label: "Commission", color: "text-success" },
              { value: "₹5", label: "Daily Fine", color: "text-warning" },
              { value: "24/7", label: "Access", color: "text-primary" },
            ].map((stat, i) => (
              <div key={stat.label} className="text-center animate-fade-in-up" style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
                <p className={`text-4xl sm:text-5xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-muted mt-1.5 font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* ── Features Section ── */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Built for <span className="text-gradient">Everyone</span>
            </h2>
            <p className="text-secondary max-w-xl mx-auto">
              Three distinct experiences tailored to your role in the ecosystem.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "For Sellers",
                desc: "List your books, manage inventory with easy stock controls, and track your earnings with detailed analytics.",
                gradient: "from-primary/10 to-blue-400/10",
                icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
                delay: "0.1s",
              },
              {
                title: "For Customers",
                desc: "Browse, purchase, and return books easily with a generous 14-day return window and flexible rental options.",
                gradient: "from-success/10 to-emerald-400/10",
                icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
                delay: "0.2s",
              },
              {
                title: "For Moderators",
                desc: "Manage the platform, track returns, handle fines, and view comprehensive reports and analytics.",
                gradient: "from-warning/10 to-amber-400/10",
                icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                delay: "0.3s",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative card p-8 text-center animate-fade-in-up overflow-hidden"
                style={{ animationDelay: feature.delay }}
              >
                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${feature.gradient} blur-2xl transition-all duration-500 group-hover:scale-150`} />
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-white to-background shadow-lg shadow-primary/5 flex items-center justify-center ring-1 ring-border">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-secondary leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 bg-white/50">
        <div className="section-divider" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="text-secondary max-w-xl mx-auto">
              Get started in three simple steps.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: "01", title: "Create Account", desc: "Sign up as a seller, customer, or moderator. Each role gets a tailored experience.", icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
              { step: "02", title: "Browse & Discover", desc: "Explore our curated collection of books. Search by title, author, genre, or language.", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
              { step: "03", title: "Buy or Rent", desc: "Purchase your favorite books or rent them at affordable daily rates. Read anywhere, anytime.", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
            ].map((item) => (
              <div key={item.title} className="text-center animate-fade-in-up" style={{ animationDelay: `${0.1 + parseFloat(item.step) * 0.08}s` }}>
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                </div>
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider mb-3">{item.step}</span>
                <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-secondary leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      {!user && (
        <section className="py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="card p-12 sm:p-16 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br from-primary/10 to-blue-400/10 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-gradient-to-br from-success/10 to-emerald-400/10 blur-3xl" />
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  Ready to Get <span className="text-gradient">Started</span>?
                </h2>
                <p className="text-secondary text-lg mb-8 max-w-lg mx-auto">
                  Join thousands of readers and sellers on the most elegant digital book platform.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link href="/auth/register" className="btn btn-primary btn-lg">
                    Create Free Account
                  </Link>
                  <Link href="/auth/login" className="btn btn-outline btn-lg">
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
