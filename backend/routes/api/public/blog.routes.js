const express = require('express');
const router = express.Router();
const blogController = require('../../../controllers/blog.controller');

// Public routes - no authentication required
router.get("/blogs", blogController.getPublishedBlogs);
router.get("/blogs/:slug", blogController.getBlogBySlug);

module.exports = router;
