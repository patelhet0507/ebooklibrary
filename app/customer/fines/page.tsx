"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, Fine } from "@/lib/api";
import Modal from "@/app/components/Modal";

export default function CustomerFines() {
  const { user } = useAuth();
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [confirmPay, setConfirmPay] = useState<string | null>(null);
  const [modalMessage, setModalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      api.customer.getFines(user.id).then(setFines).finally(() => setLoading(false));
    }
  }, [user]);

  const handlePay = async (fineId: string) => {
    if (!user) return;
    setConfirmPay(null);
    setPaying(fineId);
    try {
      await api.customer.payFine(user.id, fineId);
      setFines(fines.map(f => f.id === fineId ? { ...f, status: "PAID", paid_at: new Date().toISOString() } : f));
      setModalMessage({ type: "success", text: "Fine paid successfully!" });
    } catch (err) {
      setModalMessage({ type: "error", text: err instanceof Error ? err.message : "Payment failed" });
    } finally {
      setPaying(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="spinner" />
    </div>
  );

  const pendingFines = fines.filter(f => f.status === "PENDING");
  const totalPending = pendingFines.reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">My Fines</h1>
        <p className="text-secondary mt-1">View and pay your outstanding fines</p>
      </div>
      
      {pendingFines.length > 0 && (
        <div className="alert alert-warning mb-6 flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p>
            You have <strong>{pendingFines.length}</strong> pending fine(s) totaling <strong>₹{totalPending.toFixed(2)}</strong>
          </p>
        </div>
      )}

      {fines.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-success mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-foreground mb-2">All clear!</h3>
          <p className="text-secondary">You have no fines. Keep it up!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
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
                        onClick={() => setConfirmPay(fine.id)}
                        disabled={paying === fine.id}
                        className="btn btn-success text-sm"
                      >
                        {paying === fine.id ? (
                          <>
                            <span className="spinner" />
                            Paying...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Pay Now
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

      {/* Confirm Pay Modal */}
      <Modal isOpen={!!confirmPay} onClose={() => setConfirmPay(null)} title="Confirm Payment">
        <p className="text-secondary mb-6">Are you sure you want to pay this fine?</p>
        <div className="flex gap-3">
          <button onClick={() => setConfirmPay(null)} className="btn btn-outline flex-1">Cancel</button>
          <button onClick={() => confirmPay && handlePay(confirmPay)} className="btn btn-success flex-1">Pay Now</button>
        </div>
      </Modal>

      {/* Success/Error Modal */}
      <Modal isOpen={!!modalMessage} onClose={() => setModalMessage(null)} title={modalMessage?.type === "success" ? "Success" : "Error"}>
        <p className="text-secondary mb-6">{modalMessage?.text}</p>
        <button onClick={() => setModalMessage(null)} className="btn btn-primary w-full">OK</button>
      </Modal>
    </div>
  );
}
