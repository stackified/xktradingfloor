import React from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Mail, FileText, History, AlertCircle } from "lucide-react";
import { useToast } from "../../contexts/ToastContext.jsx";
import EmailComposer from "../../components/admin/email/EmailComposer.jsx";
import DraftManager from "../../components/admin/email/DraftManager.jsx";
import CampaignHistory from "../../components/admin/email/CampaignHistory.jsx";
import {
  sendBulkEmail,
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
  const [currentDraft, setCurrentDraft] = React.useState(null);
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState("");

  // Handle send email
  const handleSendEmail = async (formData) => {
    setIsSending(true);
    setError("");

    try {
      const result = await sendBulkEmail(formData);
      toast.success(result.message || "Email campaign sent successfully");

      // Reset form
      setCurrentDraft(null);

      // Switch to history tab (if supported)
      // setActiveTab("history");
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

      // Switch to compose tab
      setActiveTab("compose");
      toast.success("Draft loaded successfully");
    } catch (err) {
      toast.error(err.message || "Failed to load draft");
    }
  };

  const tabs = [
    { id: "compose", label: "Compose & Send", icon: Mail },
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
            Create and send bulk email campaigns using Mailchimp integration
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
                    ${isActive
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
            <div className="max-w-4xl">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <EmailComposer
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

