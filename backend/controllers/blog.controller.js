const BlogModel = require("../models/blog.model");
const UserModel = require("../models/user.model");
const dayjs = require("dayjs");
const crypto = require("crypto");
const r2 = require("../helpers/r2.helper");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/response");
const { getPagination, getPaginationData, escapeRegex, isValidObjectId } = require("../utils/fn");
const { sanitizeHtml } = require("../utils/sanitizeHtml");
const emailService = require("../services/email.service");
const environment = require("../utils/environment");
const constants = require("../utils/constants");
const { slugify, ensureUniqueSlug } = require("../utils/blogSlug");
const { BLOG_CATEGORIES, findBlogCategory } = require("../utils/blogCategories");

// One category per post, from the agreed nine (B18): `category` holds the
// display name and `categorySlug` the URL slug; `categories` mirrors it for
// older readers. Returns an error message for a category outside the list.
const normalizeCategoryFields = (data) => {
    const raw = data.category !== undefined
        ? data.category
        : (Array.isArray(data.categories) ? data.categories[0] : data.categories);
    if (raw === undefined) return null;
    if (raw === null || String(raw).trim() === "") {
        delete data.category;
        delete data.categories;
        return null;
    }
    const category = findBlogCategory(raw);
    if (!category) {
        return `Category must be one of: ${BLOG_CATEGORIES.map((c) => c.name).join(", ")}.`;
    }
    data.category = category.name;
    data.categorySlug = category.slug;
    data.categories = [category.name];
    return null;
};

// ?category= accepts a slug or a name. Posts not yet migrated are matched on
// their old free-text values too.
const categoryClause = (value) => {
    const category = findBlogCategory(value);
    if (!category) return { $or: [{ category: value }, { categories: { $in: [value] } }] };
    return {
        $or: [
            { categorySlug: category.slug },
            { category: category.name },
            { categories: { $in: [category.name] } },
        ],
    };
};

const syncCoverImage = (data) => {
    if (data.featuredImage && !data.coverImage) {
        data.coverImage = data.featuredImage;
    } else if (data.coverImage && !data.featuredImage) {
        data.featuredImage = data.coverImage;
    }
    return data;
};

// slugify and ensureUniqueSlug live in utils/blogSlug.js (shared with the
// slug back-fill script, B10).

const transformBlogForResponse = (blog) => {
    const b = blog?.toObject ? blog.toObject() : { ...blog };
    if (!b.coverImage && b.featuredImage) {
        b.coverImage = b.featuredImage;
    }
    b.updatedAt = b.updatedAt || b.createdAt;
    // Viewer identifiers are only used to count views; never send them.
    delete b.viewedBy;
    return b;
};

const isStaff = (user) =>
    Boolean(user) && [constants.roles.admin, constants.roles.operator].includes(user.role);

// Whole minutes at ~220 words per minute, from stored HTML. <style> and
// <script> blocks are dropped first so a designed post's CSS isn't counted.
const readingMinutes = (html) => {
    const words = String(html || '')
        .replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&[a-z#0-9]+;/gi, ' ')
        .split(/\s+/)
        .filter(Boolean).length;
    return words ? Math.max(1, Math.round(words / 220)) : null;
};

const buildPublishedBlogQuery = ({ category, tag, search, featured }) => {
    const query = {
        status: "published",
        isDeleted: false,
    };
    const and = [];

    if (category) {
        and.push(categoryClause(category));
    }
    if (tag) {
        query.tags = { $in: [tag] };
    }
    if (featured === "true") {
        query.isFeatured = true;
    }
    if (search) {
        const searchTerm = escapeRegex(search);
        and.push({
            $or: [
                { title: { $regex: searchTerm, $options: "i" } },
                { excerpt: { $regex: searchTerm, $options: "i" } },
                { metaTitle: { $regex: searchTerm, $options: "i" } },
                { metaDescription: { $regex: searchTerm, $options: "i" } },
            ],
        });
    }
    if (and.length) {
        query.$and = and;
    }

    return query;
};

const buildAdminBlogQuery = ({ status, category, tag, search, role, userId }) => {
    const query = { isDeleted: false };
    const and = [];

    if (role === "User" || role !== "Admin") {
        query.author = userId;
    }

    if (status) {
        query.status = status;
    }
    if (category) {
        and.push(categoryClause(category));
    }
    if (tag) {
        query.tags = { $in: [tag] };
    }
    if (search) {
        const searchTerm = escapeRegex(search);
        and.push({
            $or: [
                { title: { $regex: searchTerm, $options: "i" } },
                { excerpt: { $regex: searchTerm, $options: "i" } },
                { content: { $regex: searchTerm, $options: "i" } },
                { metaTitle: { $regex: searchTerm, $options: "i" } },
            ],
        });
    }
    if (and.length) {
        query.$and = and;
    }

    return query;
};

// Helper function to get unique viewer identifier
const getViewerIdentifier = (req) => {
    // If user is logged in, use their user ID
    if (req.user && req.user._id) {
        return `user_${req.user._id}`;
    }
    // Otherwise, use IP address + User-Agent for anonymous users
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    // Create a hash-like identifier from IP and User-Agent
    const identifier = crypto.createHash('md5').update(`${ip}_${userAgent}`).digest('hex');
    return `anon_${identifier}`;
};

const RESTRICTED_FIELDS = [
    // 'status', // Users need to be able to change status (draft/published)
    'publishedAt',
    'isFeatured',
    'isFlagged',
    'flagReason',
    'flagAdditionalDetails',
    'flaggedAt',
    'flaggedBy',
    'views',
    'viewedBy',
    'isDeleted',
    'author'
];

// Admin/User: Create blog post
exports.createBlog = async (req, res) => {
    try {
        const { _id: userId, role } = req.user;

        // Handle featured image upload
        let featuredImage = "";
        if (req?.files?.featuredImage) {
            featuredImage = req.files.featuredImage[0];
            const pathN = featuredImage?.path;
            const npathN = pathN.replaceAll("\\", "/");
            featuredImage.path = npathN;

            // Upload to Cloudflare R2
            const url = await r2.uploadPublic(featuredImage?.path, `${featuredImage?.filename}`, `Blogs`);
            featuredImage = url;
        }

        // Handle additional images
        let images = [];
        if (req?.files?.images && Array.isArray(req.files.images)) {
            for (const image of req.files.images) {
                const pathN = image?.path;
                const npathN = pathN.replaceAll("\\", "/");
                image.path = npathN;
                const url = await r2.uploadPublic(image?.path, `${image?.filename}`, `Blogs`);
                images.push(url);
            }
        }

        const blogData = { ...req.body };
        const categoryError = normalizeCategoryFields(blogData);
        if (categoryError) return sendErrorResponse(res, categoryError, 400, true, true);
        syncCoverImage(blogData);
        if (blogData.content !== undefined) blogData.content = sanitizeHtml(blogData.content);

        // For regular users, filter out restricted fields and enforce draft status
        if (role === "User") {
            RESTRICTED_FIELDS.forEach(field => {
                delete blogData[field];
            });
            blogData.status = 'draft';
        }

        blogData.author = userId || null;
        blogData.featuredImage = featuredImage || blogData.featuredImage || null;
        if (images.length > 0) {
            blogData.images = images;
        }
        syncCoverImage(blogData);
        blogData.slug = await ensureUniqueSlug(blogData.title, blogData.slug);

        if (blogData.status === 'published' && role !== "User") {
            blogData.publishedAt = new Date();
        }

        const blog = new BlogModel(blogData);
        const savedBlog = await blog.save();

        // Send Notification to all active users if published
        if (savedBlog.status === 'published') {
            (async () => {
                try {
                    const users = await UserModel.find({ isActive: true, isDeleted: false }, 'email');
                    for (const user of users) {
                        emailService.sendBlogNotification(user.email, {
                            articleUrl: `${environment.frontendUrl}/blog/${savedBlog.slug || savedBlog._id}`
                        }).catch(err => console.error(`Blog notification failed for ${user.email}:`, err));
                    }
                } catch (err) {
                    console.error("Failed to send blog notifications:", err);
                }
            })();
        }

        return sendSuccessResponse(res, {
            message: role === "User"
                ? "Blog post created successfully as draft"
                : "Blog post created successfully",
            data: transformBlogForResponse(savedBlog)
        }, 201);
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Public: Get published blogs (list with pagination + filters)
exports.getAllPublishedBlogs = async (req, res) => {
    try {
        const {
            page,
            size,
            limit,
            search,
            category,
            tag,
            featured,
        } = req.query;

        const pageSize = size || limit;
        const { limit: perPage, offset } = getPagination(page, pageSize);
        const query = buildPublishedBlogQuery({ category, tag, search, featured });

        // Content is read only to work out reading time; it is dropped from
        // the list response. Author email stays private on this public route.
        const blogs = await BlogModel.find(query)
            .populate('author', 'fullName profileImage')
            .sort({ publishedAt: -1, updatedAt: -1, createdAt: -1 })
            .skip(offset)
            .limit(perPage)
            .select('-viewedBy');

        const totalItems = await BlogModel.countDocuments(query);
        const transformed = blogs.map((blog) => {
            const b = transformBlogForResponse(blog);
            b.readingMinutes = readingMinutes(b.content);
            delete b.content;
            return b;
        });

        // Published posts per category slug, for the category cards (B18).
        const countRows = await BlogModel.aggregate([
            { $match: { status: "published", isDeleted: false } },
            { $group: { _id: "$category", count: { $sum: 1 } } },
        ]);
        const categoryCounts = Object.fromEntries(BLOG_CATEGORIES.map((c) => [c.slug, 0]));
        for (const row of countRows) {
            const category = findBlogCategory(row._id);
            if (category) categoryCounts[category.slug] += row.count;
        }

        return sendSuccessResponse(res, {
            ...getPaginationData({ count: totalItems, docs: transformed }, page, perPage),
            categoryCounts,
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Admin/User: Get all blogs (with filters)
exports.getAllBlogs = async (req, res) => {
    try {
        const { _id: userId, role } = req.user;
        const {
            page,
            size,
            limit,
            search,
            category: categoryQuery,
            tag: tagQuery,
        } = req.query;
        const { status, category: categoryBody, tag: tagBody } = req.body || {};

        const category = categoryQuery || categoryBody;
        const tag = tagQuery || tagBody;
        const pageSize = size || limit;
        const { limit: perPage, offset } = getPagination(page, pageSize);
        const query = buildAdminBlogQuery({
            status,
            category,
            tag,
            search,
            role,
            userId,
        });

        const blogs = await BlogModel.find(query)
            .populate('author', 'fullName email profileImage')
            .sort({ updatedAt: -1, createdAt: -1 })
            .skip(offset)
            .limit(perPage)
            .select('-content -viewedBy');

        const totalItems = await BlogModel.countDocuments(query);
        const transformed = blogs.map(transformBlogForResponse);

        return sendSuccessResponse(
            res,
            getPaginationData({ count: totalItems, docs: transformed }, page, perPage)
        );

    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Admin/Public: Get single blog by ID
exports.getBlogById = async (req, res) => {
    try {
        const { blogid } = req.params;
        if (!isValidObjectId(blogid)) {
            return sendErrorResponse(res, "Blog post not found", 404, true, true);
        }
        // Public route (no req.user): published posts only. Signed-in users
        // also see their own drafts; Admin/Operator see everything (B4).
        const query = { _id: blogid, isDeleted: false };
        if (!isStaff(req.user)) {
            query.$or = [{ status: "published" }];
            if (req.user?._id) query.$or.push({ author: req.user._id });
        }
        const blog = await BlogModel.findOne(query)
            .populate('author', isStaff(req.user) ? 'fullName email profileImage' : 'fullName profileImage');

        if (!blog) {
            return sendErrorResponse(res, "Blog post not found", 404, true, true);
        }

        // Get unique identifier for this viewer
        const viewerId = getViewerIdentifier(req);

        // Check if this viewer has already viewed this blog
        const hasViewed = blog.viewedBy && blog.viewedBy.some(
            view => view.identifier === viewerId
        );

        // Only increment views if this is a new viewer
        if (!hasViewed) {
            // Initialize viewedBy array if it doesn't exist
            if (!blog.viewedBy) {
                blog.viewedBy = [];
            }

            // Add this viewer to the viewedBy array
            blog.viewedBy.push({
                identifier: viewerId,
                viewedAt: new Date()
            });

            // Increment view count
            blog.views += 1;
            await blog.save();
        }

        return sendSuccessResponse(res, { data: transformBlogForResponse(blog) });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Public: Get blog by slug
exports.getBlogBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const blog = await BlogModel.findOne({
            slug,
            status: 'published',
            isDeleted: false
        })
            .populate('author', 'fullName profileImage');

        if (!blog) {
            return sendErrorResponse(res, "Blog post not found", 404, true, true);
        }

        // Get unique identifier for this viewer
        const viewerId = getViewerIdentifier(req);

        // Check if this viewer has already viewed this blog
        const hasViewed = blog.viewedBy && blog.viewedBy.some(
            view => view.identifier === viewerId
        );

        // Only increment views if this is a new viewer
        if (!hasViewed) {
            // Initialize viewedBy array if it doesn't exist
            if (!blog.viewedBy) {
                blog.viewedBy = [];
            }

            // Add this viewer to the viewedBy array
            blog.viewedBy.push({
                identifier: viewerId,
                viewedAt: new Date()
            });

            // Increment view count
            blog.views += 1;
            await blog.save();
        }

        return sendSuccessResponse(res, { data: transformBlogForResponse(blog) });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Admin/User: Update blog
exports.updateBlog = async (req, res) => {
    try {
        const { blogid } = req.params;
        const { _id: userId, role } = req.user;
        const updateData = { ...req.body };
        if (updateData.content !== undefined) updateData.content = sanitizeHtml(updateData.content);

        // Fetch blog first to check existence and for image merging
        const blog = await BlogModel.findOne({ _id: blogid, isDeleted: false });

        if (!blog) {
            return sendErrorResponse(res, "Blog post not found", 404, true, true);
        }

        // Handle featured image upload
        if (req?.files?.featuredImage) {
            const featuredImage = req.files.featuredImage[0];
            const pathN = featuredImage?.path;
            const npathN = pathN.replaceAll("\\", "/");
            featuredImage.path = npathN;

            // Upload to Cloudflare R2
            const url = await r2.uploadPublic(featuredImage?.path, `${featuredImage?.filename}`, `Blogs`);
            updateData.featuredImage = url;
        }

        // Handle additional images
        if (req?.files?.images && Array.isArray(req.files.images)) {
            let images = [];
            for (const image of req.files.images) {
                const pathN = image?.path;
                const npathN = pathN.replaceAll("\\", "/");
                image.path = npathN;
                const url = await r2.uploadPublic(image?.path, `${image?.filename}`, `Blogs`);
                images.push(url);
            }
            // Merge with existing images if any
            if (blog.images && blog.images.length > 0) {
                updateData.images = [...blog.images, ...images];
            } else {
                updateData.images = images;
            }
        }

        // For regular users: verify ownership and filter restricted fields
        if (role === "User") {
            // Verify that the user owns this blog
            if (blog.author.toString() !== userId.toString()) {
                return sendErrorResponse(res, "You are not authorized to update this blog post", 403, true, true);
            }

            // Filter out restricted fields. A User may take their own post
            // back to draft, but only Admin/Operator publish (B3).
            const fieldsToRemove = RESTRICTED_FIELDS.filter(field => field !== 'status');
            fieldsToRemove.forEach(field => {
                delete updateData[field];
            });
            if (updateData.status !== undefined && updateData.status !== 'draft') {
                delete updateData.status;
            }

            // If user is publishing/unpublishing, handle publishedAt
            if (updateData.status === 'published' && blog.status !== 'published') {
                updateData.publishedAt = new Date();
            } else if (updateData.status === 'draft') {
                updateData.publishedAt = null;
            }
        } else {
            // Admin operations
            // If status is being changed to published, set publishedAt
            if (updateData.status === 'published' && blog.status !== 'published') {
                updateData.publishedAt = new Date();
            }

            // Handle flagging fields (admin only)
            if (updateData.flagReason !== undefined) {
                // Validate flag reason if provided
                if (updateData.flagReason) {
                    const validReasons = ['Spam', 'Inappropriate Content', 'Misinformation', 'Duplicate Content', 'Other'];
                    if (!validReasons.includes(updateData.flagReason)) {
                        return sendErrorResponse(res, `Invalid flag reason. Must be one of: ${validReasons.join(', ')}`, 400, true, true);
                    }
                    // Set flagging information
                    updateData.isFlagged = true;
                    updateData.flaggedAt = new Date();
                    if (req.user && req.user._id) {
                        updateData.flaggedBy = req.user._id;
                    }
                } else {
                    // If flagReason is set to null/empty, unflag the blog
                    updateData.isFlagged = false;
                    updateData.flagReason = null;
                    updateData.flagAdditionalDetails = null;
                    updateData.flaggedAt = null;
                    updateData.flaggedBy = null;
                }
            }
        }

        const categoryError = normalizeCategoryFields(updateData);
        if (categoryError) return sendErrorResponse(res, categoryError, 400, true, true);
        syncCoverImage(updateData);
        if (updateData.title || updateData.slug) {
            updateData.slug = await ensureUniqueSlug(
                updateData.title || blog.title,
                updateData.slug || blog.slug,
                blog._id
            );
        }

        Object.assign(blog, updateData);
        const updatedBlog = await blog.save();

        // Send Notification if status changed to published
        if (updateData.status === 'published' && blog.status !== 'published') {
            (async () => {
                try {
                    const users = await UserModel.find({ isActive: true, isDeleted: false }, 'email');
                    for (const user of users) {
                        emailService.sendBlogNotification(user.email, {
                            articleUrl: `${environment.frontendUrl}/blog/${updatedBlog.slug || updatedBlog._id}`
                        }).catch(err => console.error(`Blog notification failed for ${user.email}:`, err));
                    }
                } catch (err) {
                    console.error("Failed to send blog notifications:", err);
                }
            })();
        }

        return sendSuccessResponse(res, {
            message: "Blog post updated successfully",
            data: transformBlogForResponse(updatedBlog)
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Admin/User: Delete blog (soft delete)
exports.deleteBlog = async (req, res) => {
    try {
        const { blogid } = req.params;
        const { _id: userId, role } = req.user;

        const query = { _id: blogid, isDeleted: false };

        // Users can only delete their own blogs
        if (role === "User") {
            query.author = userId;
        }

        const blog = await BlogModel.findOne(query);

        if (!blog) {
            return sendErrorResponse(res,
                role === "User"
                    ? "Blog post not found or you don't have access to it"
                    : "Blog post not found",
                404, true, true
            );
        }

        blog.isDeleted = true;
        await blog.save();

        return sendSuccessResponse(res, {
            message: "Blog post deleted successfully"
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Admin: Permanently delete blog
exports.permanentDeleteBlog = async (req, res) => {
    try {
        const { blogid } = req.params;
        const blog = await BlogModel.findByIdAndDelete(blogid);

        if (!blog) {
            return sendErrorResponse(res, "Blog post not found", 404, true, true);
        }

        return sendSuccessResponse(res, {
            message: "Blog post permanently deleted"
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};