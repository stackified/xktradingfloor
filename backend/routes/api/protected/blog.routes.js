const express = require('express');
const router = express.Router();
const blogController = require('../../../controllers/blog.controller');
const blogCommentController = require('../../../controllers/blogComment.controller');
const { commentLimiter } = require('../../../middleware/rateLimit.middleware');
const pdfUpload = require("../../../middleware/file-upload.middleware");

router.post('/addblog',
    pdfUpload.fileUpload(
        "blogs",
        ["pdf", "image"],
        [{
            name: "featuredImage",
            maxCount: 1
        },
        {
            name: "images",
            maxCount: 4,
        },
        ]
    ),
    blogController.createBlog);

router.post('/getmyblogs', blogController.getAllBlogs);

router.get('/:blogid/getblogbyid', blogController.getBlogById);

router.put('/:blogid/updateblog',
    pdfUpload.fileUpload(
        "blogs",
        ["pdf", "image"],
        [{
            name: "featuredImage",
            maxCount: 1
        },
        {
            name: "images",
            maxCount: 4,
        },
        ]
    ),
    blogController.updateBlog);

router.delete('/:blogid/deleteblog', blogController.deleteBlog);

// Comments (reading them is public, see routes/api/public/blog.routes.js)
router.post('/:blogid/comments', commentLimiter, blogCommentController.addComment);
router.delete('/comments/:commentid', blogCommentController.deleteComment);

module.exports = router;