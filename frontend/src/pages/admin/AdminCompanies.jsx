import React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  CheckCircle2,
  Clock,
  Ban,
  ChevronDown,
  Search,
  Filter,
  ArrowUpDown,
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
import CustomSelect from "../../components/shared/CustomSelect.jsx";

function AdminCompaniesContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || getUserCookie();

  const [companies, setCompanies] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [sortBy, setSortBy] = React.useState("newest");
  const [deleteModal, setDeleteModal] = React.useState({
    isOpen: false,
    companyId: null,
    companyName: "",
  });

  // Refresh when filters change
  React.useEffect(() => {
    loadCompanies();
  }, [searchQuery, statusFilter, categoryFilter, sortBy]);

  // Refresh when component mounts or when navigating back (detected by location change)
  React.useEffect(() => {
    loadCompanies();
  }, [location.pathname]);

  async function loadCompanies() {
    setLoading(true);
    try {
      const filters = {};
      if (searchQuery) filters.search = searchQuery;
      // Only add status filter if it's not empty (not "All statuses")
      // For admin, show all companies by default (no status filter) unless explicitly filtered
      if (statusFilter && statusFilter !== "") {
        filters.status = statusFilter;
      }
      if (categoryFilter) filters.category = categoryFilter;

      const { data } = await getAllCompanies(filters);
      // Ensure we have an array and map _id to id for consistency
      let companiesList = Array.isArray(data)
        ? data.map((c) => ({
          ...c,
          id: c._id || c.id,
        }))
        : [];

      // Apply sorting
      if (sortBy === "newest") {
        companiesList.sort(
          (a, b) =>
            new Date(b.createdAt || b.updatedAt) -
            new Date(a.createdAt || a.updatedAt)
        );
      } else if (sortBy === "oldest") {
        companiesList.sort(
          (a, b) =>
            new Date(a.createdAt || a.updatedAt) -
            new Date(b.createdAt || b.updatedAt)
        );
      } else if (sortBy === "name-asc") {
        companiesList.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );
      } else if (sortBy === "name-desc") {
        companiesList.sort((a, b) =>
          (b.name || "").localeCompare(a.name || "")
        );
      } else if (sortBy === "rating") {
        companiesList.sort(
          (a, b) => (b.ratingsAggregate || 0) - (a.ratingsAggregate || 0)
        );
      }

      setCompanies(companiesList);
    } catch (error) {
      console.error("Error loading companies:", error);
      setCompanies([]); // Set empty array on error
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

  async function handleStatusChange(companyId, newStatus) {
    try {
      const company = companies.find(
        (c) => c.id === companyId || c._id === companyId
      );
      if (!company) {
        console.error("Company not found");
        return;
      }

      // Use updateCompany to change status
      await updateCompany(companyId, { status: newStatus });
      // Refresh the list after status change
      await loadCompanies();
    } catch (error) {
      console.error("Failed to update company status:", error);
      alert(
        `Failed to update company status: ${error.message || "Unknown error"}`
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
            className="group relative inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            <span>Add Company</span>
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6 border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm relative z-30">
          <div className="card-body">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search companies..."
                  className="input pl-10"
                  type="search"
                />
              </div>
              <div className="relative">
                <CustomSelect
                  icon={Filter}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: "", label: "All statuses" },
                    { value: "approved", label: "Approved" },
                    { value: "pending", label: "Pending" },
                    { value: "blocked", label: "Blocked" }
                  ]}
                  placeholder="All statuses"
                />
              </div>
              <div className="relative">
                <CustomSelect
                  icon={Filter}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  options={[
                    { value: "", label: "All categories" },
                    { value: "Broker", label: "Broker" },
                    { value: "PropFirm", label: "Prop Firm" },
                    { value: "Crypto", label: "Crypto" }
                  ]}
                  placeholder="All categories"
                />
              </div>
              <div className="relative">
                <CustomSelect
                  icon={ArrowUpDown}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { value: "newest", label: "Newest First" },
                    { value: "oldest", label: "Oldest First" },
                    { value: "name-asc", label: "Name (A-Z)" },
                    { value: "name-desc", label: "Name (Z-A)" },
                    { value: "rating", label: "Highest Rating" }
                  ]}
                />
              </div>
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
                  key={company.id || company._id || `company-${company.name}`}
                  className="group relative flex flex-col gap-4 p-5 lg:flex-row lg:items-center hover:bg-gray-800/30 transition-all duration-300"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-blue-500/50 transition-all duration-300 rounded-r"></div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 text-white mb-2">
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        {company.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold backdrop-blur-sm ${company.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                          : company.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 shadow-lg shadow-yellow-500/10"
                            : "bg-red-500/20 text-red-300 border border-red-500/50 shadow-lg shadow-red-500/10"
                          }`}
                      >
                        {company.status === "approved" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : company.status === "pending" ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <Ban className="h-3 w-3" />
                        )}
                        {company.status || "unknown"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-lg shadow-blue-500/10 backdrop-blur-sm font-semibold">
                        {company.category}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mb-2">
                      {company.details ||
                        company.description ||
                        "No description"}
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/30">
                        <span className="text-yellow-400">⭐</span>
                        <span className="font-medium">
                          {company.ratingsAggregate?.toFixed(1) || "0.0"}
                        </span>
                      </span>
                      <span className="text-gray-400">
                        <span className="font-medium text-gray-300">
                          {company.totalReviews || 0}
                        </span>{" "}
                        reviews
                      </span>
                      <span className="text-gray-500">
                        Updated {formatDate(company.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:w-auto lg:flex-nowrap">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/admin/companies/${company.id || company._id}`
                        )
                      }
                      className="group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
                    >
                      <Eye className="h-4 w-4 transition-transform group-hover:scale-110" />
                      <span className="text-sm font-medium">View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/admin/companies/edit/${company.id || company._id}`
                        )
                      }
                      className="group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20"
                    >
                      <Edit className="h-4 w-4 transition-transform group-hover:scale-110" />
                      <span className="text-sm font-medium">Edit</span>
                    </button>
                    <CustomSelect
                      value={company.status || "pending"}
                      onChange={(e) =>
                        handleStatusChange(
                          company.id || company._id,
                          e.target.value
                        )
                      }
                      options={[
                        { value: "pending", label: "Pending" },
                        { value: "approved", label: "Approved" },
                        { value: "blocked", label: "Blocked" }
                      ]}
                      className="w-32"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(company.id || company._id, company.name)
                      }
                      className="group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
                    >
                      <Trash2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                      <span className="text-sm font-medium">Delete</span>
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
