import React from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  UserPlus, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Edit2,
  Shield,
  UserCheck,
  UserX,
  Loader2,
  AlertCircle
} from "lucide-react";
import {
  getAllUsers,
  createOperator,
  updateUserRole,
  updateUserStatus,
} from "../../controllers/userManagementController.js";
import ConfirmModal from "../../components/shared/ConfirmModal.jsx";

// Input sanitization helper to prevent XSS
function sanitizeInput(input) {
  if (typeof input !== "string") return input;
  const div = document.createElement("div");
  div.textContent = input;
  return div.innerHTML;
}

// Role badge component
function RoleBadge({ role }) {
  const roleColors = {
    Admin: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    Operator: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    User: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  };

  const colorClass = roleColors[role] || roleColors.User;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
    >
      <Shield className="h-3 w-3 mr-1" />
      {role}
    </span>
  );
}

// Status badge component
function StatusBadge({ isActive }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive
          ? "bg-green-500/20 text-green-300 border border-green-500/30"
          : "bg-red-500/20 text-red-300 border border-red-500/30"
      }`}
    >
      {isActive ? (
        <>
          <UserCheck className="h-3 w-3 mr-1" />
          Active
        </>
      ) : (
        <>
          <UserX className="h-3 w-3 mr-1" />
          Inactive
        </>
      )}
    </span>
  );
}

// Create Operator Modal
function CreateOperatorModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = React.useState({
    fullName: "",
    email: "",
    password: "",
    mobileNumber: "",
  });
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Sanitize input to prevent XSS
    const sanitizedValue = sanitizeInput(value);
    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setErrorMessage("");
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await createOperator(formData);
      onSuccess();
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        password: "",
        mobileNumber: "",
      });
      onClose();
    } catch (error) {
      setErrorMessage(error.message || "Failed to create operator");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 border border-gray-800 rounded-lg shadow-2xl w-full max-w-md mx-4"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create Operator
          </h2>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300 text-sm">
              <AlertCircle className="h-4 w-4" />
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
                required
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-400">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password (min 6 characters)"
                required
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Mobile Number (Optional)
              </label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter mobile number"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Operator"
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// Role Change Modal
function RoleChangeModal({ isOpen, onClose, user, onSuccess }) {
  const [selectedRole, setSelectedRole] = React.useState(user?.role || "User");
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user || selectedRole === user.role) {
      onClose();
      return;
    }

    // Prevent admin role changes
    if (user.role === "Admin" || selectedRole === "Admin") {
      setErrorMessage("Cannot change Admin roles. Admin roles must be assigned manually.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      await updateUserRole(user.id || user._id, selectedRole);
      onSuccess();
      onClose();
    } catch (error) {
      setErrorMessage(error.message || "Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  const isAdminUser = user.role === "Admin";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 border border-gray-800 rounded-lg shadow-2xl w-full max-w-md mx-4"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Change User Role
          </h2>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300 text-sm">
              <AlertCircle className="h-4 w-4" />
              {errorMessage}
            </div>
          )}

          <div className="mb-4">
            <p className="text-gray-300 mb-2">
              User: <span className="font-semibold text-white">{user.fullName || user.email}</span>
            </p>
            <p className="text-gray-400 text-sm mb-4">
              Current Role: <RoleBadge role={user.role} />
            </p>
          </div>

          {isAdminUser ? (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-300 text-sm">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              Admin roles cannot be changed through this interface.
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isAdminUser || loading}
              >
                <option value="User">User</option>
                <option value="Operator">Operator</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            {!isAdminUser && (
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                disabled={loading || selectedRole === user.role}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Role"
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminSettings() {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [sortOrder, setSortOrder] = React.useState("desc");
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [roleChangeModal, setRoleChangeModal] = React.useState({ isOpen: false, user: null });
  const [statusChangeConfirm, setStatusChangeConfirm] = React.useState({ isOpen: false, user: null, newStatus: null });

  // Fetch users
  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAllUsers({
        page: currentPage,
        size: itemsPerPage,
        search: searchQuery,
        role: roleFilter,
      });

      if (response.data) {
        setUsers(response.data.docs || []);
        setTotalItems(response.data.totalItems || 0);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(response.data.currentPage || currentPage);
      }
    } catch (err) {
      setError(err.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, roleFilter]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle search with debounce
  const [searchTimeout, setSearchTimeout] = React.useState(null);
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
    setSearchTimeout(timeout);
  };

  // Handle role filter change
  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  // Handle status change
  const handleStatusChange = async (user, newStatus) => {
    try {
      await updateUserStatus(user.id || user._id, newStatus);
      fetchUsers();
    } catch (err) {
      setError(err.message || "Failed to update user status");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  // Sort users
  const sortedUsers = React.useMemo(() => {
    if (!sortBy) return users;
    return [...users].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "createdAt") {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal || "").toLowerCase();
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }, [users, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Users className="h-8 w-8" />
            User & Role Management
          </h1>
          <p className="text-gray-400">
            Manage users, operators, and their roles. Only admins can access this page.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Create Operator
          </button>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => handleRoleFilterChange(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="User">Users</option>
              <option value="Operator">Operators</option>
              <option value="Admin">Admins</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-4" />
              <p className="text-gray-400">Loading users...</p>
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">
                {searchQuery || roleFilter
                  ? "No users found matching your filters"
                  : "No users found"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800 border-b border-gray-700">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50"
                        onClick={() => handleSort("fullName")}
                      >
                        Name {sortBy === "fullName" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50"
                        onClick={() => handleSort("isActive")}
                      >
                        Status {sortBy === "isActive" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50"
                        onClick={() => handleSort("createdAt")}
                      >
                        Created At {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {sortedUsers.map((user) => (
                      <tr
                        key={user.id || user._id}
                        className="hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">
                            {user.fullName || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{user.email || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <RoleBadge role={user.role || "User"} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge isActive={user.isActive !== false} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            {user.role !== "Admin" && (
                              <button
                                onClick={() =>
                                  setRoleChangeModal({ isOpen: true, user })
                                }
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                title="Change Role"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                setStatusChangeConfirm({
                                  isOpen: true,
                                  user,
                                  newStatus: !user.isActive,
                                })
                              }
                              className={`${
                                user.isActive
                                  ? "text-red-400 hover:text-red-300"
                                  : "text-green-400 hover:text-green-300"
                              } transition-colors`}
                              title={user.isActive ? "Deactivate" : "Activate"}
                            >
                              {user.isActive ? (
                                <UserX className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-800">
                {sortedUsers.map((user) => (
                  <div key={user.id || user._id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-medium">
                          {user.fullName || "N/A"}
                        </h3>
                        <p className="text-gray-400 text-sm">{user.email || "N/A"}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <RoleBadge role={user.role || "User"} />
                        <StatusBadge isActive={user.isActive !== false} />
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 mb-3">
                      Created: {formatDate(user.createdAt)}
                    </div>
                    <div className="flex items-center gap-2">
                      {user.role !== "Admin" && (
                        <button
                          onClick={() =>
                            setRoleChangeModal({ isOpen: true, user })
                          }
                          className="flex-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded text-sm transition-colors flex items-center justify-center gap-1"
                        >
                          <Edit2 className="h-3 w-3" />
                          Change Role
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setStatusChangeConfirm({
                            isOpen: true,
                            user,
                            newStatus: !user.isActive,
                          })
                        }
                        className={`flex-1 px-3 py-1.5 rounded text-sm transition-colors flex items-center justify-center gap-1 ${
                          user.isActive
                            ? "bg-red-600/20 hover:bg-red-600/30 text-red-300"
                            : "bg-green-600/20 hover:bg-green-600/30 text-green-300"
                        }`}
                      >
                        {user.isActive ? (
                          <>
                            <UserX className="h-3 w-3" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3 w-3" />
                            Activate
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateOperatorModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchUsers}
      />

      <RoleChangeModal
        isOpen={roleChangeModal.isOpen}
        onClose={() => setRoleChangeModal({ isOpen: false, user: null })}
        user={roleChangeModal.user}
        onSuccess={fetchUsers}
      />

      <ConfirmModal
        isOpen={statusChangeConfirm.isOpen}
        onClose={() => setStatusChangeConfirm({ isOpen: false, user: null, newStatus: null })}
        onConfirm={() => {
          if (statusChangeConfirm.user && statusChangeConfirm.newStatus !== null) {
            handleStatusChange(statusChangeConfirm.user, statusChangeConfirm.newStatus);
            setStatusChangeConfirm({ isOpen: false, user: null, newStatus: null });
          }
        }}
        title={statusChangeConfirm.newStatus ? "Activate User" : "Deactivate User"}
        message={
          statusChangeConfirm.user
            ? `Are you sure you want to ${
                statusChangeConfirm.newStatus ? "activate" : "deactivate"
              } ${statusChangeConfirm.user.fullName || statusChangeConfirm.user.email}?`
            : ""
        }
        confirmText={statusChangeConfirm.newStatus ? "Activate" : "Deactivate"}
        confirmColor="blue"
      />
    </div>
  );
}

