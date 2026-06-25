"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, Book } from "@/lib/api";
import { parseGenres } from "@/lib/utils";
import Modal from "@/app/components/Modal";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const [books, setBooks] = useState<Book[]>([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [sortBy, setSortBy] = useState<"relevance" | "price_asc" | "price_desc" | "rating" | "newest" | "popular">("newest");

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rentModal, setRentModal] = useState<{ book: Book; days: number; total: number; dueDate: string } | null>(null);

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
    setRentModal({ ...rentModal, days: clamped, total: rate * clamped, dueDate: new Date(Date.now() + clamped * 86400000).toLocaleDateString() });
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await api.books.search({
        q: search || undefined,
        genre: genreFilter || undefined,
        sortBy,
        skip: 0,
        limit: 24,
      });
      setBooks(data.books);
      setTotalBooks(data.total);
    } catch {
      setErrorMessage("Failed to load books");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.books.getGenres().then(setAvailableGenres).catch(() => {});
    fetchBooks();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [genreFilter, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks();
  };

  const handlePurchase = async (bookId: string) => {
    if (!user) { router.push("/auth/login"); return; }
    setActionLoading(bookId);
    try {
      const transaction = await api.customer.purchase(user.id, { book_id: bookId, quantity: 1 });
      setBooks(books.map(b => b.id === bookId ? { ...b, stock: b.stock - 1 } : b));
      router.push(`/payment?transactionId=${transaction.id}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRent = async () => {
    if (!user || !rentModal) { router.push("/auth/login"); return; }
    const bookId = rentModal.book.id;
    setActionLoading("rent-" + bookId);
    setRentModal(null);
    try {
      const transaction = await api.customer.rent(user.id, { book_id: bookId, quantity: 1, type: "RENT", rental_days: rentModal.days });
      setBooks(books.map(b => b.id === bookId ? { ...b, stock: b.stock - 1 } : b));
      router.push(`/payment?transactionId=${transaction.id}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Rent failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/[0.04] via-background to-blue-400/[0.04] py-16 sm:py-24">
        <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] rounded-full bg-blue-400/5 blur-[100px]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4 leading-[1.15]">
              {user ? `Welcome back, ${user.name}` : "Your Digital Library,"}
              <br />
              <span className="text-gradient">{user ? "keep exploring" : "Reimagined"}</span>
            </h1>
            <p className="text-secondary text-base sm:text-lg mb-8 max-w-xl mx-auto">
              Browse thousands of books. Buy or rent at affordable prices.
            </p>

            <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, author, or ISBN..."
                  className="input flex-1" style={{ paddingLeft: "3rem" }}
                />
              </div>
              <button type="submit" className="btn btn-primary">Search</button>
            </form>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setGenreFilter("")}
                className={`badge cursor-pointer transition-all ${!genreFilter ? "badge-primary shadow-sm" : "badge-muted hover:badge-primary"}`}
              >
                All
              </button>
              {availableGenres.slice(0, 10).map((g) => (
                <button
                  key={g}
                  onClick={() => setGenreFilter(g)}
                  className={`badge cursor-pointer transition-all ${genreFilter === g ? "badge-primary shadow-sm" : "badge-muted hover:badge-primary"}`}
                >
                  {g}
                </button>
              ))}
            </div>

            {!user && (
              <div className="mt-8 flex justify-center gap-3">
                <Link href="/auth/login" className="btn btn-primary btn-sm">Sign In</Link>
                <Link href="/auth/register" className="btn btn-outline btn-sm">Create Account</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Book Grid ── */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {genreFilter ? genreFilter : "Latest Books"}
              </h2>
              {!loading && <p className="text-sm text-muted mt-0.5">{totalBooks} books found</p>}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="input !w-auto !py-1.5 !text-sm"
            >
              <option value="newest">Newest</option>
              <option value="relevance">Relevance</option>
              <option value="rating">Best Rated</option>
              <option value="price_asc">Price: Low</option>
              <option value="price_desc">Price: High</option>
              <option value="popular">Popular</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="spinner" />
            </div>
          ) : books.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/5 flex items-center justify-center">
                <svg className="w-10 h-10 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No books found</h3>
              <p className="text-secondary">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {books.map((book, index) => (
                <div key={book.id} className="group card card-interactive p-0 animate-fade-in flex flex-col relative overflow-hidden" style={{ animationDelay: `${index * 0.03}s` }}>
                  {(book.images?.find(i => i.is_primary) || book.cover_image) ? (
                    <div className="w-full overflow-hidden rounded-t-lg bg-primary/[0.02] max-h-96">
                      <img src={book.images?.find(i => i.is_primary)?.url || book.cover_image!} alt="" className="w-full object-contain transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }} />
                    </div>
                  ) : (
                    <div className="w-full h-40 rounded-t-lg bg-gradient-to-br from-primary/[0.06] to-blue-400/[0.06] flex items-center justify-center">
                      <svg className="w-10 h-10 text-primary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col">
                    <Link href={`/books/${book.slug || book.id}`} className="text-sm font-semibold text-foreground mb-1 line-clamp-1 hover:text-primary transition-colors block">{book.title}</Link>
                    <p className="text-xs text-secondary mb-2">{book.author}</p>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg key={star} className={`w-3 h-3 ${star <= Math.round(book.avg_rating || 0) ? 'text-warning' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      {book.review_count !== undefined && book.review_count !== null && (
                        <span className="text-[0.6rem] text-muted">({book.review_count})</span>
                      )}
                    </div>
                    <div className="flex items-end justify-between mt-auto pt-3 border-t border-border/40">
                      <div>
                        <p className="text-base font-bold text-success">₹{book.price.toFixed(2)}</p>
                        <p className="text-[0.6rem] text-muted">or ₹{(book.rental_price_per_day || book.price * 0.1).toFixed(2)}/day</p>
                      </div>
                      <span className={`badge text-[0.6rem] px-2 py-0.5 ${book.stock > 0 ? "badge-success" : "badge-danger"}`}>
                        {book.stock > 0 ? `${book.stock} left` : "Sold out"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 px-4 pb-4">
                    <button onClick={() => handlePurchase(book.id)} disabled={book.stock === 0 || actionLoading === book.id} className="btn btn-primary flex-1 text-xs py-1.5">
                      {actionLoading === book.id ? <span className="spinner !w-3 !h-3 !border-1.5" /> : "Buy"}
                    </button>
                    <button onClick={() => openRentModal(book)} disabled={book.stock === 0 || actionLoading === ("rent-" + book.id)} className="btn btn-outline flex-1 text-xs py-1.5">
                      {actionLoading === ("rent-" + book.id) ? <span className="spinner !w-3 !h-3 !border-1.5" /> : "Rent"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Rent Modal */}
      <Modal isOpen={!!rentModal} onClose={() => setRentModal(null)} title={`Rent "${rentModal?.book.title || ""}"`}>
        {rentModal && (
          <>
            <p className="text-secondary text-sm mb-6">₹{(rentModal.book.rental_price_per_day || rentModal.book.price * 0.1).toFixed(2)} per day</p>
            <div className="mb-5">
              <label className="block text-sm font-medium text-foreground mb-2">Number of Days</label>
              <input type="number" min={1} value={rentModal.days} onChange={e => updateRentDays(parseInt(e.target.value) || 1)} className="input" />
            </div>
            <div className="bg-background rounded-xl p-4 mb-6 space-y-2.5">
              <div className="flex justify-between text-sm"><span className="text-secondary">Daily Rate</span><span className="font-medium">₹{(rentModal.book.rental_price_per_day || rentModal.book.price * 0.1).toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-secondary">Days</span><span className="font-medium">{rentModal.days}</span></div>
              <div className="flex justify-between text-sm"><span className="text-secondary">Due Date</span><span className="font-medium">{rentModal.dueDate}</span></div>
              <div className="border-t border-border my-2" />
              <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-primary">₹{rentModal.total.toFixed(2)}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRentModal(null)} className="btn btn-outline flex-1">Cancel</button>
              <button onClick={handleRent} disabled={actionLoading === ("rent-" + rentModal.book.id)} className="btn btn-primary flex-1">
                {actionLoading === ("rent-" + rentModal.book.id) ? "Processing..." : "Confirm Rent"}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Error Modal */}
      <Modal isOpen={!!errorMessage} onClose={() => setErrorMessage(null)} title="Error">
        <p className="text-secondary mb-6">{errorMessage}</p>
        <button onClick={() => setErrorMessage(null)} className="btn btn-primary w-full">OK</button>
      </Modal>
    </div>
  );
}
