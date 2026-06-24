"use client";

import { useState, useEffect } from "react";
import { api, ReturnRequest } from "@/lib/api";
import Modal from "@/app/components/Modal";

export default function ModeratorReturns() {
  const [pendingReturns, setPendingReturns] = useState<ReturnRequest[]>([]);
  const [completedReturns, setCompletedReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [approving, setApproving] = useState<string | null>(null);
  const [confirmApprove, setConfirmApprove] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      api.moderator.getPendingReturns(),
      api.moderator.getCompletedReturns()
    ]).then(([pending, completed]) => {
      setPendingReturns(pending);
      setCompletedReturns(completed);
    }).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (transactionId: string) => {
    setConfirmApprove(null);
    setApproving(transactionId);
    try {
      await api.moderator.approveReturn(transactionId);
      setPendingReturns(pendingReturns.filter(r => r.id !== transactionId));
      setModalMessage({ type: "success", text: "Return approved!" });
    } catch (err) {
      setModalMessage({ type: "error", text: err instanceof Error ? err.message : "Approval failed" });
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setRejecting(true);
    try {
      await api.moderator.rejectReturn(rejectTarget, rejectReason);
      setPendingReturns(pendingReturns.filter(r => r.id !== rejectTarget));
      setRejectTarget(null);
      setRejectReason("");
      setModalMessage({ type: "success", text: "Return rejected. Customer has been notified via email." });
    } catch (err) {
      setModalMessage({ type: "error", text: err instanceof Error ? err.message : "Rejection failed" });
    } finally {
      setRejecting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="spinner" />
    </div>
  );

  const currentReturns = activeTab === "pending" ? pendingReturns : completedReturns;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Book Returns</h1>
        <p className="text-secondary mt-1">Review and approve or reject return requests</p>
      </div>

      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setActiveTab("pending")}
          className={`btn ${activeTab === "pending" ? "btn-primary" : "btn-outline"}`}
        >
          Pending ({pendingReturns.length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`btn ${activeTab === "completed" ? "btn-success" : "btn-outline"}`}
        >
          Completed ({completedReturns.length})
        </button>
      </div>

      {currentReturns.length === 0 ? (
        <div className="card p-12 text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">
            No {activeTab} returns
          </h3>
          <p className="text-secondary">
            {activeTab === "pending" ? "No return requests pending." : "No completed returns yet."}
          </p>
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
                <th>{activeTab === "pending" ? "Requested" : "Returned At"}</th>
                {activeTab === "pending" && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {currentReturns.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.book_title}</td>
                  <td>{r.customer_name}</td>
                  <td>{r.rental_days}</td>
                  <td className="font-semibold">₹{r.total_amount.toFixed(2)}</td>
                  <td>
                    {r.due_date && new Date(r.due_date) < new Date() ? (
                      <span className="badge badge-danger">{new Date(r.due_date).toLocaleDateString()}</span>
                    ) : r.due_date ? (
                      <span className="badge badge-warning">{new Date(r.due_date).toLocaleDateString()}</span>
                    ) : "-"}
                  </td>
                  <td className="text-sm">
                    {activeTab === "pending" && r.return_requested_at
                      ? new Date(r.return_requested_at).toLocaleDateString()
                      : r.returned_at
                        ? new Date(r.returned_at).toLocaleDateString()
                        : "-"}
                  </td>
                  {activeTab === "pending" && (
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmApprove(r.id)}
                          disabled={approving === r.id}
                          className="btn btn-primary text-sm"
                        >
                          {approving === r.id ? "Approving..." : "Approve"}
                        </button>
                        <button
                          onClick={() => { setRejectTarget(r.id); setRejectReason(""); }}
                          className="btn btn-outline text-sm text-danger border-danger"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  )}
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
