"use client";
import { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "info" | "success";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Open/close dialog element
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      firstFocusableRef.current?.focus();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  const variantStyles = {
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    info: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    success: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="modal-title"
      aria-modal="true"
      className="backdrop:bg-black backdrop:bg-opacity-50 rounded-lg shadow-2xl p-0 max-w-md w-full animate-fadeIn"
    >
      <div className="bg-white rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
            {title}
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4 text-gray-700">{children}</div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
          >
            {cancelText}
          </button>
          {onConfirm && (
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 transition ${variantStyles[variant]}`}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
