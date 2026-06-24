"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ReturnRequest } from "@/lib/api";
import Modal from "@/app/components/Modal";

export default function SellerReturns() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [confirmApprove, setConfirmApprove] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      api.seller.getReturnRequests(user.id).then(setRequests).finally(() => setLoading(false));
    }
  }, [user]);

  const handleApprove = async (transactionId: string) => {
    if (!user) return;
    setConfirmApprove(null);
    setApproving(transactionId);
    try {
      await api.seller.approveReturn(user.id, transactionId);
      setRequests(requests.filter(r => r.id !== transactionId));
      setModalMessage({ type: "success", text: "Return approved!" });
    } catch (err) {
      setModalMessage({ type: "error", text: err instanceof Error ? err.message : "Approval failed" });
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async () => {
    if (!user || !rejectTarget || !rejectReason.trim()) return;
    setRejecting(true);
    try {
      await api.seller.rejectReturn(user.id, rejectTarget, rejectReason);
      setRequests(requests.filter(r => r.id !== rejectTarget));
      setRejectTarget(null);
      setRejectReason("");
      setModalMessage({ type: "success", text: "Return rejected. Customer has been notified via email." });
    } catch (err) {
      setModalMessage({ type: "error", text: err instanceof Error ? err.message : "Rejection failed" });
    } finally {
      setRejecting(false);
    }
  };

  const openRejectModal = (id: string) => {
    setRejectTarget(id);
    setRejectReason("");
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="spinner" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Return Requests</h1>
        <p className="text-secondary mt-1">Review and approve or reject customer return requests</p>
      </div>

      {requests.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <h3 className="text-lg font-medium text-foreground mb-2">No pending returns</h3>
          <p className="text-secondary">No customers have requested returns yet.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Customer</th>
                <th>Days</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td className="font-medium">{req.book_title}</td>
                  <td>{req.customer_name}</td>
                  <td>{req.rental_days}</td>
                  <td className="font-semibold">₹{req.total_amount.toFixed(2)}</td>
                  <td>
                    {req.due_date && new Date(req.due_date) < new Date() ? (
                      <span className="badge badge-danger">{new Date(req.due_date).toLocaleDateString()}</span>
                    ) : req.due_date ? (
                      <span className="badge badge-warning">{new Date(req.due_date).toLocaleDateString()}</span>
                    ) : "-"}
                  </td>
                  <td className="text-sm">{req.return_requested_at ? new Date(req.return_requested_at).toLocaleDateString() : "-"}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmApprove(req.id)}
                        disabled={approving === req.id}
                        className="btn btn-primary text-sm"
                      >
                        {approving === req.id ? "Approving..." : "Approve"}
                      </button>
                      <button
                        onClick={() => openRejectModal(req.id)}
                        disabled={approving === req.id}
                        className="btn btn-outline text-sm text-danger border-danger"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm Approve Modal */}
      <Modal isOpen={!!confirmApprove} onClose={() => setConfirmApprove(null)} title="Approve Return">
        <p className="text-secondary mb-6">Approve this return? The book will be added back to stock and late fees will be calculated if overdue.</p>
        <div className="flex gap-3">
          <button onClick={() => setConfirmApprove(null)} className="btn btn-outline flex-1">Cancel</button>
          <button onClick={() => confirmApprove && handleApprove(confirmApprove)} className="btn btn-primary flex-1">Approve Return</button>
        </div>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal isOpen={!!rejectTarget} onClose={() => { setRejectTarget(null); setRejectReason(""); }} title="Reject Return">
        <div className="space-y-4">
          <p className="text-secondary">Provide a reason for rejecting this return. The customer will be notified via email.</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="input min-h-[100px] w-full"
            rows={4}
          />
          <div className="flex gap-3">
            <button onClick={() => { setRejectTarget(null); setRejectReason(""); }} className="btn btn-outline flex-1">Cancel</button>
            <button
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejecting}
              className="btn btn-danger flex-1"
            >
              {rejecting ? "Rejecting..." : "Reject Return"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Message Modal */}
      <Modal isOpen={!!modalMessage} onClose={() => setModalMessage(null)} title={modalMessage?.type === "success" ? "Success" : "Error"}>
        <p className="text-secondary mb-6">{modalMessage?.text}</p>
        <button onClick={() => setModalMessage(null)} className="btn btn-primary w-full">OK</button>
      </Modal>
    </div>
  );
}
