import React from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Mail, FileText, History, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "../../contexts/ToastContext.jsx";
import CSVUploader from "../../components/admin/email/CSVUploader.jsx";
import UserTable from "../../components/admin/email/UserTable.jsx";
import EmailComposer from "../../components/admin/email/EmailComposer.jsx";
import DraftManager from "../../components/admin/email/DraftManager.jsx";
import CampaignHistory from "../../components/admin/email/CampaignHistory.jsx";
import {
  getUploadedUsers,
  sendEmail,
  saveDraft,
  updateDraft,
  getDraftById,
} from "../../controllers/emailCampaignController.js";

/**
 * EmailCampaigns Page
 * Main page for email campaign management
 */
function EmailCampaigns() {
  const toast = useToast();
  const [activeTab, setActiveTab] = React.useState("compose");
  const [uploadedUsers, setUploadedUsers] = React.useState([]);
  const [selectedUsers, setSelectedUsers] = React.useState([]);
  const [currentDraft, setCurrentDraft] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState("");

  // Pagination state
  const [pagination, setPagination] = React.useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });

  // Search and filter state
  const [searchQuery, setSearchQuery] = React.useState("");

  // Fetch uploaded users
  const fetchUsers = React.useCallback(
    async (page = 1, search = "") => {
      setIsLoading(true);
      setError("");

      try {
        const result = await getUploadedUsers({
          page,
          limit: pagination.itemsPerPage,
          search,
          sortBy: "joinedAt",
          sortOrder: "desc",
        });

        if (result.data) {
          setUploadedUsers(Array.isArray(result.data.users) ? result.data.users : []);
          if (result.data.pagination) {
            setPagination(result.data.pagination);
          }
        }
      } catch (err) {
        setError(err.message || "Failed to load users");
        setUploadedUsers([]);
        toast.error(err.message || "Failed to load users");
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.itemsPerPage, toast]
  );

  // Initial load
  React.useEffect(() => {
    fetchUsers(1, searchQuery);
  }, []);

  // Handle CSV upload success
  const handleCSVUploadSuccess = (result) => {
    toast.success(
      `Successfully uploaded ${result.data?.totalImported || 0} users`
    );
    // Refresh user list
    fetchUsers(1, searchQuery);
  };

  // Handle CSV upload error
  const handleCSVUploadError = (error) => {
    toast.error(error.message || "Failed to upload CSV");
  };

  // Handle search change
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setPagination((p) => ({ ...p, currentPage: 1 }));
    fetchUsers(1, query);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination((p) => ({ ...p, currentPage: newPage }));
    fetchUsers(newPage, searchQuery);
  };

  // Handle send email
  const handleSendEmail = async (emailData) => {
    setIsSending(true);
    setError("");

    try {
      const result = await sendEmail(emailData);
      toast.success(
        `Email campaign sent successfully to ${emailData.recipientIds.length} recipients`
      );

      // Clear selection and reset form
      setSelectedUsers([]);
      setCurrentDraft(null);

      // Switch to history tab
      setActiveTab("history");
    } catch (err) {
      const errorMessage = err.message || "Failed to send email";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  // Handle save draft
  const handleSaveDraft = async (draftData) => {
    try {
      if (currentDraft) {
        await updateDraft(currentDraft.id || currentDraft._id, draftData);
        toast.success("Draft updated successfully");
      } else {
        const result = await saveDraft(draftData);
        setCurrentDraft(result.data);
        toast.success("Draft saved successfully");
      }
    } catch (err) {
      toast.error(err.message || "Failed to save draft");
    }
  };

  // Handle load draft
  const handleLoadDraft = async (draft) => {
    try {
      const result = await getDraftById(draft.id || draft._id);
      setCurrentDraft(result.data);
      
      // Set selected users from draft
      if (result.data.recipientIds && result.data.recipientIds.length > 0) {
        // Fetch user details for selected IDs
        const allUsers = await getUploadedUsers({ limit: 1000 });
        const draftUsers = allUsers.data?.users?.filter((user) =>
          result.data.recipientIds.includes(user.id || user._id)
        ) || [];
        setSelectedUsers(draftUsers);
      }
      
      // Switch to compose tab
      setActiveTab("compose");
      toast.success("Draft loaded successfully");
    } catch (err) {
      toast.error(err.message || "Failed to load draft");
    }
  };

  const tabs = [
    { id: "compose", label: "Compose", icon: Mail },
    { id: "drafts", label: "Drafts", icon: FileText },
    { id: "history", label: "History", icon: History },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <Helmet>
        <title>Email Campaigns | XK Trading Floor Admin</title>
        <meta
          name="description"
          content="Manage email campaigns and send bulk emails to users"
        />
      </Helmet>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Email Campaigns
          </h1>
          <p className="text-gray-400">
            Upload user data from Whop and send bulk emails
          </p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-800">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-6 py-3 font-medium text-sm transition-colors relative
                    ${
                      isActive
                        ? "text-blue-400"
                        : "text-gray-400 hover:text-gray-300"
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "compose" && (
            <div className="space-y-6">
              {/* CSV Upload Section */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Upload User Data
                </h2>
                <p className="text-sm text-gray-400 mb-4">
                  Export user data from Whop as CSV and upload it here
                </p>
                <CSVUploader
                  onUploadSuccess={handleCSVUploadSuccess}
                  onUploadError={handleCSVUploadError}
                />
              </div>

              {/* User Table Section */}
              {uploadedUsers.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Select Recipients
                  </h2>
                  <UserTable
                    users={uploadedUsers}
                    selectedUsers={selectedUsers.map(
                      (user) => user.id || user._id
                    )}
                    onSelectionChange={(selectedIds) => {
                      const selected = uploadedUsers.filter(
                        (user) => selectedIds.includes(user.id || user._id)
                      );
                      setSelectedUsers(selected);
                    }}
                    pagination={{
                      ...pagination,
                      onPageChange: handlePageChange,
                    }}
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    loading={isLoading}
                  />
                </div>
              )}

              {/* Email Composer Section */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <EmailComposer
                  selectedUsers={selectedUsers}
                  onSend={handleSendEmail}
                  onSaveDraft={handleSaveDraft}
                  initialDraft={currentDraft}
                  isLoading={isSending}
                />
              </div>
            </div>
          )}

          {activeTab === "drafts" && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <DraftManager
                onLoadDraft={handleLoadDraft}
                onDeleteDraft={async (draftId) => {
                  try {
                    const { deleteDraft } = await import(
                      "../../controllers/emailCampaignController.js"
                    );
                    await deleteDraft(draftId);
                    toast.success("Draft deleted successfully");
                  } catch (err) {
                    toast.error(err.message || "Failed to delete draft");
                  }
                }}
              />
            </div>
          )}

          {activeTab === "history" && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <CampaignHistory />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmailCampaigns;

