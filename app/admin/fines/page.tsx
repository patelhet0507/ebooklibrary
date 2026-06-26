"use client";

import { useState, useEffect } from "react";
import { api, Fine, FineStatus } from "@/lib/api";
import Modal from "@/app/components/Modal";
import EmptyState from "@/app/components/EmptyState";

export default function ModeratorFines() {
  useEffect(() => { document.title = "Manage Fines | E-Book Library"; }, []);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FineStatus | "">("");
  const [waiving, setWaiving] = useState<string | null>(null);
  const [confirmWaive, setConfirmWaive] = useState<string | null>(null);
  const [modalMessage, setModalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchFines = async (status?: FineStatus) => {
    setLoading(true);
    const data = await api.moderator.getFines(status || undefined);
    setFines(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFines(statusFilter as FineStatus || undefined);
  }, [statusFilter]);

  const handleWaive = async (fineId: string) => {
    setConfirmWaive(null);
    setWaiving(fineId);
    try {
      await api.moderator.waiveFine(fineId);
      setFines(fines.map(f => f.id === fineId ? { ...f, status: "WAIVED" } : f));
    } catch (err) {
      setModalMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to waive fine" });
    } finally {
      setWaiving(null);
    }
  };

  const totalPending = fines.filter(f => f.status === "PENDING").reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = fines.filter(f => f.status === "PAID").reduce((sum, f) => sum + f.amount, 0);
  const totalWaived = fines.filter(f => f.status === "WAIVED").reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Manage Fines</h1>
        <p className="text-secondary mt-1">Track and manage customer fines</p>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="stat-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <p className="stat-label">Pending</p>
          <p className="stat-value text-warning">₹{totalPending.toFixed(2)}</p>
        </div>
        <div className="stat-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <p className="stat-label">Paid</p>
          <p className="stat-value text-success">₹{totalPaid.toFixed(2)}</p>
        </div>
        <div className="stat-card animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <p className="stat-label">Waived</p>
          <p className="stat-value text-secondary">₹{totalWaived.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setStatusFilter("")}
          className={`btn ${statusFilter === "" ? "btn-primary" : "btn-outline"}`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter("PENDING")}
          className={`btn ${statusFilter === "PENDING" ? "btn-primary" : "btn-outline"}`}
        >
          Pending
        </button>
        <button
          onClick={() => setStatusFilter("PAID")}
          className={`btn ${statusFilter === "PAID" ? "btn-success" : "btn-outline"}`}
        >
          Paid
        </button>
        <button
          onClick={() => setStatusFilter("WAIVED")}
          className={`btn ${statusFilter === "WAIVED" ? "btn-ghost" : "btn-outline"}`}
        >
          Waived
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="spinner" />
        </div>
      ) : fines.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16 mx-auto text-success mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="No fines found"
          description="No fines match your current filter."
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Days Late</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fines.map((fine) => (
                <tr key={fine.id}>
                  <td className="font-mono text-sm">{fine.user_id.slice(0, 8)}...</td>
                  <td>
                    <span className="badge badge-warning">{fine.days_late} days</span>
                  </td>
                  <td className="font-semibold text-danger">₹{fine.amount.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${
                      fine.status === "PENDING" ? "badge-warning" :
                      fine.status === "PAID" ? "badge-success" :
                      "badge-muted"
                    }`}>
                      {fine.status}
                    </span>
                  </td>
                  <td className="text-secondary">
                    {new Date(fine.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    {fine.status === "PENDING" && (
                      <button
                        onClick={() => setConfirmWaive(fine.id)}
                        disabled={waiving === fine.id}
                        className="btn btn-ghost text-sm text-purple-600"
                      >
                        {waiving === fine.id ? (
                          <>
                            <span className="spinner" />
                            Waiving...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Waive
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm Waive Modal */}
      <Modal isOpen={!!confirmWaive} onClose={() => setConfirmWaive(null)} title="Confirm Waive">
        <p className="text-secondary mb-6">Are you sure you want to waive this fine?</p>
        <div className="flex gap-3">
          <button onClick={() => setConfirmWaive(null)} className="btn btn-outline flex-1">Cancel</button>
          <button onClick={() => confirmWaive && handleWaive(confirmWaive)} className="btn btn-primary flex-1">Confirm Waive</button>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal isOpen={!!modalMessage} onClose={() => setModalMessage(null)} title="Error">
        <p className="text-secondary mb-6">{modalMessage?.text}</p>
        <button onClick={() => setModalMessage(null)} className="btn btn-primary w-full">OK</button>
      </Modal>
    </div>
  );
}
