"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ReturnRequest } from "@/lib/api";
import Modal from "@/app/components/Modal";
import EmptyState from "@/app/components/EmptyState";

export default function SellerReturns() {
  const { user } = useAuth();
  useEffect(() => { document.title = "Return & Refund Requests | E-Book Library"; }, []);
  const [rentRequests, setRentRequests] = useState<ReturnRequest[]>([]);
  const [refundRequests, setRefundRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [confirmApprove, setConfirmApprove] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"returns" | "refunds">("returns");

  useEffect(() => {
    if (user) {
      Promise.all([
        api.seller.getReturnRequests(user.id),
        api.seller.getRefundRequests(user.id),
      ]).then(([rents, refunds]) => {
        setRentRequests(rents);
        setRefundRequests(refunds);
      }).finally(() => setLoading(false));
    }
  }, [user]);

  const handleApproveRent = async (transactionId: string) => {
    if (!user) return;
    setConfirmApprove(null);
    setApproving(transactionId);
    try {
      await api.seller.approveReturn(user.id, transactionId);
      setRentRequests(rentRequests.filter(r => r.id !== transactionId));
      setModalMessage({ type: "success", text: "Return approved!" });
    } catch (err) {
      setModalMessage({ type: "error", text: err instanceof Error ? err.message : "Approval failed" });
    } finally {
      setApproving(null);
    }
  };

  const handleRejectRent = async () => {
    if (!user || !rejectTarget || !rejectReason.trim()) return;
    setRejecting(true);
    try {
      await api.seller.rejectReturn(user.id, rejectTarget, rejectReason);
      setRentRequests(rentRequests.filter(r => r.id !== rejectTarget));
      setRejectTarget(null);
      setRejectReason("");
      setModalMessage({ type: "success", text: "Return rejected. Customer has been notified." });
    } catch (err) {
      setModalMessage({ type: "error", text: err instanceof Error ? err.message : "Rejection failed" });
    } finally {
      setRejecting(false);
    }
  };

  const handleApproveRefund = async (transactionId: string) => {
    if (!user) return;
    setConfirmApprove(null);
    setApproving(transactionId);
    try {
      await api.seller.approveRefund(user.id, transactionId);
      setRefundRequests(refundRequests.filter(r => r.id !== transactionId));
      setModalMessage({ type: "success", text: "Refund approved! Customer has been notified." });
    } catch (err) {
      setModalMessage({ type: "error", text: err instanceof Error ? err.message : "Approval failed" });
    } finally {
      setApproving(null);
    }
  };

  const handleRejectRefund = async () => {
    if (!user || !rejectTarget || !rejectReason.trim()) return;
    setRejecting(true);
    try {
      await api.seller.rejectRefund(user.id, rejectTarget, rejectReason);
      setRefundRequests(refundRequests.filter(r => r.id !== rejectTarget));
      setRejectTarget(null);
      setRejectReason("");
      setModalMessage({ type: "success", text: "Refund rejected. Customer has been notified." });
    } catch (err) {
      setModalMessage({ type: "error", text: err instanceof Error ? err.message : "Rejection failed" });
    } finally {
      setRejecting(false);
    }
  };

  const openRejectModal = (id: string, type: "return" | "refund") => {
    setRejectTarget(id + ":" + type);
    setRejectReason("");
  };

  const handleReject = () => {
    if (!rejectTarget) return;
    const [id, type] = rejectTarget.split(":");
    if (type === "refund") {
      handleRejectRefund();
    } else {
      handleRejectRent();
    }
  };

  const handleApprove = () => {
    if (!confirmApprove) return;
    if (refundRequests.some(r => r.id === confirmApprove)) {
      handleApproveRefund(confirmApprove);
    } else {
      handleApproveRent(confirmApprove);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="spinner" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Return & Refund Requests</h1>
        <p className="text-secondary mt-1">Review and approve or reject customer requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("returns")}
          className={`btn btn-sm ${activeTab === "returns" ? "btn-primary" : "btn-outline"}`}
        >
          Rent Returns
          {rentRequests.length > 0 && <span className="ml-2 badge badge-danger text-xs">{rentRequests.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab("refunds")}
          className={`btn btn-sm ${activeTab === "refunds" ? "btn-primary" : "btn-outline"}`}
        >
          Purchase Refunds
          {refundRequests.length > 0 && <span className="ml-2 badge badge-danger text-xs">{refundRequests.length}</span>}
        </button>
      </div>

      {/* Rent Returns Tab */}
      {activeTab === "returns" && (
        <>
          {rentRequests.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-16 h-16 mx-auto text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
              title="No pending returns"
              description="No customers have requested returns yet."
            />
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
                  {rentRequests.map((req) => (
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
                            onClick={() => openRejectModal(req.id, "return")}
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
        </>
      )}

      {/* Purchase Refunds Tab */}
      {activeTab === "refunds" && (
        <>
          {refundRequests.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-16 h-16 mx-auto text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="No pending refunds"
              description="No customers have requested refunds yet."
            />
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Reason</th>
                    <th>Requested</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {refundRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="font-medium">{req.book_title}</td>
                      <td>{req.customer_name}</td>
                      <td className="font-semibold">₹{req.total_amount.toFixed(2)}</td>
                      <td className="text-sm text-secondary max-w-[200px] truncate" title={req.refund_reason}>{req.refund_reason || "-"}</td>
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
                            onClick={() => openRejectModal(req.id, "refund")}
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
        </>
      )}

      {/* Confirm Approve Modal */}
      <Modal isOpen={!!confirmApprove} onClose={() => setConfirmApprove(null)} title="Approve Request">
        <p className="text-secondary mb-6">
          {confirmApprove && refundRequests.some(r => r.id === confirmApprove)
            ? "Approve this refund? The purchase amount will be credited back and the book will be added back to inventory."
            : "Approve this return? The book will be added back to stock and late fees will be calculated if overdue."}
        </p>
        <div className="flex gap-3">
          <button onClick={() => setConfirmApprove(null)} className="btn btn-outline flex-1">Cancel</button>
          <button onClick={handleApprove} className="btn btn-primary flex-1">Approve</button>
        </div>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal isOpen={!!rejectTarget} onClose={() => { setRejectTarget(null); setRejectReason(""); }} title="Reject Request">
        <div className="space-y-4">
          <p className="text-secondary">
            {rejectTarget?.endsWith(":refund")
              ? "Provide a reason for rejecting this refund. The customer will receive an in-app notification."
              : "Provide a reason for rejecting this return. The customer will be notified via email."}
          </p>
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
              {rejecting ? "Rejecting..." : "Reject"}
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
