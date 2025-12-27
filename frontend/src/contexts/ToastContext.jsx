import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, XCircle } from "lucide-react";

const ToastContext = createContext(null);

/**
 * Toast Notification Provider
 * Provides a global toast notification system with auto-dismiss and accessibility features
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", duration = 5000) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type, // 'success', 'error', 'info', 'warning'
      duration,
    };

    setToasts((prev) => [...prev, toast]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (message, duration) => {
      return showToast(message, "success", duration);
    },
    [showToast]
  );

  const error = useCallback(
    (message, duration) => {
      return showToast(message, "error", duration);
    },
    [showToast]
  );

  const info = useCallback(
    (message, duration) => {
      return showToast(message, "info", duration);
    },
    [showToast]
  );

  const warning = useCallback(
    (message, duration) => {
      return showToast(message, "warning", duration);
    },
    [showToast]
  );

  const value = {
    showToast,
    removeToast,
    success,
    error,
    info,
    warning,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Toast Container Component
 * Renders all active toasts
 */
function ToastContainer({ toasts, removeToast }) {
  return (
    <div
      className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-md w-full"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Individual Toast Item Component
 */
const ToastItem = React.forwardRef(({ toast, onClose }, ref) => {
  const { message, type } = toast;

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: "bg-green-500/20",
      borderColor: "border-green-500/30",
      textColor: "text-green-300",
      iconColor: "text-green-400",
    },
    error: {
      icon: XCircle,
      bgColor: "bg-red-500/20",
      borderColor: "border-red-500/30",
      textColor: "text-red-300",
      iconColor: "text-red-400",
    },
    warning: {
      icon: AlertCircle,
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-500/30",
      textColor: "text-yellow-300",
      iconColor: "text-yellow-400",
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500/30",
      textColor: "text-blue-300",
      iconColor: "text-blue-400",
    },
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 100, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`
        pointer-events-auto
        ${config.bgColor}
        ${config.borderColor}
        border
        rounded-lg
        shadow-2xl
        backdrop-blur-xl
        p-4
        flex
        items-start
        gap-3
        min-w-[300px]
        max-w-full
      `}
      role="alert"
      aria-live="polite"
    >
      <Icon
        className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${config.textColor}`}>{message}</p>
      </div>
      <button
        onClick={onClose}
        className={`
          flex-shrink-0
          ${config.textColor}
          hover:opacity-70
          transition-opacity
          p-1
          rounded
          focus:outline-none
          focus:ring-2
          focus:ring-offset-2
          focus:ring-offset-transparent
          focus:ring-blue-500
        `}
        aria-label="Close notification"
        type="button"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </motion.div>
  );
});

ToastItem.displayName = "ToastItem";

/**
 * Hook to use toast notifications
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
