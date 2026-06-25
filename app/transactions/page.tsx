"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, Transaction } from "@/lib/api";
import Modal from "@/app/components/Modal";

export default function CustomerTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<string | null>(null);
  const [modalMessage, setModalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [contactModal, setContactModal] = useState<{ bookId: string; bookTitle: string; message: string; sending: boolean } | null>(null);
  const [searchFilters, setSearchFilters] = useState({
  startDate: "",
  endDate: "",
  status: "all"
});

  useEffect(() => {
    if (user) {
      api.customer.getTransactions(user.id).then(setTransactions).finally(() => setLoading(false));
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
      
      <div className="flex justify-end mt-4">
        <button
            onClick={() => setSearchFilters({
            startDate: "",
            endDate: "",
            status: "all"
            })}
            className="btn btn-outline text-sm"
            >
          Clear Filters
        </button>
      </div>
    </div>
      
{filteredTransactions.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m0-0a7.031 7.031 0 10-9.869-9.869A7.031 7.031 0 0121 21z" />
          </svg>
          <h3 className="text-lg font-medium text-foreground mb-2">No matching transactions</h3>
          <p className="text-secondary">Try adjusting your search filters.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Book ID</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="font-mono text-sm">{transaction.book_id.slice(0, 8)}...</td>
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

      {/* Confirm Return Request Modal */}
      <Modal isOpen={!!confirmRequest} onClose={() => setConfirmRequest(null)} title="Request Return">
        <p className="text-secondary mb-2">Are you sure you want to request a return for this book?</p>
        <p className="text-sm text-muted mb-6">The seller will review and approve your return request. Late fees may apply if the book is overdue.</p>
        <div className="flex gap-3">
          <button onClick={() => setConfirmRequest(null)} className="btn btn-outline flex-1">Cancel</button>
          <button onClick={() => confirmRequest && handleRequestReturn(confirmRequest)} className="btn btn-primary flex-1">Request Return</button>
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
