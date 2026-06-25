"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, Book } from "@/lib/api";
import { parseGenres } from "@/lib/utils";
import Link from "next/link";
import Modal from "@/app/components/Modal";
import ImageManager from "@/app/components/ImageManager";

export default function SellerBooks() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStockModal, setShowStockModal] = useState<string | null>(null);
  const [stockQuantity, setStockQuantity] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [manageImagesBookId, setManageImagesBookId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      api.seller.getBooks(user.id).then(setBooks).finally(() => setLoading(false));
    }
  }, [user]);

  const handleDelete = async (bookId: string) => {
    if (!user) return;
    setConfirmDelete(null);
    await api.seller.deleteBook(user.id, bookId);
    setBooks(books.filter(b => b.id !== bookId));
  };

  const handleStockUpdate = async (bookId: string, reason: "return" | "sale") => {
    if (!user) return;
    
    const result = await api.seller.updateStock(user.id, bookId, {
      quantity: stockQuantity,
      reason
    });
    
    setBooks(books.map(b => b.id === bookId ? { ...b, stock: result.new_stock } : b));
    setShowStockModal(null);
    setStockQuantity(1);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="spinner" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-enter">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Books</h1>
          <p className="text-secondary mt-1">{books.length} books in your inventory</p>
        </div>
        <Link href="/my-books/new" className="btn btn-primary">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Book
        </Link>
      </div>

      {books.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-lg font-medium text-foreground mb-2">No books yet</h3>
          <p className="text-secondary mb-6">Start by adding your first book to the inventory.</p>
        <Link href="/my-books/new" className="btn btn-primary">
            Add Your First Book
          </Link>
        </div>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
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
                      {book.stock} in stock
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setManageImagesBookId(book.id)}
                        className="btn btn-ghost text-sm"
                      >
                        Images
                      </button>
                      <button
                        onClick={() => setShowStockModal(book.id)}
                        className="btn btn-ghost text-sm"
                      >
                        Update Stock
                      </button>
                      <button
                        onClick={() => setConfirmDelete(book.id)}
                        className="btn btn-ghost text-sm text-danger hover:text-danger"
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

      {/* Stock Modal */}
      <Modal isOpen={!!showStockModal} onClose={() => setShowStockModal(null)} title="Update Stock">
        {showStockModal && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">Quantity</label>
              <input
                type="number"
                min="1"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(parseInt(e.target.value) || 1)}
                className="input"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleStockUpdate(showStockModal, "return")}
                className="btn btn-success flex-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add (Return)
              </button>
              <button
                onClick={() => handleStockUpdate(showStockModal, "sale")}
                className="btn btn-danger flex-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                Remove (Sale)
              </button>
            </div>
            <button
              onClick={() => setShowStockModal(null)}
              className="btn btn-outline w-full mt-3"
            >
              Cancel
            </button>
          </>
        )}
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirm Delete">
        <p className="text-secondary mb-6">Are you sure you want to delete this book?</p>
        <div className="flex gap-3">
          <button onClick={() => setConfirmDelete(null)} className="btn btn-outline flex-1">Cancel</button>
          <button onClick={() => confirmDelete && handleDelete(confirmDelete)} className="btn btn-danger flex-1">Delete</button>
        </div>
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
