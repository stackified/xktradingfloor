const mongoose = require('mongoose');
const { addFormatFlag } = require('../utils/contentFormat');
const Schema = mongoose.Schema;

const EventSchema = new Schema(
    {
        title: { type: String, required: true },
        description: String,
        excerpt: String, // Short description
        type: { type: String, enum: ['campus', 'online'], default: 'online' },
        dateTime: Date, // Combined date and time, stored as UTC
        // B17: optional end (multi-day expos), the event's IANA time zone
        // (e.g. "Asia/Dubai"; the frontend derives "GST" from it), and place.
        endDateTime: Date,
        timeZone: String,
        city: String,
        country: String,
        location: String, // venue
        region: String,
        organizerName: String,
        externalUrl: String,
        category: String,
        price: { type: Number, default: 0 }, // lowest ticket price when ticketTiers is set
        // B30: prices in the event's own currency, with its own ticket types.
        currency: { type: String, default: "USD" },
        ticketTiers: [{
            _id: false,
            name: { type: String, maxlength: 60 },
            price: { type: Number, min: 0 },
            fullPrice: { type: Number, min: 0 }, // struck-through price when on sale
            notes: { type: String, maxlength: 200 },
        }],
        // B15: featured events lead the slider on the Events page.
        isFeatured: { type: Boolean, default: false },
        seats: { type: Number, default: 0 },
        featuredImage: String,
        imageThumb: String, // B8: 640 px-wide thumbnail for cards
        freebiesIncluded: [String],
        adminId: { type: Schema.Types.ObjectId, ref: 'user' },
        // Legacy: leads now live in the EventRegistration collection (B16) and
        // are never sent on event responses.
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

// B14: "html" when description is a designed page.
addFormatFlag(EventSchema, "description", "descriptionFormat");

EventSchema.index({ dateTime: 1 });
EventSchema.index({ endDateTime: 1 });
EventSchema.index({ isFeatured: 1, category: 1 });

const EventModel = mongoose.model('event', EventSchema);
module.exports = EventModel;