import React from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Mail,
  DollarSign,
  Calendar,
} from "lucide-react";

/**
 * UserTable Component
 * Displays users in a table format with selection, pagination, and search
 */
function UserTable({
  users = [],
  selectedUsers = [],
  onSelectionChange,
  onUserClick,
  pagination,
  searchQuery = "",
  onSearchChange,
  loading = false,
}) {
  const [localSearch, setLocalSearch] = React.useState(searchQuery);

  // Debounce search
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onSearchChange?.(localSearch);
    }, 300);
    return () => clearTimeout(timeout);
  }, [localSearch, onSearchChange]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = users.map((user) => user.id || user._id).filter(Boolean);
      onSelectionChange([...new Set([...selectedUsers, ...allIds])]);
    } else {
      const currentIds = users.map((user) => user.id || user._id).filter(Boolean);
      onSelectionChange(selectedUsers.filter((id) => !currentIds.includes(id)));
    }
  };

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      onSelectionChange(selectedUsers.filter((id) => id !== userId));
    } else {
      onSelectionChange([...selectedUsers, userId]);
    }
  };

  const isAllSelected =
    users.length > 0 &&
    users.every((user) => {
      const id = user.id || user._id;
      return id && selectedUsers.includes(id);
    });

  const isIndeterminate =
    users.some((user) => {
      const id = user.id || user._id;
      return id && selectedUsers.includes(id);
    }) && !isAllSelected;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower === "completed") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    } else if (statusLower === "canceled") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
          <XCircle className="w-3 h-3 mr-1" />
          Canceled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-500/30">
        {status || "Unknown"}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Selection Info */}
      {selectedUsers.length > 0 && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-300">
            <strong>{selectedUsers.length}</strong> user{selectedUsers.length !== 1 ? "s" : ""} selected
          </p>
        </div>
      )}

      {/* Desktop Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No users found</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = isIndeterminate;
                        }}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Total Spend
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Joined At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.map((user) => {
                    const userId = user.id || user._id;
                    const isSelected = userId && selectedUsers.includes(userId);

                    return (
                      <tr
                        key={userId}
                        className={`hover:bg-gray-800/50 transition-colors ${
                          isSelected ? "bg-blue-500/10" : ""
                        } ${onUserClick ? "cursor-pointer" : ""}`}
                        onClick={() => onUserClick?.(user)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectUser(userId)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">
                            {user.name || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300 flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {user.email || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            {user.whopTitle || user.plan || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user.status || user.subscriptionStatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300 flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {formatCurrency(user.totalSpend)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-400 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(user.joinedAt)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-800">
              {users.map((user) => {
                const userId = user.id || user._id;
                const isSelected = userId && selectedUsers.includes(userId);

                return (
                  <div
                    key={userId}
                    className={`p-4 ${isSelected ? "bg-blue-500/10" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectUser(userId)}
                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                          />
                          <h3 className="text-white font-medium">
                            {user.name || "N/A"}
                          </h3>
                        </div>
                        <p className="text-gray-400 text-sm flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email || "N/A"}
                        </p>
                      </div>
                      {getStatusBadge(user.status || user.subscriptionStatus)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                      <div>
                        <span className="text-gray-500">Product:</span>{" "}
                        {user.whopTitle || user.plan || "N/A"}
                      </div>
                      <div>
                        <span className="text-gray-500">Spend:</span>{" "}
                        {formatCurrency(user.totalSpend)}
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Joined:</span>{" "}
                        {formatDate(user.joinedAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{" "}
            {Math.min(
              pagination.currentPage * pagination.itemsPerPage,
              pagination.totalItems
            )}{" "}
            of {pagination.totalItems} users
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-300">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserTable;

