"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Skeleton } from "@/app/components/Skeleton";

export default function ReadPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [book, setBook] = useState<any>(null);
  const [access, setAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/auth/login"); return; }
    (async () => {
      try {
        const bookData = await api.books.get(id);
        setBook(bookData);
        // Check access via transactions
        const txn = await api.customer.getTransactions(user.id);
        const hasAccess = txn.transactions.some(
          (t) => t.book_id === id && (t.type === "PURCHASE" || (t.type === "RENT" && !t.returned_at))
        );
        setAccess(hasAccess);
      } catch { setAccess(false); }
      setLoading(false);
    })();
  }, [id, user, router]);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-8 page-enter">
      <Skeleton className="h-8 w-64 mb-4" />
      <Skeleton className="h-[70vh] w-full !rounded-xl" />
    </div>
  );

  if (!book || access === false) return (
    <div className="max-w-5xl mx-auto px-4 py-8 page-enter">
      <div className="card p-12 text-center">
        <svg className="w-16 h-16 mx-auto text-danger mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
        <p className="text-secondary mb-6">You need to purchase or rent this book to read it.</p>
        <button onClick={() => router.push(`/books/${book?.slug || id}`)} className="btn btn-primary">View Book Details</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background page-enter">
      <div className="sticky top-0 z-10 bg-background border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-primary/10 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-sm font-semibold text-foreground truncate max-w-md">{book.title}</h1>
          </div>
          {book.content_url && (
            <a
              href={book.content_url}
              download
              className="btn btn-primary btn-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </a>
          )}
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {book.content_url ? (
          <iframe
            src={book.content_url}
            className="w-full h-[80vh] rounded-xl bg-background shadow-lg border border-border"
            title={book.title}
          />
        ) : (
          <div className="card p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h2 className="text-xl font-semibold text-foreground mb-2">No content available</h2>
            <p className="text-secondary">The book content has not been uploaded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
