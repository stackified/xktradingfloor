const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema(
    {
        title: { type: String, required: true },
        name: { type: String },
        description: String,
        price: { type: Number, required: true },
        stock: { type: Number, default: 0 },
        images: [String],
        image: String,
        sku: String,
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const ProductModel = mongoose.model('product', ProductSchema);
module.exports = ProductModel;