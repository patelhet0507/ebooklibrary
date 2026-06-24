"use client";

import { useState, useEffect } from "react";
import { api, TopSeller, DashboardStats } from "@/lib/api";

export default function ModeratorReports() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.moderator.getDashboard(),
      api.moderator.getTopSellers(period)
    ]).then(([dashboardData, sellersData]) => {
      setStats(dashboardData);
      setTopSellers(sellersData);
    }).finally(() => setLoading(false));
  }, [period]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="spinner" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-secondary mt-1">Platform analytics and insights</p>
      </div>
      
      {stats && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="stat-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <p className="stat-label">Total Earnings</p>
            <p className="stat-value text-success">₹{stats.total_earnings.toFixed(2)}</p>
          </div>
          <div className="stat-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <p className="stat-label">Total Sales</p>
            <p className="stat-value">{stats.total_sales}</p>
          </div>
          <div className="stat-card animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <p className="stat-label">Pending Fines</p>
            <p className="stat-value text-warning">₹{stats.pending_fines.toFixed(2)}</p>
          </div>
          <div className="stat-card animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <p className="stat-label">Active Returns</p>
            <p className="stat-value text-primary">{stats.active_returns}</p>
          </div>
        </div>
      )}

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
          <div className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-foreground mb-2">No sales data</h3>
            <p className="text-secondary">No sales recorded for this period.</p>
          </div>
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
    </div>
  );
}
