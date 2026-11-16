"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "info" | "warning" | "error";

export interface ToastOptions {
  title?: string;
  duration?: number;
}

export interface Toast {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", options?: ToastOptions) => {
      const id = Math.random().toString(36).substring(2, 9);
      const title = options?.title;
      const duration = options?.duration || 4500;

      setToasts((prev) => [...prev, { id, title, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = useCallback(
    (msg: string, opts?: ToastOptions) => showToast(msg, "success", opts),
    [showToast]
  );
  const info = useCallback(
    (msg: string, opts?: ToastOptions) => showToast(msg, "info", opts),
    [showToast]
  );
  const warning = useCallback(
    (msg: string, opts?: ToastOptions) => showToast(msg, "warning", opts),
    [showToast]
  );
  const error = useCallback(
    (msg: string, opts?: ToastOptions) => showToast(msg, "error", opts),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, info, warning, error }}>
      {children}
      {/* Toast Notification Container in Bottom-Right Corner */}
      <div
        aria-live="assertive"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none"
      >
        {toasts.map((toast) => {
          const config = {
            success: {
              border: "border-emerald-200 bg-white/95 text-emerald-950 shadow-emerald-500/10",
              badge: "bg-emerald-100 text-emerald-800",
              title: toast.title || "Success",
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
            },
            info: {
              border: "border-blue-200 bg-white/95 text-blue-950 shadow-blue-500/10",
              badge: "bg-blue-100 text-blue-800",
              title: toast.title || "Information",
              icon: <Info className="w-5 h-5 text-[#0051d5] shrink-0 mt-0.5" />,
            },
            warning: {
              border: "border-amber-200 bg-white/95 text-amber-950 shadow-amber-500/10",
              badge: "bg-amber-100 text-amber-800",
              title: toast.title || "Warning",
              icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
            },
            error: {
              border: "border-red-200 bg-white/95 text-red-950 shadow-red-500/10",
              badge: "bg-red-100 text-red-800",
              title: toast.title || "Action Error",
              icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />,
            },
          }[toast.type];

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto p-4 rounded-xl border backdrop-blur-md shadow-xl flex items-start gap-3 transition-all duration-300 transform translate-y-0 opacity-100 animate-in slide-in-from-bottom-5 ${config.border}`}
            >
              {config.icon}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-slate-900">{config.title}</span>
                  <span
                    className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded ${config.badge}`}
                  >
                    {toast.type}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal break-words">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer shrink-0"
                title="Dismiss alert"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
