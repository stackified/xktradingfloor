import React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Shield,
  ShieldOff,
  Loader2,
} from "lucide-react";
import {
  getAllCompanies,
  deleteCompany,
  updateCompany,
} from "../../controllers/companiesController.js";
import ProtectedRoute from "../../components/dashboard/ProtectedRoute.jsx";
import { useSelector } from "react-redux";
import { getUserCookie } from "../../utils/cookies.js";
import ConfirmModal from "../../components/shared/ConfirmModal.jsx";

function AdminCompaniesContent() {
  const navigate = useNavigate();
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || getUserCookie();

  const [companies, setCompanies] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [deleteModal, setDeleteModal] = React.useState({
    isOpen: false,
    companyId: null,
    companyName: "",
  });

  React.useEffect(() => {
    loadCompanies();
  }, [searchQuery, statusFilter, categoryFilter]);

  async function loadCompanies() {
    setLoading(true);
    try {
      const filters = {};
      if (searchQuery) filters.search = searchQuery;
      // Only add status filter if it's not empty (not "All statuses")
      if (statusFilter && statusFilter !== "") {
        filters.status = statusFilter;
      }
      if (categoryFilter) filters.category = categoryFilter;

      const { data } = await getAllCompanies(filters);
      setCompanies(data || []);
    } catch (error) {
      console.error("Error loading companies:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(companyId, companyName) {
    setDeleteModal({ isOpen: true, companyId, companyName });
  }

  const confirmDelete = async () => {
    if (!deleteModal.companyId) return;
    try {
      await deleteCompany(deleteModal.companyId);
      await loadCompanies();
    } catch (error) {
      console.error("Failed to delete company:", error);
    }
  };

  async function handleToggleStatus(companyId) {
    try {
      const company = companies.find(
        (c) => c.id === companyId || c._id === companyId
      );
      if (!company) {
        console.error("Company not found");
        return;
      }

      // Determine new status based on current status
      let newStatus;
      if (company.status === "approved") {
        newStatus = "blocked";
      } else if (company.status === "pending") {
        newStatus = "approved";
      } else if (company.status === "blocked") {
        newStatus = "approved";
      } else {
        newStatus = "approved";
      }

      // Use updateCompany to change status
      await updateCompany(companyId, { status: newStatus });
      await loadCompanies();
    } catch (error) {
      console.error("Failed to toggle company status:", error);
      alert(
        `Failed to toggle company status: ${error.message || "Unknown error"}`
      );
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-gray-950 text-white min-h-screen">
      <Helmet>
        <title>Company Management | XK Trading Floor Admin</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Company Management</h1>
            <p className="text-sm text-gray-400">
              Manage all companies, reviews, and settings
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/companies/create")}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Company
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="grid gap-4 md:grid-cols-3">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search companies..."
                className="input input-bordered bg-gray-900/70 border-white/10 text-white placeholder:text-gray-500"
                type="search"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select select-bordered bg-gray-900/70 border-white/10 text-white"
              >
                <option value="">All statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="blocked">Blocked</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="select select-bordered bg-gray-900/70 border-white/10 text-white"
              >
                <option value="">All categories</option>
                <option value="Broker">Broker</option>
                <option value="PropFirm">Prop Firm</option>
                <option value="Crypto">Crypto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Companies List */}
        <div className="rounded-2xl border border-white/10 bg-gray-900/70 backdrop-blur">
          {loading && (
            <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading companies...
            </div>
          )}

          {!loading && companies.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <div className="text-lg font-medium mb-2">No companies found</div>
              <p className="text-sm text-gray-500">
                Try adjusting your filters or create a new company.
              </p>
            </div>
          )}

          {!loading && companies.length > 0 && (
            <div className="divide-y divide-white/5">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 text-white mb-2">
                      <h3 className="text-lg font-semibold">{company.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          company.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"
                            : company.status === "pending"
                            ? "bg-yellow-500/10 text-yellow-300 border border-yellow-500/40"
                            : "bg-red-500/10 text-red-300 border border-red-500/40"
                        }`}
                      >
                        {company.status || "unknown"}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-300 border border-blue-500/40">
                        {company.category}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mb-2">
                      {company.details ||
                        company.description ||
                        "No description"}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        Rating: {company.ratingsAggregate?.toFixed(1) || "0.0"}{" "}
                        ⭐
                      </span>
                      <span>Reviews: {company.totalReviews || 0}</span>
                      <span>Updated: {formatDate(company.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:w-64">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/companies/${company.id}`)}
                      className="btn btn-sm btn-outline border-white/20 text-white hover:bg-white/10"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/companies/edit/${company.id}`)
                      }
                      className="btn btn-sm btn-outline border-white/20 text-white hover:bg-white/10"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(company.id)}
                      className={`btn btn-sm btn-outline ${
                        company.status === "approved"
                          ? "border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/10"
                          : "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                      }`}
                    >
                      {company.status === "approved" ? (
                        <>
                          <ShieldOff className="h-4 w-4" />
                          Block
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4" />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(company.id, company.name)}
                      className="btn btn-sm btn-outline border-red-500/40 text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, companyId: null, companyName: "" })
        }
        onConfirm={confirmDelete}
        title="Delete Company"
        message={`Are you sure you want to delete "${deleteModal.companyName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

export default function AdminCompanies() {
  return (
    <ProtectedRoute role="admin">
      <AdminCompaniesContent />
    </ProtectedRoute>
  );
}
