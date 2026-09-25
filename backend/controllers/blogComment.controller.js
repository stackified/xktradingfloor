const mongoose = require("mongoose");
const BlogModel = require("../models/blog.model");
const BlogCommentModel = require("../models/blogComment.model");
const constants = require("../utils/constants");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/response");
const { getPagination, getPaginationData } = require("../utils/fn");

const MIN_LENGTH = 2;
const MAX_LENGTH = 2000;
// Public profile fields only; never expose email.
const AUTHOR_FIELDS = "fullName profileImage role";

const MODERATOR_ROLES = [constants.roles.admin, constants.roles.operator];

// Collapse runs of blank lines and strip control characters (keeps \n and \t).
const cleanContent = (value) =>
    String(value || "")
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        .replace(/\r\n?/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

const toResponse = (comment) => {
    const c = comment?.toObject ? comment.toObject() : { ...comment };
    return {
        _id: c._id,
        blog: c.blog,
        content: c.content,
        createdAt: c.createdAt,
        author: c.author
            ? {
                _id: c.author._id,
                fullName: c.author.fullName || "Member",
                profileImage: c.author.profileImage || "",
                role: c.author.role,
            }
            : { fullName: "Member" },
    };
};

const findPublishedBlog = (blogId) =>
    BlogModel.findOne({ _id: blogId, status: "published", isDeleted: { $ne: true } }).select("_id");

// Public: GET /api/blogs/:blogid/comments?page=&size=
exports.getComments = async (req, res) => {
    try {
        const { blogid } = req.params;
        if (!mongoose.isValidObjectId(blogid)) {
            return sendErrorResponse(res, "Invalid blog id", 400, true, true);
        }
        const size = Math.min(Math.max(+req.query.size || 20, 1), 50);
        const { limit, offset } = getPagination(req.query.page, size);
        const query = { blog: blogid, isDeleted: { $ne: true } };

        const [comments, totalItems] = await Promise.all([
            BlogCommentModel.find(query)
                .populate("author", AUTHOR_FIELDS)
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit),
            BlogCommentModel.countDocuments(query),
        ]);

        return sendSuccessResponse(
            res,
            getPaginationData({ count: totalItems, docs: comments.map(toResponse) }, req.query.page, limit)
        );
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Signed-in users: POST /api/blogs/:blogid/comments { content }
exports.addComment = async (req, res) => {
    try {
        const { blogid } = req.params;
        if (!mongoose.isValidObjectId(blogid)) {
            return sendErrorResponse(res, "Invalid blog id", 400, true, true);
        }
        const content = cleanContent(req.body?.content);
        if (content.length < MIN_LENGTH) {
            return sendErrorResponse(res, "Comment is too short.", 400, true, true);
        }
        if (content.length > MAX_LENGTH) {
            return sendErrorResponse(res, `Comments can be at most ${MAX_LENGTH} characters.`, 400, true, true);
        }

        const blog = await findPublishedBlog(blogid);
        if (!blog) {
            return sendErrorResponse(res, "Blog not found", 404, true, true);
        }

        const comment = await BlogCommentModel.create({
            blog: blog._id,
            author: req.user._id,
            content,
        });
        await comment.populate("author", AUTHOR_FIELDS);

        return sendSuccessResponse(res, { data: toResponse(comment) }, 201);
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Comment author, Admin or Operator: DELETE /api/blogs/comments/:commentid
exports.deleteComment = async (req, res) => {
    try {
        const { commentid } = req.params;
        if (!mongoose.isValidObjectId(commentid)) {
            return sendErrorResponse(res, "Invalid comment id", 400, true, true);
        }
        const comment = await BlogCommentModel.findOne({ _id: commentid, isDeleted: { $ne: true } });
        if (!comment) {
            return sendErrorResponse(res, "Comment not found", 404, true, true);
        }

        const isAuthor = String(comment.author) === String(req.user._id);
        const isModerator = MODERATOR_ROLES.includes(req.user.role);
        if (!isAuthor && !isModerator) {
            return sendErrorResponse(res, "You can only delete your own comments.", 403, true, true);
        }

        comment.isDeleted = true;
        comment.deletedBy = req.user._id;
        comment.deletedAt = new Date();
        await comment.save();

        return sendSuccessResponse(res, { message: "Comment deleted" });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};
