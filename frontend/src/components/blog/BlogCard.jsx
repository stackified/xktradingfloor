import React from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import ImageWithFallback from "../shared/ImageWithFallback.jsx";

function BlogCard({ post, onClick, isLocked = false, onLockClick }) {
  const handleClick = () => {
    if (isLocked && onLockClick) {
      onLockClick();
    } else if (!isLocked && onClick) {
      onClick();
    }
  };

  return (
    <motion.div
      whileHover={!isLocked ? { y: -4, scale: 1.01 } : {}}
      className={`card overflow-hidden shadow-lg shadow-blue-500/10 ${
        isLocked ? "cursor-pointer opacity-75" : "cursor-pointer"
      }`}
      onClick={handleClick}
    >
      <div className="h-40 w-full bg-muted relative">
        {isLocked ? (
          <>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center">
                <Lock className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-xs text-white font-semibold">
                  Locked Content
                </p>
              </div>
            </div>
            <ImageWithFallback
              src={post.image}
              fallback="/assets/placeholder.jpg"
              alt={post.title}
              className="h-full w-full object-cover blur-sm"
              useDynamicFallback={true}
            />
          </>
        ) : (
          <ImageWithFallback
            src={post.image}
            fallback="/assets/placeholder.jpg"
            alt={post.title}
            className="h-full w-full object-cover"
            useDynamicFallback={true}
          />
        )}
      </div>
      <div className="card-body">
        <div className="text-xs text-blue-300">{post.category}</div>
        <h3 className="font-semibold mt-1">{post.title}</h3>
        <div className="text-xs text-gray-400 mt-1">
          {post.author} • {post.date} • {post.readTime}
        </div>
        {isLocked ? (
          <p className="text-sm text-gray-400 mt-2 italic">
            Login to view full content
          </p>
        ) : (
          <p className="text-sm text-gray-300 mt-2 line-clamp-2">
            {post.excerpt}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default BlogCard;
