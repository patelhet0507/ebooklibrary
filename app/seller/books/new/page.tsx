"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, BookCreate } from "@/lib/api";
import ImageUpload from "@/app/components/ImageUpload";

const COMMON_GENRES = [
  "Fiction", "Nonfiction", "Fantasy", "Science Fiction", "Mystery",
  "Romance", "Thriller", "Horror", "Biography", "History",
  "Self-Help", "Business", "Technology", "Philosophy", "Poetry",
];

export default function NewBookPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [customGenre, setCustomGenre] = useState("");
  const [formData, setFormData] = useState<BookCreate>({
    title: "",
    author: "",
    isbn: undefined,
    description: undefined,
    language: undefined,
    genres: [],
    cover_image: undefined,
    price: 0,
    rental_price_per_day: undefined,
    stock: 0,
  });

  useEffect(() => {
    api.books.getGenres().then(setAvailableGenres).catch(() => {});
  }, []);

  const toggleGenre = (genre: string) => {
    const current = formData.genres || [];
    setFormData({
      ...formData,
      genres: current.includes(genre)
        ? current.filter((g) => g !== genre)
        : [...current, genre],
    });
  };

  const addCustomGenre = () => {
    const trimmed = customGenre.trim();
    if (!trimmed || (formData.genres || []).includes(trimmed)) return;
    setFormData({ ...formData, genres: [...(formData.genres || []), trimmed] });
    setCustomGenre("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const data = {
        ...formData,
        isbn: formData.isbn || undefined,
        description: formData.description || undefined,
        language: formData.language || undefined,
        genres: formData.genres?.length ? formData.genres : undefined,
        cover_image: formData.cover_image || undefined,
      };
      await api.seller.createBook(user.id, data);
      router.push("/seller/books");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create book");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Add New Book</h1>
        <p className="text-secondary mt-1">Add a new book to your inventory</p>
      </div>
      
      {error && (
        <div className="alert alert-danger mb-6">{error}</div>
      )}

      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              placeholder="Enter book title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Author *</label>
            <input
              type="text"
              required
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="input"
              placeholder="Enter author name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Price *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price || ""}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="input pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Initial Stock *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock || ""}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                className="input"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Language</label>
              <input
                type="text"
                value={formData.language || ""}
                onChange={(e) => setFormData({ ...formData, language: e.target.value || undefined })}
                className="input"
                placeholder="e.g. English"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">Genres</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(formData.genres || []).map((g) => (
                  <span key={g} className="badge badge-primary inline-flex items-center gap-1">
                    {g}
                    <button type="button" onClick={() => toggleGenre(g)} className="hover:text-danger">&times;</button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {(availableGenres.length > 0 ? availableGenres : COMMON_GENRES).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      (formData.genres || []).includes(g)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-secondary border-border hover:border-primary"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={customGenre}
                  onChange={(e) => setCustomGenre(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomGenre())}
                  className="input flex-1"
                  placeholder="Add custom genre..."
                />
                <button type="button" onClick={addCustomGenre} className="btn btn-outline text-sm">Add</button>
              </div>
            </div>
          </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">ISBN</label>
              <input
                type="text"
                value={formData.isbn || ""}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value || undefined })}
                className="input"
                placeholder="978-3-16-148410-0"
              />
            </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Rental Price Per Day (optional)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.rental_price_per_day ?? ""}
                onChange={(e) => setFormData({ ...formData, rental_price_per_day: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="input pl-8"
                placeholder="Leave empty to disable renting"
              />
            </div>
            <p className="text-xs text-muted mt-1">Set a daily rental price to allow customers to rent this book</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea
              rows={4}
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value || undefined })}
              className="input resize-none"
              placeholder="Brief description of the book..."
            />
          </div>

          <ImageUpload
            value={formData.cover_image || ""}
            onChange={(v) => setFormData({ ...formData, cover_image: v || undefined })}
          />

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Book
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
