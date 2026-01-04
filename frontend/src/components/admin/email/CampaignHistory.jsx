import React from "react";
import { Mail, Calendar, CheckCircle2, XCircle, Clock, Eye, Loader2, AlertCircle } from "lucide-react";

/**
 * CampaignHistory Component
 * Displays sent email campaigns history
 */
function CampaignHistory({ onViewCampaign, loading = false }) {
  const [campaigns, setCampaigns] = React.useState([]);
  const [pagination, setPagination] = React.useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [selectedCampaign, setSelectedCampaign] = React.useState(null);

  const fetchCampaigns = React.useCallback(async (page = 1) => {
    setIsLoading(true);
    setError("");

    try {
      const { getCampaigns } = await import(
        "../../../controllers/emailCampaignController.js"
      );
      const result = await getCampaigns({ page, limit: pagination.itemsPerPage });
      
      if (result.data) {
        setCampaigns(Array.isArray(result.data.campaigns) ? result.data.campaigns : []);
        if (result.data.pagination) {
          setPagination(result.data.pagination);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load campaigns");
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.itemsPerPage]);

  React.useEffect(() => {
    fetchCampaigns(pagination.currentPage);
  }, [pagination.currentPage, fetchCampaigns]);

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

  const getStatusBadge = (status) => {
    const statusLower = (status || "").toLowerCase();
    
    if (statusLower === "completed") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Completed
        </span>
      );
    } else if (statusLower === "sending") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Sending
        </span>
      );
    } else if (statusLower === "failed") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </span>
      );
    } else if (statusLower === "partially_failed") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
          <AlertCircle className="w-3 h-3 mr-1" />
          Partial
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-500/30">
        {status || "Unknown"}
      </span>
    );
  };

  const handleViewCampaign = async (campaignId) => {
    try {
      const { getCampaignById } = await import(
        "../../../controllers/emailCampaignController.js"
      );
      const result = await getCampaignById(campaignId);
      setSelectedCampaign(result.data);
      onViewCampaign?.(result.data);
    } catch (err) {
      setError(err.message || "Failed to load campaign details");
    }
  };

  if (loading || isLoading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-4" />
        <p className="text-gray-400">Loading campaigns...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Campaign History
        </h3>
        <button
          onClick={() => fetchCampaigns(pagination.currentPage)}
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

      {campaigns.length === 0 ? (
        <div className="p-12 text-center bg-gray-900 border border-gray-800 rounded-lg">
          <Mail className="h-12 w-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No campaigns sent yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Your sent email campaigns will appear here
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id || campaign._id}
                className="p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-white font-medium">
                        {campaign.subject || "Untitled Campaign"}
                      </h4>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400 mt-3">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span>
                          {campaign.sentCount || 0} / {campaign.recipientCount || 0} sent
                        </span>
                      </div>
                      {campaign.failedCount > 0 && (
                        <div className="flex items-center gap-1 text-red-400">
                          <XCircle className="w-3 h-3" />
                          <span>{campaign.failedCount} failed</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(campaign.sentAt)}</span>
                      </div>
                      {campaign.completedAt && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed {formatDate(campaign.completedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewCampaign(campaign.id || campaign._id)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-blue-400 hover:text-blue-300 ml-4"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
              <div className="text-sm text-gray-400">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{" "}
                {Math.min(
                  pagination.currentPage * pagination.itemsPerPage,
                  pagination.totalItems
                )}{" "}
                of {pagination.totalItems} campaigns
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setPagination((p) => ({ ...p, currentPage: p.currentPage - 1 }))
                  }
                  disabled={pagination.currentPage === 1}
                  className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  ←
                </button>
                <span className="text-sm text-gray-300">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPagination((p) => ({ ...p, currentPage: p.currentPage + 1 }))
                  }
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Campaign Details</h3>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Subject</label>
                  <p className="text-white font-medium">{selectedCampaign.subject}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedCampaign.status)}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Recipients</label>
                    <p className="text-white">{selectedCampaign.recipientCount || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Sent</label>
                    <p className="text-white">{selectedCampaign.sentCount || 0}</p>
                  </div>
                  {selectedCampaign.failedCount > 0 && (
                    <div>
                      <label className="text-sm text-gray-400">Failed</label>
                      <p className="text-red-400">{selectedCampaign.failedCount}</p>
                    </div>
                  )}
                </div>
                
                {selectedCampaign.errors && selectedCampaign.errors.length > 0 && (
                  <div>
                    <label className="text-sm text-gray-400">Errors</label>
                    <div className="mt-2 space-y-1">
                      {selectedCampaign.errors.map((error, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-300"
                        >
                          <strong>{error.email}:</strong> {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="text-sm text-gray-400">Content</label>
                  <div
                    className="mt-2 p-4 bg-gray-800 rounded-lg text-gray-300 prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedCampaign.content }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignHistory;

