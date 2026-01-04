import React from "react";
import { Send, Save, Mail, Loader2, AlertCircle } from "lucide-react";
import RichTextEditor from "../../shared/RichTextEditor.jsx";

/**
 * EmailComposer Component
 * Allows composing emails with rich text editor
 */
function EmailComposer({
  selectedUsers = [],
  onSend,
  onSaveDraft,
  initialDraft = null,
  isLoading = false,
}) {
  const [subject, setSubject] = React.useState(initialDraft?.subject || "");
  const [content, setContent] = React.useState(initialDraft?.content || "");
  const [errors, setErrors] = React.useState({});
  const [lastSaved, setLastSaved] = React.useState(null);

  // Auto-save draft every 30 seconds
  React.useEffect(() => {
    if (!initialDraft && (subject.trim() || content.trim())) {
      const autoSaveInterval = setInterval(() => {
        if (subject.trim() || content.trim()) {
          handleSaveDraft(true); // Silent auto-save
        }
      }, 30000); // 30 seconds

      return () => clearInterval(autoSaveInterval);
    }
  }, [subject, content, initialDraft]);

  const validate = () => {
    const newErrors = {};

    if (!subject.trim()) {
      newErrors.subject = "Subject is required";
    }

    if (!content.trim() || content.trim() === "<p><br></p>") {
      newErrors.content = "Email content is required";
    }

    if (selectedUsers.length === 0) {
      newErrors.recipients = "Please select at least one recipient";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSend = async () => {
    if (!validate()) {
      return;
    }

    try {
      await onSend({
        subject: subject.trim(),
        content: content.trim(),
        recipientIds: selectedUsers.map((user) => user.id || user._id).filter(Boolean),
        recipientEmails: selectedUsers
          .map((user) => user.email)
          .filter((email) => email && email.includes("@")),
      });
    } catch (error) {
      setErrors({ send: error.message || "Failed to send email" });
    }
  };

  const handleSaveDraft = async (silent = false) => {
    if (!subject.trim() && !content.trim()) {
      return;
    }

    try {
      await onSaveDraft({
        subject: subject.trim(),
        content: content.trim(),
        recipientIds: selectedUsers.map((user) => user.id || user._id).filter(Boolean),
        recipientEmails: selectedUsers
          .map((user) => user.email)
          .filter((email) => email && email.includes("@")),
      });

      if (!silent) {
        setLastSaved(new Date());
        setTimeout(() => setLastSaved(null), 3000);
      }
    } catch (error) {
      if (!silent) {
        setErrors({ draft: error.message || "Failed to save draft" });
      }
    }
  };

  const recipientCount = selectedUsers.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Compose Email
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {recipientCount > 0 ? (
              <>
                Sending to <strong className="text-white">{recipientCount}</strong>{" "}
                recipient{recipientCount !== 1 ? "s" : ""}
              </>
            ) : (
              "Select recipients from the user table above"
            )}
          </p>
        </div>
      </div>

      {/* Errors */}
      {Object.keys(errors).length > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          {Object.entries(errors).map(([key, message]) => (
            <div key={key} className="flex items-center gap-2 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Auto-save indicator */}
      {lastSaved && (
        <div className="p-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300 text-sm">
          Draft saved at {lastSaved.toLocaleTimeString()}
        </div>
      )}

      {/* Subject */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          Subject <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            if (errors.subject) {
              setErrors((prev) => ({ ...prev, subject: "" }));
            }
          }}
          placeholder="Enter email subject..."
          className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.subject ? "border-red-500/50" : "border-gray-700"
          }`}
        />
        {errors.subject && (
          <p className="text-xs text-red-400">{errors.subject}</p>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">
          Content <span className="text-red-400">*</span>
        </label>
        <RichTextEditor
          value={content}
          onChange={(newContent) => {
            setContent(newContent);
            if (errors.content) {
              setErrors((prev) => ({ ...prev, content: "" }));
            }
          }}
          placeholder="Write your email content here..."
        />
        {errors.content && (
          <p className="text-xs text-red-400">{errors.content}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
        <button
          onClick={handleSend}
          disabled={isLoading || recipientCount === 0}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Email
            </>
          )}
        </button>
        <button
          onClick={() => handleSaveDraft(false)}
          disabled={isLoading || (!subject.trim() && !content.trim())}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Draft
        </button>
      </div>

      {/* Warning if no recipients */}
      {recipientCount === 0 && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-300 text-sm">
          <AlertCircle className="w-4 h-4 inline mr-2" />
          Please select at least one recipient from the user table to send an email.
        </div>
      )}
    </div>
  );
}

export default EmailComposer;

