const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventSchema = new Schema(
    {
        title: { type: String, required: true },
        description: String,
        excerpt: String, // Short description
        type: { type: String, enum: ['campus', 'online'], default: 'online' },
        dateTime: Date, // Combined date and time
        location: String,
        price: { type: Number, default: 0 },
        seats: { type: Number, default: 0 },
        featuredImage: String,
        freebiesIncluded: [String],
        adminId: { type: Schema.Types.ObjectId, ref: 'user' },
        registrations: [{
            userId: { type: Schema.Types.ObjectId, ref: 'user' },
            name: String,
            email: String,
            phone: String,
            registeredAt: { type: Date, default: Date.now }
        }],
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const EventModel = mongoose.model('event', EventSchema);
module.exports = EventModel;