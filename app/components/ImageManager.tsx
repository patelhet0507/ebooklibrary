"use client";

import { useState, useEffect } from "react";
import { api, BookImage } from "@/lib/api";
import Modal from "./Modal";

interface ImageManagerProps {
  bookId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageManager({ bookId, isOpen, onClose }: ImageManagerProps) {
  const [images, setImages] = useState<BookImage[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.books.getImages(bookId).then(setImages).finally(() => setLoading(false));
    }
  }, [isOpen, bookId]);

  const handleAdd = async () => {
    if (!newUrl.trim()) return;
    setAdding(true);
    try {
      const img = await api.books.addImage(bookId, { url: newUrl.trim() });
      setImages([...images, img]);
      setNewUrl("");
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to add image" });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      await api.books.deleteImage(bookId, imageId);
      setImages(images.filter(i => i.id !== imageId));
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to delete image" });
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await api.books.setPrimaryImage(bookId, imageId);
      setImages(images.map(i => ({ ...i, is_primary: i.id === imageId })));
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to set primary image" });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Images">
      {message && (
        <div className={`alert ${message.type === "success" ? "alert-success" : "alert-danger"} mb-4`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-2">&times;</button>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <input
          type="url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="input flex-1"
        />
        <button onClick={handleAdd} disabled={adding || !newUrl.trim()} className="btn btn-primary">
          {adding ? "..." : "Add"}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="spinner" /></div>
      ) : images.length === 0 ? (
        <p className="text-secondary text-center py-8">No images added yet.</p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {images.map((img) => (
            <div key={img.id} className="flex items-center gap-3 p-3 bg-background rounded-lg">
              <img src={img.url} alt="" className="w-16 h-20 object-cover rounded flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted truncate">{img.url}</p>
                {img.is_primary && <span className="badge badge-primary text-xs mt-1">Primary</span>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {!img.is_primary && (
                  <button onClick={() => handleSetPrimary(img.id)} className="btn btn-ghost text-xs text-primary" title="Set as primary">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                )}
                <button onClick={() => handleDelete(img.id)} className="btn btn-ghost text-xs text-danger" title="Delete">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <button onClick={onClose} className="btn btn-outline w-full">Close</button>
      </div>
    </Modal>
  );
}
