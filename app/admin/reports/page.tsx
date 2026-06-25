"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function ModeratorAnalytics() {
  const { user } = useAuth();
  const router = useRouter();
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">("month");
  const [data, setData] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === "MODERATOR") {
      fetchData();
    } else if (user) {
      router.push("/");
    } else {
      router.push("/auth/login");
    }
  }, [user, router, period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsData, dashData, sellersData] = await Promise.all([
        api.moderator.analytics.get(period).catch(() => null),
        api.moderator.getDashboard().catch(() => null),
        api.moderator.getTopSellers(period).catch(() => [])
      ]);
      
      if (analyticsData) setData(analyticsData);
      if (dashData) setDashboard(dashData);
      setTopSellers(sellersData);
    } catch (error) {
      console.error("Failed to fetch analytics", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "MODERATOR") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-secondary mt-1">Platform performance and revenue metrics</p>
        </div>
        
        <div className="flex bg-background border border-border rounded-lg p-1">
          {(["day", "week", "month", "year"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                period === p ? 'bg-primary text-white shadow-sm' : 'text-secondary hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {p === "day" ? "Today" : p === "week" ? "This Week" : p === "month" ? "This Month" : "This Year"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="spinner" />
        </div>
      ) : !data ? (
        <div className="card p-12 text-center text-danger">Failed to load analytics data.</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="stat-card relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <svg className="w-12 h-12 text-success" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" /><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" /></svg>
              </div>
              <p className="stat-label">Total Revenue</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-foreground">₹{(data.revenue || 0).toLocaleString()}</p>
                {data.revenueChange !== undefined && (
                  <span className={`text-xs font-bold ${data.revenueChange >= 0 ? 'text-success' : 'text-danger'}`}>
                    {data.revenueChange > 0 ? '↑' : data.revenueChange < 0 ? '↓' : ''}
                    {Math.abs(data.revenueChange * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            
            <div className="stat-card">
              <p className="stat-label">Total Orders</p>
              <p className="text-2xl font-bold text-foreground mt-1">{data.totalOrders || 0}</p>
            </div>
            
            <div className="stat-card">
              <p className="stat-label">Avg Order Value</p>
              <p className="text-2xl font-bold text-foreground mt-1">₹{(data.avgOrderValue || 0).toFixed(2)}</p>
            </div>
            
            <div className="stat-card">
              <p className="stat-label">New Users</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-bold text-foreground">{data.newUsers || 0}</p>
                <span className="text-xs text-secondary">of {data.totalUsers || 0} total</span>
              </div>
            </div>
            
            <div className="stat-card">
              <p className="stat-label">Total Books</p>
              <p className="text-2xl font-bold text-foreground mt-1">{data.totalBooks || 0}</p>
            </div>
          </div>

          {/* Revenue Chart */}
          {data.userGrowth && data.userGrowth.length > 0 && (
            <div className="card p-6 mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-6">User Growth</h3>
              <div className="w-full overflow-x-auto">
                <svg viewBox="0 0 600 200" className="w-full min-w-[500px] h-48">
                  {data.userGrowth.map((point: any, i: number) => {
                    const maxCount = Math.max(...data.userGrowth.map((p: any) => p.count), 1);
                    const barHeight = (point.count / maxCount) * 140;
                    const barWidth = 40;
                    const spacing = 600 / data.userGrowth.length;
                    const x = i * spacing + (spacing - barWidth) / 2;
                    const y = 160 - barHeight;
                    
                    return (
                      <g key={point.date} className="group">
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          className="fill-primary/80 group-hover:fill-primary transition-colors cursor-pointer"
                          rx="4"
                        />
                        <text x={x + barWidth/2} y={y - 8} textAnchor="middle" className="text-xs fill-foreground font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                          {point.count}
                        </text>
                        <text x={x + barWidth/2} y="180" textAnchor="middle" className="text-xs fill-secondary">
                          {new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </text>
                      </g>
                    );
                  })}
                  {/* Baseline */}
                  <line x1="0" y1="160" x2="600" y2="160" className="stroke-border" strokeWidth="1" />
                </svg>
              </div>
            </div>
          )}

          {/* Tables */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div className="card p-0 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-border bg-muted/20">
                <h3 className="text-lg font-semibold text-foreground">Top Selling Books</h3>
              </div>
              <div className="p-0 table-container flex-1">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="w-12 text-center">Rank</th>
                      <th>Book</th>
                      <th className="text-right">Revenue</th>
                      <th className="text-right">Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.topSellingBooks || []).slice(0, 5).map((book: any, idx: number) => (
                      <tr key={book.id}>
                        <td className="text-center font-bold">
                          {idx === 0 ? <span className="text-yellow-500 text-lg">🥇</span> : 
                           idx === 1 ? <span className="text-gray-400 text-lg">🥈</span> : 
                           idx === 2 ? <span className="text-amber-600 text-lg">🥉</span> : 
                           <span className="text-secondary">{idx + 1}</span>}
                        </td>
                        <td>
                          <div className="font-medium text-foreground line-clamp-1">{book.title}</div>
                          <div className="text-xs text-secondary">{book.author}</div>
                        </td>
                        <td className="text-right font-semibold text-success">₹{(book.revenue || 0).toLocaleString()}</td>
                        <td className="text-right text-secondary">{book.quantity || 0}</td>
                      </tr>
                    ))}
                    {(!data.topSellingBooks || data.topSellingBooks.length === 0) && (
                      <tr><td colSpan={4} className="text-center py-6 text-secondary">No sales data for this period</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card p-0 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-border bg-muted/20">
                <h3 className="text-lg font-semibold text-foreground">Top Sellers</h3>
              </div>
              <div className="p-0 table-container flex-1">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="w-12 text-center">Rank</th>
                      <th>Seller</th>
                      <th className="text-right">Revenue</th>
                      <th className="text-right">Books Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSellers.slice(0, 5).map((seller: any, idx: number) => (
                      <tr key={seller.seller_id}>
                        <td className="text-center font-bold text-secondary">{idx + 1}</td>
                        <td className="font-medium text-foreground">{seller.seller_name}</td>
                        <td className="text-right font-semibold text-success">₹{(seller.total_sales || 0).toLocaleString()}</td>
                        <td className="text-right text-secondary">{seller.books_sold || 0}</td>
                      </tr>
                    ))}
                    {topSellers.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-6 text-secondary">No seller data for this period</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          {dashboard && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="card p-6 flex items-center justify-between border-l-4 border-l-warning">
                <div>
                  <p className="text-sm text-secondary font-medium uppercase tracking-wider">Pending Fines</p>
                  <p className="text-xl font-bold text-warning mt-1">₹{(dashboard.pendingFines || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-warning/10 rounded-full text-warning">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
              <div className="card p-6 flex items-center justify-between border-l-4 border-l-info">
                <div>
                  <p className="text-sm text-secondary font-medium uppercase tracking-wider">Active Returns</p>
                  <p className="text-xl font-bold text-info mt-1">{dashboard.activeReturns || 0}</p>
                </div>
                <div className="p-3 bg-info/10 rounded-full text-info">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" /></svg>
                </div>
              </div>
              <div className="card p-6 flex items-center justify-between border-l-4 border-l-primary">
                <div>
                  <p className="text-sm text-secondary font-medium uppercase tracking-wider">Total Commission</p>
                  <p className="text-xl font-bold text-primary mt-1">₹{((data.revenue || 0) * 0.1).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
