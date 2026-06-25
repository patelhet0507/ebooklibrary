"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, Transaction, Book, PaymentMethod, PaymentCreate } from "@/lib/api";
import Modal from "@/app/components/Modal";

export const dynamic = "force-dynamic";

function PaymentPageContent() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("transactionId");
  const paidInSession = useRef(false);
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const [formData, setFormData] = useState({
    upi_id: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    delivery_name: user?.name || "",
    delivery_phone: user?.phone || "",
    delivery_address: user?.address || "",
  });
  const [modalMessage, setModalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [successPaymentId, setSuccessPaymentId] = useState<string | null>(null);

  useEffect(() => {
    if (transactionId && user && !paidInSession.current) {
      api.customer.getTransactions(user.id).then(transactions => {
        const t = transactions.find(tr => tr.id === transactionId);
        if (t) {
          setTransaction(t);
          api.payments.getUserPayments(user.id).then(payments => {
            if (payments.some(p => p.transaction_id === transactionId) && !paidInSession.current) {
              router.push("/transactions");
              return;
            }
          });
          api.books.get(t.book_id).then(setBook).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      }).catch(() => setLoading(false));
    }
  }, [transactionId, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction || !user) return;
    
    setProcessing(true);
    try {
      const paymentData: PaymentCreate = {
        transaction_id: transaction.id,
        method,
        ...(method === "UPI" && { upi_id: formData.upi_id }),
        ...(method === "BANK" && {
          bank_name: formData.bank_name,
          account_number: formData.account_number,
          ifsc_code: formData.ifsc_code,
        }),
        ...(method === "COD" && {
          delivery_name: formData.delivery_name,
          delivery_phone: formData.delivery_phone,
          delivery_address: formData.delivery_address,
        }),
      };
      
      const payment = await api.payments.create(paymentData);
      paidInSession.current = true;
      if (method !== "COD") {
        api.profile.get(user.id).then(setUser);
      }
      setSuccessPaymentId(payment.id);
      setModalMessage({ type: "success", text: "Payment successful!" });
    } catch (err) {
      setModalMessage({ type: "error", text: err instanceof Error ? err.message : "Payment failed" });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="spinner" />
    </div>
  );

  if (!transaction || !book) return (
    <div className="text-center py-12">
      <p className="text-secondary">Transaction not found</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
        <p className="text-secondary mt-1">Complete your purchase</p>
      </div>

      <div className="card p-6 mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Order Summary</h2>
        <div className="flex gap-4 p-4 bg-background rounded-lg">
          <div className="flex-1">
            <h3 className="font-medium text-foreground">{book.title}</h3>
            <p className="text-sm text-secondary">{book.author}</p>
            <p className="text-sm text-secondary">Qty: {transaction.quantity}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-success">₹{transaction.total_amount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="card p-6 mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Payment Method</h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setMethod("UPI")}
            className={`p-4 rounded-lg border-2 text-center transition-all ${
              method === "UPI"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <svg className={`w-8 h-8 mx-auto mb-2 ${method === "UPI" ? "text-primary" : "text-secondary"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className={`text-sm font-medium ${method === "UPI" ? "text-primary" : "text-secondary"}`}>
              UPI
            </span>
          </button>
          
          <button
            type="button"
            onClick={() => setMethod("BANK")}
            className={`p-4 rounded-lg border-2 text-center transition-all ${
              method === "BANK"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <svg className={`w-8 h-8 mx-auto mb-2 ${method === "BANK" ? "text-primary" : "text-secondary"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className={`text-sm font-medium ${method === "BANK" ? "text-primary" : "text-secondary"}`}>
              Bank Transfer
            </span>
          </button>
          
          <button
            type="button"
            onClick={() => setMethod("COD")}
            className={`p-4 rounded-lg border-2 text-center transition-all ${
              method === "COD"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <svg className={`w-8 h-8 mx-auto mb-2 ${method === "COD" ? "text-primary" : "text-secondary"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className={`text-sm font-medium ${method === "COD" ? "text-primary" : "text-secondary"}`}>
              Cash on Delivery
            </span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {method === "UPI" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">UPI ID</label>
              <input
                type="text"
                required
                value={formData.upi_id}
                onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                className="input"
                placeholder="yourname@upi"
              />
            </div>
          )}

          {method === "BANK" && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Bank Name</label>
                <input
                  type="text"
                  required
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="input"
                  placeholder="Enter bank name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Account Number</label>
                <input
                  type="text"
                  required
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className="input"
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">IFSC Code</label>
                <input
                  type="text"
                  required
                  value={formData.ifsc_code}
                  onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                  className="input"
                  placeholder="Enter IFSC code"
                />
              </div>
            </>
          )}

          {method === "COD" && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.delivery_name}
                  onChange={(e) => setFormData({ ...formData, delivery_name: e.target.value })}
                  className="input"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.delivery_phone}
                  onChange={(e) => setFormData({ ...formData, delivery_phone: e.target.value })}
                  className="input"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Delivery Address</label>
                <textarea
                  required
                  rows={3}
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                  className="input resize-none"
                  placeholder="Enter complete delivery address"
                />
              </div>
            </>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={processing}
              className="btn btn-primary w-full"
            >
              {processing ? (
                <>
                  <span className="spinner" />
                  Processing...
                </>
              ) : (
                <>
                  Pay ₹{transaction.total_amount.toFixed(2)}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="card p-4 bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-foreground">Earn {Math.floor(transaction.total_amount * 10)} XP</p>
            <p className="text-sm text-secondary">Complete this purchase to earn experience points!</p>
          </div>
        </div>
      </div>

      {/* Success/Error Modal */}
      <Modal isOpen={!!modalMessage} onClose={() => { setModalMessage(null); if (successPaymentId) router.push(`/payment/invoice?paymentId=${successPaymentId}`); }} title={modalMessage?.type === "success" ? "Success" : "Error"}>
        <p className="text-secondary mb-6">{modalMessage?.text}</p>
        {modalMessage?.type === "success" && successPaymentId ? (
          <button onClick={() => router.push(`/payment/invoice?paymentId=${successPaymentId}`)} className="btn btn-primary w-full">View Invoice</button>
        ) : (
          <button onClick={() => setModalMessage(null)} className="btn btn-primary w-full">OK</button>
        )}
      </Modal>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="spinner" /></div>}>
      <PaymentPageContent />
    </Suspense>
  );
}
