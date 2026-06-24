"use client";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-full shadow-2xl max-h-[85vh] overflow-y-auto"
        style={{ maxWidth: "28rem" }}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
