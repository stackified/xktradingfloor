import React from "react";
import { X, Flag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "./CustomSelect.jsx";

const FLAG_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "inappropriate", label: "Inappropriate Content" },
  { value: "misinformation", label: "Misinformation" },
  { value: "duplicate", label: "Duplicate Content" },
  { value: "other", label: "Other" },
];

function FlagModal({ isOpen, onClose, onConfirm, title = "Flag Content" }) {
  const [selectedReason, setSelectedReason] = React.useState("");
  const [description, setDescription] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedReason("");
      setDescription("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!selectedReason) {
      return;
    }
    onConfirm(selectedReason, description);
    onClose();
  };

  if (!isOpen) return null;

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
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <Flag className="h-5 w-5 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Reason for Flagging <span className="text-red-400">*</span>
                  </label>
                  <CustomSelect
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    options={[
                      { value: "", label: "Select a reason..." },
                      ...FLAG_REASONS
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Additional Details
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe why you are flagging this content..."
                    rows={4}
                    className="textarea textarea-bordered w-full border-white/10 bg-gray-950/40 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedReason}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Flag Content
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default FlagModal;

