"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, Book, Review } from "@/lib/api";
import { parseGenres } from "@/lib/utils";
import { addRecentlyViewed } from "@/lib/recently-viewed";
import Modal from "@/app/components/Modal";
import Barcode from "@/app/components/Barcode";

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [rentModal, setRentModal] = useState<{ days: number; total: number; dueDate: string } | null>(null);
  const [renting, setRenting] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.books.getBySlug(id).catch(() => api.books.get(id)).then((bookData) => {
      if (bookData.slug && id !== bookData.slug) {
        router.replace(`/books/${bookData.slug}`);
        return;
      }
      setBook(bookData);
      document.title = `${bookData.title} | E-Book Library`;
      addRecentlyViewed({ id: bookData.id, slug: bookData.slug, title: bookData.title, author: bookData.author, cover_image: bookData.cover_image });

      if (user && user.role === "CUSTOMER") {
        api.customer.wishlist.get(user.id)
          .then(data => setInWishlist(data.some((item: any) => item.book.id === bookData.id)))
          .catch(() => {});
      }

      return api.reviews.list(bookData.id).then((reviewData) => {
        setReviews(reviewData);
        if (user) {
          setHasReviewed(reviewData.some(r => r.user_id === user.id));
        }
      });
    }).finally(() => setLoading(false));
  }, [id, user]);

  const handlePurchase = async () => {
    if (!book) return;
    if (!user) { router.push(`/checkout?book_id=${book.id}&type=buy`); return; }
    setPurchasing(true);
    try {
      const transaction = await api.customer.purchase(user.id, { book_id: book.id, quantity: 1 });
      router.push(`/payment?transactionId=${transaction.id}`);
    } catch (err) {
      setModalMessage({ type: "error", text: err instanceof Error ? err.message : "Purchase failed" });
    } finally {
      setPurchasing(false);
    }
  };

  const openRentModal = () => {
    if (!book) return;
    const days = 1;
    const rate = book.rental_price_per_day || book.price * 0.1;
    setRentModal({
      days,
      total: rate * days,
      dueDate: new Date(Date.now() + days * 86400000).toLocaleDateString(),
    });
  };

  const updateRentDays = (days: number) => {
    if (!rentModal || !book) return;
    const clamped = Math.max(1, days);
    const rate = book.rental_price_per_day || book.price * 0.1;
    setRentModal({
      ...rentModal,
      days: clamped,
      total: rate * clamped,
      dueDate: new Date(Date.now() + clamped * 86400000).toLocaleDateString(),
    });
  };

  const handleRent = async () => {
    if (!book || !rentModal) return;
    if (!user) { router.push(`/checkout?book_id=${book.id}&type=rent&days=${rentModal.days}`); return; }
    setRenting(true);
    setRentModal(null);
    try {
      const transaction = await api.customer.rent(user.id, {
        book_id: book.id,
        quantity: 1,
        type: "RENT",
        rental_days: rentModal.days,
      });
      router.push(`/payment?transactionId=${transaction.id}`);
    } catch (err) {
      setModalMessage({ type: "error", text: err instanceof Error ? err.message : "Rent failed" });
    } finally {
      setRenting(false);
    }
  };

  const toggleWishlist = async () => {
    if (!user || user.role !== "CUSTOMER" || !book) return;
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await api.customer.wishlist.remove(user.id, book.id);
        setInWishlist(false);
        setModalMessage({ type: "success", text: "Removed from wishlist" });
      } else {
        await api.customer.wishlist.add(user.id, book.id);
        setInWishlist(true);
        setModalMessage({ type: "success", text: "Added to wishlist" });
      }
    } catch (err) {
      setModalMessage({ type: "error", text: "Failed to update wishlist" });
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !book) return;
    setSubmittingReview(true);
    try {
      const review = await api.reviews.create(book.id, user.id, { rating: reviewRating, comment: reviewComment || undefined });
      setReviews([review, ...reviews]);
      setHasReviewed(true);
      setShowReviewModal(false);
      setReviewComment("");
      setModalMessage({ type: "success", text: "Review submitted!" });
    } catch (err) {
      setModalMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to submit review" });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="spinner" />
    </div>
  );

  if (!book) return (
    <div className="text-center py-12">
      <p className="text-secondary">Book not found</p>
    </div>
  );

  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <button onClick={() => router.back()} className="text-primary text-sm mb-6 hover:underline inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="card p-8 mb-8">
        <div className="flex flex-col md:flex-row gap-8">
          {book.cover_image && (
            <div className="w-full md:w-64 shrink-0">
              <img
                src={book.cover_image}
                alt={book.title}
                className="w-full h-64 md:h-80 object-cover rounded-lg border border-border"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{book.title}</h1>
                <p className="text-lg text-secondary mb-4">by {book.author}</p>
              </div>
              {user && user.role === "CUSTOMER" && (
                <button
                  onClick={toggleWishlist}
                  disabled={wishlistLoading}
                  className="p-2 hover:bg-muted/50 rounded-full transition-colors shrink-0"
                  title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <svg className={`w-8 h-8 transition-colors ${inWishlist ? 'text-danger fill-current' : 'text-secondary'}`} viewBox="0 0 24 24" stroke="currentColor" fill={inWishlist ? "currentColor" : "none"}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              )}
            </div>

            {(book.genre || book.language || book.isbn) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {book.genre && parseGenres(book.genre).map((g) => (
                  <span key={g} className="badge badge-info">{g}</span>
                ))}
                {book.language && <span className="badge badge-muted">{book.language}</span>}
                {book.isbn && <span className="badge badge-muted">ISBN: {book.isbn}</span>}
              </div>
            )}

            {book.description && (
              <p className="text-secondary mb-6 leading-relaxed">{book.description}</p>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div>
                <p className="text-3xl font-bold text-success">₹{book.price.toFixed(2)}</p>
                {book.rental_price_per_day && (
                  <p className="text-sm text-muted mt-1">or ₹{book.rental_price_per_day.toFixed(2)}/day to rent</p>
                )}
              </div>
              <span className={`badge ${book.stock > 0 ? "badge-success" : "badge-danger"} text-sm`}>
                {book.stock > 0 ? `${book.stock} in stock` : "Out of stock"}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePurchase}
                disabled={book.stock === 0 || purchasing}
                className="btn btn-primary"
              >
                {purchasing ? "..." : `Buy ₹${book.price.toFixed(2)}`}
              </button>
              <button
                onClick={openRentModal}
                disabled={book.stock === 0 || renting}
                className="btn btn-outline"
              >
                {renting ? "..." : `Rent ₹${(book.rental_price_per_day || book.price * 0.1).toFixed(2)}/day`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Images Gallery */}
      {book.images && book.images.length > 0 && (
        <div className="card p-8 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {book.images.map((img) => (
              <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={img.url}
                  alt=""
                  className={`w-full h-40 object-cover rounded-lg border ${img.is_primary ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                {img.is_primary && <span className="text-xs text-primary mt-1 block text-center">Cover</span>}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Barcode */}
      {book.isbn && (
        <div className="card p-8 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">ISBN Barcode</h2>
          <div className="flex justify-center">
            <Barcode value={book.isbn} />
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="card p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Reviews</h2>
            {reviews.length > 0 && (
              <p className="text-sm text-secondary mt-1">{avgRating} avg rating &bull; {reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
            )}
          </div>
          {user && !hasReviewed && (
            <button onClick={() => setShowReviewModal(true)} className="btn btn-primary">
              Write a Review
            </button>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="text-secondary">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 bg-background rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">{review.user_name.charAt(0)}</span>
                    </div>
                    <span className="font-medium text-sm text-foreground">{review.user_name}</span>
                  </div>
                  <span className="text-xs text-muted">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className={`w-4 h-4 ${star <= review.rating ? "text-warning" : "text-muted"}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  ))}
                </div>
                {review.comment && <p className="text-sm text-secondary">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="Write a Review">
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" onClick={() => setReviewRating(star)} className="p-1">
                <svg className={`w-8 h-8 ${star <= reviewRating ? "text-warning" : "text-muted"}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">Comment (optional)</label>
          <textarea
            rows={4}
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            className="input resize-none"
            placeholder="Share your thoughts about this book..."
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSubmitReview}
            disabled={submittingReview}
            className="btn btn-primary flex-1"
          >
            {submittingReview ? "Submitting..." : "Submit Review"}
          </button>
          <button onClick={() => setShowReviewModal(false)} className="btn btn-outline">Cancel</button>
        </div>
      </Modal>

      {/* Message Modal */}
      <Modal isOpen={!!modalMessage} onClose={() => setModalMessage(null)} title={modalMessage?.type === "success" ? "Success" : "Error"}>
        <p className="text-secondary mb-6">{modalMessage?.text}</p>
        <button onClick={() => setModalMessage(null)} className="btn btn-primary w-full">OK</button>
      </Modal>

      {/* Rent Modal */}
      <Modal isOpen={!!rentModal} onClose={() => setRentModal(null)} title={`Rent "${book?.title || ""}"`}>
        {rentModal && book && (
          <>
            <p className="text-secondary text-sm mb-6">₹{(book.rental_price_per_day || book.price * 0.1).toFixed(2)} per day</p>

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
                <span>₹{(book.rental_price_per_day || book.price * 0.1).toFixed(2)}</span>
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
              <button onClick={handleRent} disabled={renting} className="btn btn-primary flex-1">{renting ? "Processing..." : "Confirm Rent"}</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
