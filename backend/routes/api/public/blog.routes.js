const express = require('express');
const router = express.Router();
const blogController = require('../../../controllers/blog.controller');

router.get('/getpublishedblogs', blogController.getAllPublishedBlogs);
router.get('/:blogid/getblogbyid', blogController.getBlogById);
router.get('/:slug/getblogbyslug', blogController.getBlogBySlug);

module.exports = router;