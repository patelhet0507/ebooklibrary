"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, Book } from "@/lib/api";
import { parseGenres } from "@/lib/utils";
import Modal from "@/app/components/Modal";

export default function CustomerBooks() {
  const { user } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Search & Filters state
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<"relevance" | "price_asc" | "price_desc" | "rating" | "newest" | "popular">("relevance");
  const [showFilters, setShowFilters] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rentModal, setRentModal] = useState<{ book: Book; days: number; total: number; dueDate: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await api.books.search({
        q: search || undefined,
        genre: genreFilter || undefined,
        language: languageFilter || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        minRating: minRating || undefined,
        sortBy,
        skip: 0,
        limit: 100
      });
      setBooks(data.books);
      setTotalBooks(data.total);
    } catch (err) {
      setErrorMessage("Failed to load books");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [genres, langs] = await Promise.all([
        api.books.getGenres().catch(() => []),
        api.books.getLanguages().catch(() => []),
      ]);
      setAvailableGenres(genres);
      setAvailableLanguages(langs);
    } catch (err) {
      console.error("Failed to load filters", err);
    }
  };

  const fetchWishlist = async () => {
    if (!user || user.role !== "CUSTOMER") return;
    try {
      const data = await api.customer.wishlist.get(user.id);
      const ids = new Set(data.map(item => item.book.id));
      setWishlist(ids);
    } catch (err) {
      console.error("Failed to fetch wishlist", err);
    }
  };

  useEffect(() => {
    fetchFilters();
    fetchWishlist();
  }, [user]);

  // Refetch when filters change, debounce search if needed, but for simplicity trigger on submit or explicit change
  useEffect(() => {
    fetchBooks();
  }, [genreFilter, languageFilter, sortBy, minRating]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks();
  };

  const toggleWishlist = async (bookId: string) => {
    if (!user || user.role !== "CUSTOMER") return;
    setActionLoading("wishlist-" + bookId);
    try {
      if (wishlist.has(bookId)) {
        await api.customer.wishlist.remove(user.id, bookId);
        setWishlist(prev => {
          const newSet = new Set(prev);
          newSet.delete(bookId);
          return newSet;
        });
      } else {
        await api.customer.wishlist.add(user.id, bookId);
        setWishlist(prev => new Set(prev).add(bookId));
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Wishlist action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePurchase = async (bookId: string) => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
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
    if (!user || !rentModal) {
      router.push("/auth/login");
      return;
    }
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
      setBooks(books.map(b => b.id === bookId ? { ...b, stock: b.stock - 1 } : b));
      router.push(`/payment?transactionId=${transaction.id}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Rent failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Browse Books</h1>
        <p className="text-secondary mt-1.5">Purchase or rent your next great read</p>
      </div>
      
      {/* ── Search & Filters ── */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, or ISBN..."
              className="input pl-12 flex-1"
            />
          </div>
          <button type="button" onClick={() => setShowFilters(!showFilters)} className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setGenreFilter("")}
            className={`badge cursor-pointer transition-all ${!genreFilter ? "badge-primary shadow-sm" : "badge-muted hover:badge-primary"}`}
          >
            All
          </button>
          {availableGenres.map((g) => (
            <button
              key={g}
              onClick={() => setGenreFilter(g)}
              className={`badge cursor-pointer transition-all ${genreFilter === g ? "badge-primary shadow-sm" : "badge-muted hover:badge-primary"}`}
            >
              {g}
            </button>
          ))}
        </div>

        {availableLanguages.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-xs text-muted font-medium self-center mr-1">Lang:</span>
            {availableLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguageFilter(lang === languageFilter ? "" : lang)}
                className={`badge cursor-pointer transition-all ${languageFilter === lang ? "badge-info shadow-sm" : "badge-muted hover:badge-info"}`}
              >
                {lang}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="card p-6 mb-8 animate-slide-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Price Range</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="input"
                />
                <span className="text-muted">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="input"
                />
                <button onClick={() => fetchBooks()} className="btn btn-primary btn-sm whitespace-nowrap">Apply</button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Minimum Rating</label>
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setMinRating(minRating === star ? 0 : star)}
                    className={`p-1 focus:outline-none transition-all ${minRating >= star ? 'text-warning scale-110' : 'text-gray-300 hover:text-warning/60'}`}
                  >
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
                {minRating > 0 && (
                  <span className="text-sm font-medium text-secondary ml-1">& up</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input"
              >
                <option value="relevance">Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Best Rated</option>
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="mb-5 flex items-center justify-between">
        {!loading && (
          <span className="text-sm text-muted">
            Showing <span className="font-semibold text-foreground">{books.length}</span> of {totalBooks} books
          </span>
        )}
        {availableGenres.length > 0 && !loading && (
          <span className="text-xs text-muted">{availableGenres.length} genres</span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
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
          <p className="text-secondary">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {books.map((book, index) => (
            <div key={book.id} className="group card card-interactive p-0 animate-fade-in flex flex-col relative overflow-hidden" style={{ animationDelay: `${index * 0.04}s` }}>
              {/* Wishlist button */}
              {user?.role === "CUSTOMER" && (
                <button
                  onClick={() => toggleWishlist(book.id)}
                  disabled={actionLoading === "wishlist-" + book.id}
                  className="absolute top-3 right-3 z-10 p-2 bg-white/70 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-sm opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                  title={wishlist.has(book.id) ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <svg className={`w-5 h-5 transition-colors ${wishlist.has(book.id) ? 'text-danger fill-current' : 'text-secondary'}`} viewBox="0 0 24 24" stroke="currentColor" fill={wishlist.has(book.id) ? "currentColor" : "none"}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              )}
              
              {/* Cover image */}
              {(book.images?.find(i => i.is_primary) || book.cover_image) ? (
                <div className="w-full h-44 overflow-hidden rounded-t-lg bg-primary/[0.02]">
                  <img
                    src={book.images?.find(i => i.is_primary)?.url || book.cover_image!}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                  />
                </div>
              ) : (
                <div className="w-full h-44 rounded-t-lg bg-gradient-to-br from-primary/[0.06] via-primary/[0.02] to-blue-400/[0.06] flex items-center justify-center">
                  <svg className="w-12 h-12 text-primary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
              
              <div className="p-5 flex-1 flex flex-col">
                <Link href={`/books/${book.slug || book.id}`} className="text-base font-semibold text-foreground mb-1.5 line-clamp-1 hover:text-primary transition-colors block">
                  {book.title}
                </Link>
                <p className="text-sm text-secondary mb-2.5">{book.author}</p>
                
                {/* Rating row */}
                <div className="flex items-center gap-1 mb-2.5">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map(star => (
                      <svg key={star} className={`w-3.5 h-3.5 ${star <= Math.round(book.avg_rating || 0) ? 'text-warning' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  {book.review_count !== undefined && book.review_count !== null && (
                    <span className="text-xs text-muted">({book.review_count})</span>
                  )}
                </div>

                {/* Genres & Language */}
                {(book.genre || book.language) && (
                  <div className="flex gap-1.5 mb-3 flex-wrap">
                    {book.genre && parseGenres(book.genre).slice(0, 2).map((g) => (
                      <span key={g} className="badge badge-info text-[0.65rem] px-2 py-0.5">
                        {g}
                      </span>
                    ))}
                    {book.language && (
                      <span className="badge badge-muted text-[0.65rem] px-2 py-0.5">
                        {book.language}
                      </span>
                    )}
                  </div>
                )}
                
                {book.description && (
                  <p className="text-sm text-secondary leading-relaxed mb-3 line-clamp-2">{book.description}</p>
                )}
                
                {/* Price & Stock */}
                <div className="flex items-end justify-between mt-auto pt-3.5 border-t border-border/40">
                  <div>
                    <p className="text-xl font-bold text-success">₹{book.price.toFixed(2)}</p>
                    <p className="text-[0.65rem] text-muted mt-0.5">or ₹{(book.rental_price_per_day || book.price * 0.1).toFixed(2)}/day</p>
                  </div>
                  <span className={`badge text-[0.65rem] px-2.5 py-0.5 ${book.stock > 0 ? "badge-success" : "badge-danger"}`}>
                    {book.stock > 0 ? `${book.stock} left` : "Sold out"}
                  </span>
                </div>
              </div>
              
              {/* Action buttons */}
              {(!user || user.role === "CUSTOMER") && (
                <div className="flex gap-2 px-5 pb-5">
                  <button
                    onClick={() => handlePurchase(book.id)}
                    disabled={book.stock === 0 || actionLoading === book.id}
                    className="btn btn-primary flex-1 text-sm py-2"
                  >
                    {actionLoading === book.id ? (
                      <span className="spinner !w-4 !h-4 !border-2" />
                    ) : (
                      "Buy"
                    )}
                  </button>
                  <button
                    onClick={() => openRentModal(book)}
                    disabled={book.stock === 0 || actionLoading === ("rent-" + book.id)}
                    className="btn btn-outline flex-1 text-sm py-2"
                  >
                    {actionLoading === ("rent-" + book.id) ? (
                      <span className="spinner !w-4 !h-4 !border-2" />
                    ) : (
                      "Rent"
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rent Modal */}
      <Modal isOpen={!!rentModal} onClose={() => setRentModal(null)} title={`Rent "${rentModal?.book.title || ""}"`}>
        {rentModal && (
          <>
            <p className="text-secondary text-sm mb-6">
              <span className="font-semibold text-foreground">₹{(rentModal.book.rental_price_per_day || rentModal.book.price * 0.1).toFixed(2)}</span> per day
            </p>

            <div className="mb-5">
              <label className="block text-sm font-medium text-foreground mb-2">Number of Days</label>
              <input
                type="number"
                min={1}
                value={rentModal.days}
                onChange={e => updateRentDays(parseInt(e.target.value) || 1)}
                className="input"
              />
            </div>

            <div className="bg-background rounded-xl p-4 mb-6 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Daily Rate</span>
                <span className="font-medium">₹{(rentModal.book.rental_price_per_day || rentModal.book.price * 0.1).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Days</span>
                <span className="font-medium">{rentModal.days}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Due Date</span>
                <span className="font-medium">{rentModal.dueDate}</span>
              </div>
              <div className="border-t border-border my-2" />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">₹{rentModal.total.toFixed(2)}</span>
              </div>
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

      {/* Error Alert Modal */}
      <Modal isOpen={!!errorMessage} onClose={() => setErrorMessage(null)} title="Error">
        <p className="text-secondary mb-6">{errorMessage}</p>
        <button onClick={() => setErrorMessage(null)} className="btn btn-primary w-full">OK</button>
      </Modal>
    </div>
  );
}
