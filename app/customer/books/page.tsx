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
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
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

  const fetchBooks = async (searchQuery?: string, genre?: string, language?: string) => {
    setLoading(true);
    const data = await api.books.list({ search: searchQuery, genre: genre || undefined, language: language || undefined, skip: 0, limit: 100 });
    setBooks(data);
    setLoading(false);
  };

  const fetchFilters = async () => {
    const [genres, langs] = await Promise.all([
      api.books.getGenres().catch(() => []),
      api.books.getLanguages().catch(() => []),
    ]);
    setAvailableGenres(genres);
    setAvailableLanguages(langs);
  };

  useEffect(() => {
    fetchBooks();
    fetchFilters();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks(search || undefined, genreFilter || undefined, languageFilter || undefined);
  };

  const handleGenreChange = (genre: string) => {
    setGenreFilter(genre);
    fetchBooks(search || undefined, genre || undefined, languageFilter || undefined);
  };

  const handleLanguageChange = (language: string) => {
    setLanguageFilter(language === languageFilter ? "" : language);
    fetchBooks(search || undefined, genreFilter || undefined, language === languageFilter ? undefined : language);
  };

  const handlePurchase = async (bookId: string) => {
    if (!user) return;
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
        <h1 className="text-2xl font-bold text-foreground">Browse Books</h1>
        <p className="text-secondary mt-1">Purchase or rent your next great read</p>
      </div>
      
      <form onSubmit={handleSearch} className="flex gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or author..."
          className="input flex-1"
        />
        <button type="submit" className="btn btn-primary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mb-2">
        <button
          onClick={() => handleGenreChange("")}
          className={`badge cursor-pointer ${!genreFilter ? "badge-primary" : "badge-muted"}`}
        >
          All Genres
        </button>
        {availableGenres.map((g) => (
          <button
            key={g}
            onClick={() => handleGenreChange(g)}
            className={`badge cursor-pointer ${genreFilter === g ? "badge-primary" : "badge-muted"}`}
          >
            {g}
          </button>
        ))}
      </div>

      {availableLanguages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {availableLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`badge cursor-pointer ${languageFilter === lang ? "badge-info" : "badge-muted"}`}
            >
              {lang}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="spinner" />
        </div>
      ) : books.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-lg font-medium text-foreground mb-2">No books found</h3>
          <p className="text-secondary">Try adjusting your search or check back later.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book, index) => (
            <div key={book.id} className="card card-interactive p-0 animate-fade-in flex flex-col" style={{ animationDelay: `${index * 0.05}s` }}>
              {(book.images?.find(i => i.is_primary) || book.cover_image) && (
                <div className="w-full h-40 overflow-hidden rounded-t-lg">
                  <img
                    src={book.images?.find(i => i.is_primary)?.url || book.cover_image!}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                  />
                </div>
              )}
              <div className="p-6 flex-1 flex flex-col">
                <Link href={`/books/${book.slug || book.id}`} className="text-lg font-semibold text-foreground mb-2 line-clamp-1 hover:text-primary transition-colors block">{book.title}</Link>
                <p className="text-secondary text-sm mb-3">{book.author}</p>
                {(book.genre || book.language) && (
                  <div className="flex gap-1.5 mb-3 flex-wrap">
                    {book.genre && parseGenres(book.genre).map((g) => (
                      <button key={g} onClick={(e) => { e.preventDefault(); handleGenreChange(g); }} className="badge badge-info text-xs cursor-pointer hover:opacity-80 transition-opacity">
                        {g}
                      </button>
                    ))}
                    {book.language && (
                      <button onClick={(e) => { e.preventDefault(); handleLanguageChange(book.language!); }} className="badge badge-muted text-xs cursor-pointer hover:opacity-80 transition-opacity">
                        {book.language}
                      </button>
                    )}
                  </div>
                )}
                {book.description && (
                  <p className="text-secondary text-sm mb-4 line-clamp-2">{book.description}</p>
                )}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-2xl font-bold text-success">₹{book.price.toFixed(2)}</p>
                    <p className="text-xs text-muted mt-1">or ₹{(book.rental_price_per_day || book.price * 0.1).toFixed(2)}/day to rent</p>
                  </div>
                  <span className={`badge ${book.stock > 0 ? "badge-success" : "badge-danger"}`}>
                    {book.stock > 0 ? `${book.stock} available` : "Out of stock"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePurchase(book.id)}
                  disabled={book.stock === 0 || actionLoading === book.id}
                  className="btn btn-primary flex-1"
                >
                  {actionLoading === book.id ? "..." : `Buy ₹${book.price.toFixed(2)}`}
                </button>
                <button
                  onClick={() => openRentModal(book)}
                  disabled={book.stock === 0 || actionLoading === ("rent-" + book.id)}
                  className="btn btn-outline flex-1"
                >
                  {actionLoading === ("rent-" + book.id) ? "..." : `Rent ₹${(book.rental_price_per_day || book.price * 0.1).toFixed(2)}/day`}
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
