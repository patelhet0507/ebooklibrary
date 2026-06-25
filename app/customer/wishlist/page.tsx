"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, Book } from "@/lib/api";
import { parseGenres } from "@/lib/utils";
import Modal from "@/app/components/Modal";

export default function CustomerWishlist() {
  const { user } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rentModal, setRentModal] = useState<{ book: Book; days: number; total: number; dueDate: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === "CUSTOMER") {
      fetchWishlist();
    } else if (user) {
      router.push("/");
    } else {
      router.push("/auth/login");
    }
  }, [user, router]);

  const fetchWishlist = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.customer.wishlist.get(user.id);
      setBooks(data.map(item => item.book));
    } catch (err) {
      console.error("Failed to fetch wishlist", err);
    } finally {
      setLoading(false);
    }
  };

  const openRentModal = (book: Book) => {
    const days = 1;
    setRentModal({
      book,
      days,
      total: (book.rental_price_per_day || book.price * 0.1) * days,
      dueDate: new Date(Date.now() + days * 86400000).toLocaleDateString(),
    });
  };

  const updateRentDays = (days: number) => {
    if (!rentModal) return;
    const clamped = Math.max(1, days);
    const rate = rentModal.book.rental_price_per_day || rentModal.book.price * 0.1;
    setRentModal({
      ...rentModal,
      days: clamped,
      total: rate * clamped,
      dueDate: new Date(Date.now() + clamped * 86400000).toLocaleDateString(),
    });
  };

  const handlePurchase = async (bookId: string) => {
    if (!user) return;
    setActionLoading(bookId);
    try {
      const transaction = await api.customer.purchase(user.id, { book_id: bookId, quantity: 1 });
      router.push(`/payment?transactionId=${transaction.id}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRent = async () => {
    if (!user || !rentModal) return;
    const bookId = rentModal.book.id;
    setActionLoading("rent-" + bookId);
    setRentModal(null);
    try {
      const transaction = await api.customer.rent(user.id, {
        book_id: bookId,
        quantity: 1,
        type: "RENT",
        rental_days: rentModal.days,
      });
      router.push(`/payment?transactionId=${transaction.id}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Rent failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFromWishlist = async (bookId: string) => {
    if (!user) return;
    setActionLoading("remove-" + bookId);
    try {
      await api.customer.wishlist.remove(user.id, bookId);
      setBooks(books.filter(b => b.id !== bookId));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to remove from wishlist");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">My Wishlist</h1>
        <p className="text-secondary mt-1">Books you've saved for later</p>
      </div>

      {books.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="text-lg font-medium text-foreground mb-2">Your wishlist is empty</h3>
          <p className="text-secondary mb-6">Browse our collection and save books you're interested in.</p>
          <Link href="/customer/books" className="btn btn-primary">
            Browse Books
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book, index) => (
            <div key={book.id} className="card card-interactive p-0 animate-fade-in flex flex-col relative" style={{ animationDelay: `${index * 0.05}s` }}>
              <button
                onClick={() => handleRemoveFromWishlist(book.id)}
                disabled={actionLoading === "remove-" + book.id}
                className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur rounded-full text-danger hover:bg-white transition-colors shadow-sm"
                title="Remove from wishlist"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              
              {(book.images?.find(i => i.is_primary) || book.cover_image) ? (
                <div className="w-full overflow-hidden rounded-t-lg bg-primary/[0.02] max-h-96">
                  <img
                    src={book.images?.find(i => i.is_primary)?.url || book.cover_image!}
                    alt=""
                    className="w-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                  />
                </div>
              ) : (
                <div className="w-full h-40 rounded-t-lg bg-gradient-to-br from-primary/10 to-success/10" />
              )}
              <div className="p-6 flex-1 flex flex-col">
                <Link href={`/books/${book.slug || book.id}`} className="text-lg font-semibold text-foreground mb-2 line-clamp-1 hover:text-primary transition-colors block">{book.title}</Link>
                <p className="text-secondary text-sm mb-3">{book.author}</p>
                
                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <svg key={star} className={`w-4 h-4 ${star <= Math.round(book.avg_rating || 0) ? 'text-warning' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-xs text-muted ml-1">({book.review_count || 0})</span>
                </div>

                {(book.genre || book.language) && (
                  <div className="flex gap-1.5 mb-3 flex-wrap">
                    {book.genre && parseGenres(book.genre).map((g) => (
                      <span key={g} className="badge badge-info text-xs">
                        {g}
                      </span>
                    ))}
                    {book.language && (
                      <span className="badge badge-muted text-xs">
                        {book.language}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between mt-auto pt-4">
                  <div>
                    <p className="text-2xl font-bold text-success">₹{book.price.toFixed(2)}</p>
                    <p className="text-xs text-muted mt-1">or ₹{(book.rental_price_per_day || book.price * 0.1).toFixed(2)}/day</p>
                  </div>
                  <span className={`badge ${book.stock > 0 ? "badge-success" : "badge-danger"}`}>
                    {book.stock > 0 ? `${book.stock} left` : "Out of stock"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 p-4 pt-0">
                <button
                  onClick={() => handlePurchase(book.id)}
                  disabled={book.stock === 0 || actionLoading === book.id}
                  className="btn btn-primary flex-1"
                >
                  {actionLoading === book.id ? "..." : `Buy`}
                </button>
                <button
                  onClick={() => openRentModal(book)}
                  disabled={book.stock === 0 || actionLoading === ("rent-" + book.id)}
                  className="btn btn-outline flex-1"
                >
                  {actionLoading === ("rent-" + book.id) ? "..." : `Rent`}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rent Modal */}
      <Modal isOpen={!!rentModal} onClose={() => setRentModal(null)} title={`Rent "${rentModal?.book.title || ""}"`}>
        {rentModal && (
          <>
            <p className="text-secondary text-sm mb-6">₹{(rentModal.book.rental_price_per_day || rentModal.book.price * 0.1).toFixed(2)} per day</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">Number of Days</label>
              <input
                type="number"
                min={1}
                value={rentModal.days}
                onChange={e => updateRentDays(parseInt(e.target.value) || 1)}
                className="input"
              />
            </div>

            <div className="bg-background rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Daily Rate</span>
                <span>₹{(rentModal.book.rental_price_per_day || rentModal.book.price * 0.1).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Days</span>
                <span>{rentModal.days}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Due Date</span>
                <span>{rentModal.dueDate}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">₹{rentModal.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setRentModal(null)} className="btn btn-outline flex-1">Cancel</button>
              <button onClick={handleRent} className="btn btn-primary flex-1">Confirm Rent</button>
            </div>
          </>
        )}
      </Modal>

      {/* Error Alert Modal */}
      <Modal isOpen={!!errorMessage} onClose={() => setErrorMessage(null)} title="Error">
        <p className="text-secondary mb-6">{errorMessage}</p>
        <button onClick={() => setErrorMessage(null)} className="btn btn-primary w-full">OK</button>
      </Modal>
    </div>
  );
}
