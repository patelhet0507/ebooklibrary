"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import CustomerDashboard from "@/app/components/dashboards/CustomerDashboard";
import SellerDashboard from "@/app/components/dashboards/SellerDashboard";
import ModeratorDashboard from "@/app/components/dashboards/ModeratorDashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  useEffect(() => { document.title = "Dashboard | E-Book Library"; }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="spinner" />
      </div>
    );
  }

  switch (user.role) {
    case "SELLER":
      return <SellerDashboard />;
    case "MODERATOR":
      return <ModeratorDashboard />;
    default:
      return <CustomerDashboard />;
  }
}
