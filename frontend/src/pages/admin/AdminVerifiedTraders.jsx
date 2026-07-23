import React from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  Calendar,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import CustomSelect from "../../components/shared/CustomSelect.jsx";
import {
  listVerifiedTraderApplications,
  inviteVerifiedTrader,
  scheduleVerifiedTraderCall,
  decideVerifiedTraderApplication,
} from "../../controllers/userProfileController.js";

const STATUS_LABELS = {
  invited: "Invited",
  pending: "Pending review",
  scheduled: "Call scheduled",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_COLORS = {
  invited: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  scheduled: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  approved: "bg-green-500/20 text-green-300 border-green-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
};

const PROOF_TYPE_LABELS = {
  broker_statement: "Broker statement",
  payout_proof: "Payout proof",
  other: "Other",
};

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        STATUS_COLORS[status] || STATUS_COLORS.pending
      }`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminVerifiedTraders() {
  const [applications, setApplications] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviting, setInviting] = React.useState(false);
  const [selectedApp, setSelectedApp] = React.useState(null);
  const [scheduleModal, setScheduleModal] = React.useState({ open: false, app: null });
  const [approveModal, setApproveModal] = React.useState({ open: false, app: null });
  const [rejectModal, setRejectModal] = React.useState({ open: false, app: null });
  const [scheduledCallAt, setScheduledCallAt] = React.useState("");
  const [approveForm, setApproveForm] = React.useState({
    pnl: "",
    totalWithdrawals: "",
    youtubeEmbedUrl: "",
  });
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);

  const fetchApplications = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page: 1, size: 50 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await listVerifiedTraderApplications(params);
      setApplications(data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load applications");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setError("");
    setMessage("");
    try {
      await inviteVerifiedTrader({ email: inviteEmail.trim() });
      setInviteEmail("");
      setMessage("Invitation sent.");
      fetchApplications();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  }

  async function handleScheduleCall() {
    if (!scheduleModal.app || !scheduledCallAt) return;

    setActionLoading(true);
    setError("");
    setMessage("");
    try {
      await scheduleVerifiedTraderCall(scheduleModal.app.id, new Date(scheduledCallAt).toISOString());
      setScheduleModal({ open: false, app: null });
      setScheduledCallAt("");
      setMessage("Verification call scheduled.");
      fetchApplications();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to schedule call");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApprove() {
    if (!approveModal.app) return;

    setActionLoading(true);
    setError("");
    setMessage("");
    try {
      await decideVerifiedTraderApplication(approveModal.app.id, {
        decision: "approved",
        pnl: approveForm.pnl !== "" ? Number(approveForm.pnl) : undefined,
        totalWithdrawals:
          approveForm.totalWithdrawals !== "" ? Number(approveForm.totalWithdrawals) : undefined,
        youtubeEmbedUrl: approveForm.youtubeEmbedUrl || undefined,
      });
      setApproveModal({ open: false, app: null });
      setApproveForm({ pnl: "", totalWithdrawals: "", youtubeEmbedUrl: "" });
      setMessage("Application approved.");
      fetchApplications();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve application");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectModal.app) return;

    setActionLoading(true);
    setError("");
    setMessage("");
    try {
      await decideVerifiedTraderApplication(rejectModal.app.id, {
        decision: "rejected",
        rejectionReason: rejectionReason || "Application rejected",
      });
      setRejectModal({ open: false, app: null });
      setRejectionReason("");
      setMessage("Application rejected.");
      fetchApplications();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject application");
    } finally {
      setActionLoading(false);
    }
  }

  const selected = selectedApp
    ? applications.find((app) => app.id === selectedApp) || null
    : null;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <BadgeCheck className="h-8 w-8" />
            Verified Trader Applications
          </h1>
          <p className="text-gray-400">
            Review applications, download proof documents, schedule calls, and approve or reject traders.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-300">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {message}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <form
            onSubmit={handleInvite}
            className="lg:col-span-2 bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Invite user by email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="trader@example.com"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="self-end flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send invite
            </button>
          </form>

          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
            <label className="block text-sm text-gray-400 mb-1">Filter by status</label>
            <CustomSelect
              value={statusFilter}
              onChange={(e) => {
                setSelectedApp(null);
                setStatusFilter(e.target.value);
              }}
              options={[
                { value: "", label: "Active (invited, pending, scheduled)" },
                { value: "pending", label: "Pending review" },
                { value: "scheduled", label: "Call scheduled" },
                { value: "invited", label: "Invited" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-8 flex items-center justify-center text-gray-400 gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading applications...
              </div>
            ) : applications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No applications found for this filter.
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {applications.map((app) => {
                  const status = app.verifiedTrader?.status;
                  const proofCount = app.verifiedTrader?.proofDocuments?.length || 0;
                  const isSelected = selectedApp === app.id;

                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedApp(app.id)}
                      className={`w-full text-left p-4 hover:bg-gray-800/40 transition-colors ${
                        isSelected ? "bg-gray-800/60" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-white truncate">
                            {app.fullName || "Unnamed user"}
                          </div>
                          <div className="text-sm text-gray-400 truncate">{app.email}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {app.country || "—"} · {proofCount} proof file{proofCount === 1 ? "" : "s"}
                          </div>
                        </div>
                        <StatusBadge status={status} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-5">
            {!selected ? (
              <div className="text-gray-400 text-sm">
                Select an application to view details and take action.
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-semibold text-white">{selected.fullName}</h2>
                  <p className="text-gray-400 text-sm">{selected.email}</p>
                  <div className="mt-2">
                    <StatusBadge status={selected.verifiedTrader?.status} />
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-500">Country:</span> {selected.country || "—"}</div>
                  <div><span className="text-gray-500">Member since:</span> {selected.memberSince || "—"}</div>
                  {selected.bio && (
                    <div>
                      <span className="text-gray-500">Bio:</span>
                      <p className="text-gray-300 mt-1">{selected.bio}</p>
                    </div>
                  )}
                  {selected.tradingStyles?.length > 0 && (
                    <div>
                      <span className="text-gray-500">Trading styles:</span>{" "}
                      {selected.tradingStyles.join(", ")}
                    </div>
                  )}
                  {selected.tradesWith?.length > 0 && (
                    <div>
                      <span className="text-gray-500">Trades with:</span>{" "}
                      {selected.tradesWith.join(", ")}
                    </div>
                  )}
                </div>

                {selected.verifiedTrader?.applicationNote && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-1">Application note</h3>
                    <p className="text-sm text-gray-400">{selected.verifiedTrader.applicationNote}</p>
                  </div>
                )}

                <div className="space-y-2 text-sm text-gray-400">
                  {selected.verifiedTrader?.appliedAt && (
                    <div>Applied: {formatDate(selected.verifiedTrader.appliedAt)}</div>
                  )}
                  {selected.verifiedTrader?.invitedAt && (
                    <div>Invited: {formatDate(selected.verifiedTrader.invitedAt)}</div>
                  )}
                  {selected.verifiedTrader?.scheduledCallAt && (
                    <div>Call: {formatDate(selected.verifiedTrader.scheduledCallAt)}</div>
                  )}
                  {selected.verifiedTrader?.decidedAt && (
                    <div>Decided: {formatDate(selected.verifiedTrader.decidedAt)}</div>
                  )}
                </div>

                {selected.verifiedTrader?.proofDocuments?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Proof documents</h3>
                    <div className="space-y-2">
                      {selected.verifiedTrader.proofDocuments.map((doc, index) => (
                        <div
                          key={`${doc.storageKey || doc.fileName || index}`}
                          className="flex items-center justify-between gap-2 p-3 bg-gray-800/50 rounded-lg"
                        >
                          <div className="min-w-0">
                            <div className="text-sm text-white truncate flex items-center gap-2">
                              <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                              {doc.fileName || "Document"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {PROOF_TYPE_LABELS[doc.type] || doc.type}
                            </div>
                          </div>
                          {doc.downloadUrl ? (
                            <a
                              href={doc.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                            >
                              Open
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-500">No link</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    to={`/users/${selected.id}`}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    View public profile →
                  </Link>

                  {selected.verifiedTrader?.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => {
                        setScheduledCallAt("");
                        setScheduleModal({ open: true, app: selected });
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      <Calendar className="h-4 w-4" />
                      Schedule call
                    </button>
                  )}

                  {["pending", "scheduled"].includes(selected.verifiedTrader?.status) && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setApproveForm({
                            pnl: selected.verifiedTrader?.pnl ?? "",
                            totalWithdrawals: selected.verifiedTrader?.totalWithdrawals ?? "",
                            youtubeEmbedUrl: selected.verifiedTrader?.youtubeEmbedUrl || "",
                          });
                          setApproveModal({ open: true, app: selected });
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectionReason("");
                          setRejectModal({ open: true, app: selected });
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={scheduleModal.open}
        onClose={() => setScheduleModal({ open: false, app: null })}
        title="Schedule verification call"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Set a date and time for the verification call with{" "}
            <span className="text-white">{scheduleModal.app?.fullName}</span>.
          </p>
          <input
            type="datetime-local"
            value={scheduledCallAt}
            onChange={(e) => setScheduledCallAt(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setScheduleModal({ open: false, app: null })}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleScheduleCall}
              disabled={!scheduledCallAt || actionLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg"
            >
              {actionLoading ? "Saving..." : "Schedule"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={approveModal.open}
        onClose={() => setApproveModal({ open: false, app: null })}
        title="Approve verified trader"
      >
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-gray-400">PNL (optional)</span>
            <input
              type="number"
              value={approveForm.pnl}
              onChange={(e) => setApproveForm((f) => ({ ...f, pnl: e.target.value }))}
              className="mt-1 w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">Total withdrawals (optional)</span>
            <input
              type="number"
              value={approveForm.totalWithdrawals}
              onChange={(e) => setApproveForm((f) => ({ ...f, totalWithdrawals: e.target.value }))}
              className="mt-1 w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">YouTube embed URL (optional)</span>
            <input
              type="url"
              value={approveForm.youtubeEmbedUrl}
              onChange={(e) => setApproveForm((f) => ({ ...f, youtubeEmbedUrl: e.target.value }))}
              placeholder="https://www.youtube.com/embed/..."
              className="mt-1 w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setApproveModal({ open: false, app: null })}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg"
            >
              {actionLoading ? "Approving..." : "Approve"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, app: null })}
        title="Reject application"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Reject the verified trader application for{" "}
            <span className="text-white">{rejectModal.app?.fullName}</span>?
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Reason for rejection (optional)"
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setRejectModal({ open: false, app: null })}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg"
            >
              {actionLoading ? "Rejecting..." : "Reject"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
