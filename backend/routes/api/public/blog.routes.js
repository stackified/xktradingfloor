const express = require('express');
const router = express.Router();
const blogController = require('../../../controllers/blog.controller');
const blogCommentController = require('../../../controllers/blogComment.controller');
const optionalAuthentication = require('../../../middleware/optionalAuthentication.middleware');

router.get('/getpublishedblogs', blogController.getAllPublishedBlogs);
// Optional sign-in: authors can still open their own drafts here.
router.get('/:blogid/getblogbyid', optionalAuthentication, blogController.getBlogById);
router.get('/:slug/getblogbyslug', blogController.getBlogBySlug);
router.get('/:blogid/comments', blogCommentController.getComments);

module.exports = router;