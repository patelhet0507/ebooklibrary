"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, Transaction } from "@/lib/api";
import Link from "next/link";
import Modal from "@/app/components/Modal";
import EmptyState from "@/app/components/EmptyState";
import { useToast } from "@/app/components/Toast";

const ITEMS_PER_PAGE = 10;

export default function CustomerTransactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  useEffect(() => { document.title = "My Purchases | E-Book Library"; }, []);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [refunding, setRefunding] = useState<string | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<string | null>(null);
  const [confirmRefund, setConfirmRefund] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [modalMessage, setModalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [contactModal, setContactModal] = useState<{ bookId: string; bookTitle: string; message: string; sending: boolean } | null>(null);
  const [searchFilters, setSearchFilters] = useState({
  startDate: "",
  endDate: "",
  status: "all"
});
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (user) {
      api.customer.getTransactions(user.id).then(data => { setTransactions(data.transactions); setPage(1); }).finally(() => setLoading(false));
    }
  }, [user]);

  const filteredTransactions = transactions.filter(t => {
    // Date range filter
    if (searchFilters.startDate) {
      const transactionDate = new Date(t.created_at);
      const startDate = new Date(searchFilters.startDate);
      if (transactionDate < startDate) {
        return false;
      }
    }
    
    if (searchFilters.endDate) {
      const transactionDate = new Date(t.created_at);
      const endDate = new Date(searchFilters.endDate);
      endDate.setHours(23, 59, 59, 999); // Include the entire end date
      if (transactionDate > endDate) {
        return false;
      }
    }
    
    // Status filter
    if (searchFilters.status !== "all") {
      if (searchFilters.status === "return_requested") {
        if (!t.return_requested_at) {
          return false;
        }
      } else if (searchFilters.status === "returned") {
        if (!t.returned_at) {
          return false;
        }
      } else if (searchFilters.status === "overdue") {
        if (t.type !== "RENT" || !t.due_date || new Date(t.due_date) >= new Date()) {
          return false;
        }
      } else {
        if (t.type !== searchFilters.status) {
          return false;
        }
      }
    }
    
    return true;
  });

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedData = filteredTransactions.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleExportCSV = () => {
    const headers = ["Transaction ID", "Book ID", "Type", "Quantity", "Amount", "Due Date", "Status", "Created At"];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.book_id,
      t.type,
      t.quantity.toString(),
      t.total_amount.toFixed(2),
      t.due_date ? new Date(t.due_date).toLocaleDateString() : "",
      t.returned_at ? "Returned" : t.return_requested_at ? "Return Requested" : t.type === "RENT" && t.due_date && new Date(t.due_date) < new Date() ? "Overdue" : t.type === "RENT" ? "Active Rent" : "Active",
      new Date(t.created_at).toLocaleDateString(),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRequestRefund = async (transactionId: string) => {
    if (!user) return;
    setConfirmRefund(null);
    setRefunding(transactionId);
    try {
      const res = await fetch(`/api/customer/${user.id}/refund/${transactionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: refundReason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Refund failed");
      }
      toast("success", "Refund requested! The seller will review your request.");
      setRefundReason("");
      const data = await api.customer.getTransactions(user.id);
      setTransactions(data.transactions);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Refund failed");
    }
    setRefunding(null);
  };

  const handleRequestReturn = async (transactionId: string) => {
    if (!user) return;
    setConfirmRequest(null);
    setRequesting(transactionId);
    try {
      const updated = await api.customer.returnBook(user.id, transactionId);
      setTransactions(transactions.map(t => t.id === transactionId ? updated : t));
      setModalMessage({ type: "success", text: "Return requested! The seller will review your request." });
    } catch (err) {
      setModalMessage({ type: "error", text: err instanceof Error ? err.message : "Request failed" });
    } finally {
      setRequesting(null);
    }
  };

  const openContactModal = async (bookId: string) => {
    try {
      const book = await api.books.get(bookId);
      setContactModal({ bookId, bookTitle: book.title, message: "", sending: false });
    } catch {
      setModalMessage({ type: "error", text: "Could not load book details" });
    }
  };

  const handleSendContact = async () => {
    if (!user || !contactModal || !contactModal.message.trim()) return;
    setContactModal({ ...contactModal, sending: true });
    try {
      const address = [user.address, user.city, user.state, user.pincode].filter(Boolean).join(", ");
      await api.books.contactSeller(contactModal.bookId, {
        message: contactModal.message,
        customer_name: user.name,
        customer_phone: user.phone,
        customer_address: address || undefined,
      });
      setContactModal(null);
      setModalMessage({ type: "success", text: "Your message has been sent to the seller!" });
    } catch (err) {
      setModalMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to send message" });
      setContactModal({ ...contactModal, sending: false });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="spinner" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-foreground">My Purchases</h1>
      <p className="text-secondary mt-1">View and manage your book purchases</p>
    </div>

    {/* Search Filters */}
    <div className="card p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">      <div>
          <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
          <input
            type="date"
            value={searchFilters.startDate}
            onChange={(e) => setSearchFilters(prev => ({ ...prev, startDate: e.target.value }))}
            className="input w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
          <input
            type="date"
            value={searchFilters.endDate}
            onChange={(e) => setSearchFilters(prev => ({ ...prev, endDate: e.target.value }))}
            className="input w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Status</label>
          <select
            value={searchFilters.status}
            onChange={(e) => setSearchFilters(prev => ({ ...prev, status: e.target.value }))}
            className="input w-full"
          >
            <option value="all">All Statuses</option>
            <option value="PURCHASE">Purchase</option>
            <option value="RENT">Rent</option>
            <option value="RETURN">Returned</option>
            <option value="return_requested">Return Requested</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end mt-4 gap-2">
        <button onClick={handleExportCSV} className="btn btn-outline text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
        <button onClick={() => setSearchFilters({ startDate: "", endDate: "", status: "all" })} className="btn btn-outline text-sm">
          Clear Filters
        </button>
      </div>
    </div>
      
{filteredTransactions.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16 mx-auto text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          title="No matching transactions"
          description="Try adjusting your search filters."
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="font-medium">{transaction.book_title || transaction.book_id.slice(0, 8)}...</td>
                  <td>
                    <span className={`badge ${transaction.type === "PURCHASE" ? "badge-primary" : transaction.type === "RENT" ? "badge-info" : "badge-success"}`}>
                      {transaction.type === "RENT" ? `RENT (${transaction.rental_days}d)` : transaction.type}
                    </span>
                  </td>
                  <td>{transaction.quantity}</td>
                  <td className="font-semibold">₹{transaction.total_amount.toFixed(2)}</td>
                  <td>
                    {transaction.due_date ? new Date(transaction.due_date).toLocaleDateString() : "-"}
                  </td>
                  <td>
                    {transaction.returned_at ? (
                      <span className="badge badge-success">Returned</span>
                    ) : transaction.return_requested_at ? (
                      <span className="badge badge-warning">Return Requested</span>
                    ) : transaction.type === "RENT" && transaction.due_date && new Date(transaction.due_date) < new Date() ? (
                      <span className="badge badge-danger">Overdue!</span>
                    ) : transaction.type === "RENT" ? (
                      <span className="badge badge-warning">Due {new Date(transaction.due_date!).toLocaleDateString()}</span>
                    ) : transaction.type === "PURCHASE" ? (
                      <span className="badge badge-warning">Active</span>
                    ) : (
                      <span className="badge badge-muted">-</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {transaction.type === "RENT" && !transaction.returned_at && !transaction.return_requested_at && (
                        <button
                          onClick={() => setConfirmRequest(transaction.id)}
                          disabled={requesting === transaction.id}
                          className="btn btn-ghost text-sm text-primary"
                        >
                          {requesting === transaction.id ? (
                            <>
                              <span className="spinner" />
                              Requesting...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              Request Return
                            </>
                          )}
                        </button>
                      )}
                      {(transaction.type === "PURCHASE" || (transaction.type === "RENT" && !transaction.returned_at)) && (
                        <Link href={`/read/${transaction.book_id}`} className="btn btn-ghost text-sm text-success">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Read
                        </Link>
                      )}
                      {transaction.type === "PURCHASE" && !transaction.returned_at && (
                        <button
                          onClick={() => setConfirmRefund(transaction.id)}
                          disabled={refunding === transaction.id}
                          className="btn btn-ghost text-sm text-warning"
                        >
                          {refunding === transaction.id ? "..." : "Refund"}
                        </button>
                      )}
                      {transaction.payment_id && (
                        <a href={`/payment/invoice?paymentId=${transaction.payment_id}`} className="btn btn-ghost text-sm text-secondary">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Invoice
                        </a>
                      )}
                      <button onClick={() => openContactModal(transaction.book_id)} className="btn btn-ghost text-sm text-secondary">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Contact
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-sm text-secondary">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-outline btn-sm"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-outline btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Confirm Return Request Modal */}
      <Modal isOpen={!!confirmRequest} onClose={() => setConfirmRequest(null)} title="Request Return">
        <p className="text-secondary mb-2">Are you sure you want to request a return for this book?</p>
        <p className="text-sm text-muted mb-6">The seller will review and approve your return request. Late fees may apply if the book is overdue.</p>
        <div className="flex gap-3">
          <button onClick={() => setConfirmRequest(null)} className="btn btn-outline flex-1">Cancel</button>
          <button onClick={() => confirmRequest && handleRequestReturn(confirmRequest)} className="btn btn-primary flex-1">Request Return</button>
        </div>
      </Modal>

      {/* Confirm Refund Modal */}
      <Modal isOpen={!!confirmRefund} onClose={() => { setConfirmRefund(null); setRefundReason(""); }} title="Request Refund">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-warning/10 rounded-lg border border-warning/20">
            <svg className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold text-foreground mb-1">Refund Policy</p>
              <p className="text-sm text-secondary">Refunds can only be requested within 7 days of purchase. The seller will review your request before processing.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Why are you requesting a refund?</label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Tell the seller why you want a refund..."
              className="input min-h-[100px] w-full resize-none"
              rows={4}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setConfirmRefund(null); setRefundReason(""); }} className="btn btn-outline flex-1">Cancel</button>
            <button
              onClick={() => confirmRefund && handleRequestRefund(confirmRefund)}
              disabled={!refundReason.trim() || refunding === confirmRefund}
              className="btn btn-warning flex-1"
            >
              {refunding === confirmRefund ? "Requesting..." : "Request Refund"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Contact Seller Modal */}
      <Modal isOpen={!!contactModal} onClose={() => setContactModal(null)} title={`Contact Seller - ${contactModal?.bookTitle || ""}`}>
        {contactModal && (
          <div className="space-y-4">
            <p className="text-sm text-secondary">
              Send a message to the seller about <strong>{contactModal.bookTitle}</strong>.
              Your name, phone, and address will be shared with the seller.
            </p>
            <textarea
              value={contactModal.message}
              onChange={(e) => setContactModal({ ...contactModal, message: e.target.value })}
              placeholder="Type your message here..."
              className="input min-h-[120px] w-full resize-none"
              rows={5}
            />
            <div className="flex gap-3">
              <button onClick={() => setContactModal(null)} className="btn btn-outline flex-1">Cancel</button>
              <button
                onClick={handleSendContact}
                disabled={!contactModal.message.trim() || contactModal.sending}
                className="btn btn-primary flex-1"
              >
                {contactModal.sending ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Success/Error Modal */}
      <Modal isOpen={!!modalMessage} onClose={() => setModalMessage(null)} title={modalMessage?.type === "success" ? "Success" : "Error"}>
        <p className="text-secondary mb-6">{modalMessage?.text}</p>
        <button onClick={() => setModalMessage(null)} className="btn btn-primary w-full">OK</button>
      </Modal>
    </div>
  );
}
