import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getUserCookie } from "../../utils/cookies.js";
import { Plus, FileText } from "lucide-react";

function BlogHero() {
  const navigate = useNavigate();
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || getUserCookie();

  const handleWriteBlog = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    // Determine route based on role (case-insensitive check)
    const userRole = user.role?.toLowerCase();
    if (userRole === "admin") {
      navigate("/admin/blogs/create");
    } else if (userRole === "operator" || userRole === "subadmin") {
      navigate("/operator/blogs/create");
    } else {
      navigate("/blogs/create");
    }
  };

  const handleManageBlog = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    // Determine route based on role (case-insensitive check)
    const userRole = user.role?.toLowerCase();
    if (userRole === "admin") {
      navigate("/admin/blogs");
    } else if (userRole === "operator" || userRole === "subadmin") {
      navigate("/operator/blogs");
    } else {
      navigate("/blogs/my-blogs");
    }
  };

  return (
    <section className="relative overflow-hidden bg-black">
      {/* <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent pointer-events-none" /> */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 text-center relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl"
        >
          Insights & <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">Market Analysis</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-3 text-sm sm:text-base text-gray-300 max-w-3xl mx-auto"
        >
          Stay ahead of the markets with in-depth research, tutorials, and
          expert opinions.
        </motion.p>
        <div className="mt-5 flex items-center justify-center gap-3 relative z-20">
          <button
            type="button"
            onClick={handleWriteBlog}
            className="btn btn-primary rounded-full flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Write Blog
          </button>
          {user && (
            <button
              type="button"
              onClick={handleManageBlog}
              className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-white/90 text-sm font-medium shadow-sm hover:bg-white/10 hover:border-white/20 hover:text-white hover:scale-105 hover:shadow-blue-500/10 transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <FileText className="h-4 w-4 text-gray-400 group-hover:text-blue-300 transition-colors" />
              <span className="relative z-10">Manage Blog</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default BlogHero;
