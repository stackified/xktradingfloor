const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Reader comments on a published blog post. Plain text only: the frontend
// renders `content` as text, never as HTML.
const BlogCommentSchema = new Schema(
    {
        blog: { type: Schema.Types.ObjectId, ref: 'blogpost', required: true, index: true },
        author: { type: Schema.Types.ObjectId, ref: 'user', required: true },
        content: { type: String, required: true, trim: true, maxlength: 2000 },
        isDeleted: { type: Boolean, default: false },
        deletedBy: { type: Schema.Types.ObjectId, ref: 'user' },
        deletedAt: { type: Date },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

BlogCommentSchema.index({ blog: 1, isDeleted: 1, createdAt: -1 });

module.exports = mongoose.model('blogcomment', BlogCommentSchema);
