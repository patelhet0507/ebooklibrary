"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, Invoice } from "@/lib/api";

export const dynamic = "force-dynamic";

function InvoicePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  useEffect(() => {
    if (paymentId) {
      api.payments.getInvoice(paymentId)
        .then(setInvoice)
        .catch((err) => setInvoiceError(err instanceof Error ? err.message : "Failed to load invoice"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [paymentId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="spinner" />
    </div>
  );

  if (invoiceError) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">Invoice Not Found</h2>
        <p className="text-secondary mb-6">{invoiceError}</p>
        <button onClick={() => router.push("/customer/transactions")} className="btn btn-primary">Go to Transactions</button>
      </div>
    );
  }

  if (!invoice) return null;

  const { payment, transaction, book } = invoice;
  const isRent = transaction.type === "RENT";
  const dailyRate = isRent && book.rental_price_per_day
    ? book.rental_price_per_day
    : isRent ? book.price * 0.1 : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="print:hidden flex gap-3 mb-6">
        <button onClick={handlePrint} className="btn btn-primary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
        <button onClick={() => router.push("/customer/transactions")} className="btn btn-outline">
          My Transactions
        </button>
      </div>

      <div className="card p-8 print:p-0 print:shadow-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invoice</h1>
            <p className="text-sm text-muted mt-1">#{transaction.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">E-Book Library</p>
            <p className="text-sm text-muted">{new Date(payment.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">Bill To</h2>
          <p className="font-medium text-foreground">{invoice.user_name}</p>
          <p className="text-sm text-secondary">{invoice.user_email}</p>
        </div>

        {/* Book Info */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Item</h2>
          <div className="bg-background rounded-lg p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-foreground">{book.title}</p>
              <span className={`badge ${isRent ? "badge-info" : "badge-primary"}`}>
                {isRent ? "RENTAL" : "PURCHASE"}
              </span>
            </div>
            <p className="text-sm text-secondary">{book.author}</p>
            {book.isbn && <p className="text-xs text-muted mt-1">ISBN: {book.isbn}</p>}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Details</h2>
          <div className="bg-background rounded-lg p-4 space-y-2">
            {isRent ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Daily Rate</span>
                  <span>₹{(dailyRate || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Rental Days</span>
                  <span>{transaction.rental_days} day{transaction.rental_days !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Quantity</span>
                  <span>{transaction.quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">Due Date</span>
                  <span>{transaction.due_date ? new Date(transaction.due_date).toLocaleDateString() : "-"}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Unit Price</span>
                <span>₹{book.price.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">₹{transaction.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Payment</h2>
          <div className="bg-background rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Method</span>
              <span>{payment.method}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-secondary">Status</span>
              <span className={`badge ${payment.status === "COMPLETED" ? "badge-success" : "badge-warning"}`}>
                {payment.status}
              </span>
            </div>
            {payment.method === "COD" && payment.delivery_name && (
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Delivery</span>
                <span className="text-right">{payment.delivery_name}, {payment.delivery_phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* XP Info */}
        {payment.status === "COMPLETED" && payment.method !== "COD" && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-sm text-foreground">Earned <strong>{Math.floor(transaction.total_amount * 10)} XP</strong> on this transaction</p>
          </div>
        )}

        {/* Seller Contact */}
        {invoice.seller_email && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">Seller</h2>
            <div className="bg-background rounded-lg p-4 space-y-1">
              <p className="font-medium text-foreground">{invoice.seller_name}</p>
              <a href={`mailto:${invoice.seller_email}`} className="text-sm text-primary hover:underline">{invoice.seller_email}</a>
              <p className="text-xs text-muted mt-2">Contact the seller for any questions about this book.</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted">
          <p>Thank you for your {isRent ? "rental" : "purchase"}!</p>
        </div>
      </div>
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="spinner" /></div>}>
      <InvoicePageContent />
    </Suspense>
  );
}
