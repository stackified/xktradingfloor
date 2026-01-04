import React from "react";
import { FileText, Edit, Trash2, Calendar, Mail, Loader2, AlertCircle } from "lucide-react";

/**
 * DraftManager Component
 * Manages saved email drafts
 */
function DraftManager({ onLoadDraft, onDeleteDraft, loading = false }) {
  const [drafts, setDrafts] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [deleteConfirm, setDeleteConfirm] = React.useState(null);

  const fetchDrafts = React.useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const { getDrafts } = await import(
        "../../../controllers/emailCampaignController.js"
      );
      const result = await getDrafts();
      setDrafts(Array.isArray(result.data) ? result.data : result.data?.drafts || []);
    } catch (err) {
      setError(err.message || "Failed to load drafts");
      setDrafts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleDelete = async (draftId) => {
    try {
      const { deleteDraft } = await import(
        "../../../controllers/emailCampaignController.js"
      );
      await deleteDraft(draftId);
      await fetchDrafts();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message || "Failed to delete draft");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  if (loading || isLoading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-4" />
        <p className="text-gray-400">Loading drafts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Saved Drafts
        </h3>
        <button
          onClick={fetchDrafts}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {drafts.length === 0 ? (
        <div className="p-12 text-center bg-gray-900 border border-gray-800 rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No drafts saved yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Save your email composition as a draft to continue later
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <div
              key={draft.id || draft._id}
              className="p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-1">
                    {draft.subject || "Untitled Draft"}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {draft.recipientCount || 0} recipient
                      {(draft.recipientCount || 0) !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(draft.updatedAt || draft.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLoadDraft(draft)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-blue-400 hover:text-blue-300"
                    title="Load draft"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(draft.id || draft._id)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-red-400 hover:text-red-300"
                    title="Delete draft"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Delete Draft?</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this draft? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DraftManager;

