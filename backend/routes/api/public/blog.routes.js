const express = require('express');
const router = express.Router();
const blogController = require('../../../controllers/blog.controller');
const blogCommentController = require('../../../controllers/blogComment.controller');

router.get('/getpublishedblogs', blogController.getAllPublishedBlogs);
router.get('/:blogid/getblogbyid', blogController.getBlogById);
router.get('/:slug/getblogbyslug', blogController.getBlogBySlug);
router.get('/:blogid/comments', blogCommentController.getComments);

module.exports = router;