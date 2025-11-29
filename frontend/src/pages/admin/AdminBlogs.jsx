import React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Plus } from "lucide-react";
import { BlogList } from "../../components/admin/blog/index.js";
import {
  fetchAllBlogs,
  deleteBlog,
  flagBlog,
  updateBlog,
  clearError,
} from "../../redux/slices/blogsSlice.js";
import { getUserCookie } from "../../utils/cookies.js";
import ProtectedRoute from "../../components/dashboard/ProtectedRoute.jsx";
import ConfirmModal from "../../components/shared/ConfirmModal.jsx";
import FlagModal from "../../components/shared/FlagModal.jsx";

function AdminBlogsContent() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { blogs, loading, error } = useSelector((state) => state.blogs);
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || getUserCookie();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [deleteModal, setDeleteModal] = React.useState({ isOpen: false, blogId: null });
  const [flagModal, setFlagModal] = React.useState({ isOpen: false, blogId: null });

  React.useEffect(() => {
    dispatch(fetchAllBlogs({ search: searchQuery, status: statusFilter }));
  }, [dispatch, searchQuery, statusFilter]);

  React.useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleEdit = (blogId) => {
    navigate(`/admin/blogs/edit/${blogId}`);
  };

  const handleDelete = (blogId) => {
    setDeleteModal({ isOpen: true, blogId });
  };

  const confirmDelete = async () => {
    if (!deleteModal.blogId) return;
    try {
      await dispatch(deleteBlog(deleteModal.blogId)).unwrap();
      dispatch(fetchAllBlogs({ search: searchQuery, status: statusFilter }));
    } catch (err) {
      // Error will be shown via Redux state
      console.error("Failed to delete blog:", err);
    }
  };

  const handleFlag = (blogId) => {
    setFlagModal({ isOpen: true, blogId });
  };

  const confirmFlag = async (reason, description) => {
    if (!flagModal.blogId) return;
    try {
      // Combine reason and description for backend
      const flagData = {
        reason,
        description: description || "",
      };
      await dispatch(flagBlog({ blogId: flagModal.blogId, flagType: reason, ...flagData })).unwrap();
      // Refresh the list
      dispatch(fetchAllBlogs({ search: searchQuery, status: statusFilter }));
    } catch (err) {
      console.error("Failed to flag blog:", err);
    }
  };

  const handleUnflag = async (blogId, flagType) => {
    // For now, we'll need to update the blog to remove the flag
    // This might need a backend endpoint
    try {
      // Refresh the list - the backend should handle unflagging
      dispatch(fetchAllBlogs({ search: searchQuery, status: statusFilter }));
    } catch (err) {
      console.error("Failed to unflag blog:", err);
    }
  };

  const handlePublish = async (blogId) => {
    try {
      const formData = new FormData();
      formData.append("status", "published");
      await dispatch(updateBlog({ blogId, formData })).unwrap();
      dispatch(fetchAllBlogs({ search: searchQuery, status: statusFilter }));
    } catch (err) {
      console.error("Failed to publish blog:", err);
    }
  };

  const handleUnpublish = async (blogId) => {
    try {
      const formData = new FormData();
      formData.append("status", "draft");
      await dispatch(updateBlog({ blogId, formData })).unwrap();
      dispatch(fetchAllBlogs({ search: searchQuery, status: statusFilter }));
    } catch (err) {
      console.error("Failed to unpublish blog:", err);
    }
  };

  return (
    <div className="bg-gray-950 text-white min-h-screen">
      <Helmet>
        <title>Blog Management | XK Trading Floor Admin</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Blog Management</h1>
            <p className="text-sm text-gray-400">
              Create, edit, and manage blog posts
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/blogs/create")}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New Blog
          </button>
        </div>

        {error && (
          <div className="card mb-6 border-red-500/50 bg-red-500/10">
            <div className="card-body text-red-300">{error}</div>
          </div>
        )}

        {/* Blog List */}
        <BlogList
          blogs={blogs}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onFlag={handleFlag}
          onUnflag={handleUnflag}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          canDelete
          canFlag
          canUnflag
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, blogId: null })}
        onConfirm={confirmDelete}
        title="Delete Blog"
        message="Are you sure you want to delete this blog? This action can be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Flag Modal */}
      <FlagModal
        isOpen={flagModal.isOpen}
        onClose={() => setFlagModal({ isOpen: false, blogId: null })}
        onConfirm={confirmFlag}
        title="Flag Blog Post"
      />
    </div>
  );
}

export default function AdminBlogs() {
  return (
    <ProtectedRoute role="admin">
      <AdminBlogsContent />
    </ProtectedRoute>
  );
}
