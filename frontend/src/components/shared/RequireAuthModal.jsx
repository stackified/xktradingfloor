import React from "react";
import { useNavigate } from "react-router-dom";
import { X, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function RequireAuthModal({
  isOpen,
  onClose,
  onConfirm,
  redirectPath = "/login",
}) {
  if (!isOpen) return null;

  const navigate = useNavigate();

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      // Default: redirect to login with next param
      const currentPath = window.location.pathname;
      const nextParam =
        currentPath !== "/login"
          ? `?next=${encodeURIComponent(currentPath)}`
          : "";
      navigate(`${redirectPath}${nextParam}`);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Lock className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Login Required
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-gray-300 mb-6">
                You need to be logged in to access this content. Please log in
                to continue.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Go to Login
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default RequireAuthModal;
