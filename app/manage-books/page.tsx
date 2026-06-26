"use client";

import { useState, useEffect } from "react";
import { api, Book, BookCreate, BookUpdate } from "@/lib/api";
import { parseGenres } from "@/lib/utils";
import Modal from "@/app/components/Modal";
import ImageManager from "@/app/components/ImageManager";
import ImageUpload from "@/app/components/ImageUpload";
import EmptyState from "@/app/components/EmptyState";

const COMMON_GENRES = [
  "Fiction", "Nonfiction", "Fantasy", "Science Fiction", "Mystery",
  "Romance", "Thriller", "Horror", "Biography", "History",
  "Self-Help", "Business", "Technology", "Philosophy", "Poetry",
];

const ITEMS_PER_PAGE = 10;

export default function ModeratorBooks() {
  useEffect(() => { document.title = "Manage Books | E-Book Library"; }, []);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState<"create" | "edit" | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [customGenre, setCustomGenre] = useState("");
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const cleanFormData = (data: BookCreate) => ({
    ...data,
    isbn: data.isbn || undefined,
    description: data.description || undefined,
    language: data.language || undefined,
    genres: data.genres?.length ? data.genres : undefined,
    cover_image: data.cover_image || undefined,
    content_url: data.content_url || undefined,
  });

  const [formData, setFormData] = useState<BookCreate>({
    title: "",
    author: "",
    isbn: "",
    description: "",
    language: "",
    genres: [],
    cover_image: "",
    content_url: "",
    price: 0,
    rental_price_per_day: undefined,
    stock: 0,
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [manageImagesBookId, setManageImagesBookId] = useState<string | null>(null);
  const [modalMessage, setModalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [page, setPage] = useState(1);

  const fetchBooks = async (query?: string) => {
    setLoading(true);
    const data = await api.moderator.getBooks({ search: query });
    setBooks(data);
    setPage(1);
    setLoading(false);
  };

  useEffect(() => {
    fetchBooks();
    api.books.getGenres().then(setAvailableGenres).catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks(search || undefined);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newBook = await api.moderator.createBook(cleanFormData(formData));
      setBooks([newBook, ...books]);
      setShowModal(null);
      resetForm();
    } catch (err) {
      setModalMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to create book" });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    try {
      const updated = await api.moderator.updateBook(editingBook.id, cleanFormData(formData));
      setBooks(books.map(b => b.id === editingBook.id ? updated : b));
      setShowModal(null);
      setEditingBook(null);
      resetForm();
    } catch (err) {
      setModalMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update book" });
    }
  };

  const handleDelete = async (bookId: string) => {
    setConfirmDelete(null);
    await api.moderator.deleteBook(bookId);
    setBooks(books.filter(b => b.id !== bookId));
  };

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

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn || "",
      description: book.description || "",
      language: book.language || "",
      genres: book.genre ? parseGenres(book.genre) : [],
      cover_image: book.cover_image || "",
      content_url: book.content_url || "",
      price: book.price,
      rental_price_per_day: book.rental_price_per_day,
      stock: book.stock,
    });
    setShowModal("edit");
  };

  const resetForm = () => {
    setFormData({
      title: "",
      author: "",
      isbn: "",
      description: "",
      language: "",
      genres: [],
      cover_image: "",
      content_url: "",
      price: 0,
      rental_price_per_day: undefined,
      stock: 0,
    });
  };

  const totalPages = Math.ceil(books.length / ITEMS_PER_PAGE);
  const paginatedData = books.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Books</h1>
          <p className="text-secondary mt-1">{books.length} books in the platform</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal("create"); }}
          className="btn btn-primary"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Book
        </button>
      </div>
      
      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search books..."
          className="input flex-1"
        />
        <button type="submit" className="btn btn-primary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search
        </button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="spinner" />
        </div>
      ) : books.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16 mx-auto text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          title="No books found"
          description="Try adjusting your search or add a new book."
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Genre</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Seller ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((book) => (
                <tr key={book.id}>
                  <td className="font-medium">{book.title}</td>
                  <td className="text-secondary">{book.author}</td>
                  <td>
                    {book.genre && parseGenres(book.genre).map((g) => (
                      <span key={g} className="badge badge-info text-xs mr-1">{g}</span>
                    ))}
                  </td>
                  <td className="font-semibold text-success">₹{book.price.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${book.stock > 0 ? "badge-success" : "badge-danger"}`}>
                      {book.stock}
                    </span>
                  </td>
                  <td className="font-mono text-sm text-secondary">{book.seller_id.slice(0, 8)}...</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setManageImagesBookId(book.id)}
                        className="btn btn-ghost text-sm"
                      >
                        Images
                      </button>
                      <button
                        onClick={() => openEditModal(book)}
                        className="btn btn-ghost text-sm text-primary"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(book.id)}
                        className="btn btn-ghost text-sm text-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-sm text-secondary">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-outline btn-sm"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-outline btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal
          isOpen={true}
          onClose={() => { setShowModal(null); setEditingBook(null); }}
          title={showModal === "create" ? "Add New Book" : "Edit Book"}
        >
          <form onSubmit={showModal === "create" ? handleCreate : handleEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Author *</label>
              <input
                type="text"
                required
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price || ""}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Rental Price/Day</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.rental_price_per_day ?? ""}
                  onChange={(e) => setFormData({ ...formData, rental_price_per_day: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="input"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Stock *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock || ""}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                className="input"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Language</label>
                <input
                  type="text"
                  value={formData.language || ""}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value || undefined })}
                  className="input"
                  placeholder="e.g. English"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Genres</label>
                <div className="flex flex-wrap gap-1 mb-1">
                  {(formData.genres || []).map((g) => (
                    <span key={g} className="badge badge-primary inline-flex items-center gap-1 text-xs">
                      {g}
                      <button type="button" onClick={() => toggleGenre(g)} className="hover:text-danger">&times;</button>
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {(availableGenres.length > 0 ? availableGenres : COMMON_GENRES).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGenre(g)}
                      className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                        (formData.genres || []).includes(g)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-secondary border-border hover:border-primary"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customGenre}
                    onChange={(e) => setCustomGenre(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomGenre())}
                    className="input flex-1 text-sm"
                    placeholder="Add custom genre..."
                  />
                  <button type="button" onClick={addCustomGenre} className="btn btn-outline text-xs">Add</button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">ISBN</label>
              <input
                type="text"
                value={formData.isbn || ""}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value || undefined })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <textarea
                rows={3}
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value || undefined })}
                className="input resize-none"
              />
            </div>
            <ImageUpload
              value={formData.cover_image || ""}
              onChange={(v) => setFormData({ ...formData, cover_image: v || undefined })}
            />
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Book Content URL</label>
              <input
                type="url"
                value={formData.content_url || ""}
                onChange={(e) => setFormData({ ...formData, content_url: e.target.value || undefined })}
                className="input"
                placeholder="https://example.com/book.pdf"
              />
              <p className="text-xs text-muted mt-1">Link to the PDF or ePub file for the book</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn btn-primary flex-1">
                {showModal === "create" ? "Create Book" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => { setShowModal(null); setEditingBook(null); }}
                className="btn btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete Modal */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirm Delete">
        <p className="text-secondary mb-6">Are you sure you want to delete this book? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setConfirmDelete(null)} className="btn btn-outline flex-1">Cancel</button>
          <button onClick={() => confirmDelete && handleDelete(confirmDelete)} className="btn btn-danger flex-1">Delete</button>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal isOpen={!!modalMessage} onClose={() => setModalMessage(null)} title="Error">
        <p className="text-secondary mb-6">{modalMessage?.text}</p>
        <button onClick={() => setModalMessage(null)} className="btn btn-primary w-full">OK</button>
      </Modal>

      {/* Image Manager Modal */}
      {manageImagesBookId && (
        <ImageManager
          bookId={manageImagesBookId}
          isOpen={!!manageImagesBookId}
          onClose={() => setManageImagesBookId(null)}
        />
      )}
    </div>
  );
}
