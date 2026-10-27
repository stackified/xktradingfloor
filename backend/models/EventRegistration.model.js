const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// One lead per person per event (B16). Kept out of the event document so it
// never appears on public event responses and can be listed and exported.
const EventRegistrationSchema = new Schema(
    {
        eventId: { type: Schema.Types.ObjectId, ref: "event", required: true },
        // Title and date at the time of sign-up, so the lead still reads right
        // if the event is renamed or moved.
        eventTitle: { type: String, required: true },
        eventDate: Date,
        fullName: { type: String, required: true, trim: true, maxlength: 120 },
        email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
        phone: { type: String, trim: true, maxlength: 40, default: "" },
        country: { type: String, trim: true, maxlength: 80, required: true },
        company: { type: String, trim: true, maxlength: 160, default: "" },
        consent: { type: Boolean, default: false },
        consentAt: Date,
        userId: { type: Schema.Types.ObjectId, ref: "user", default: null },
        registeredAt: { type: Date, default: Date.now },
    },
    { timestamps: true, versionKey: false }
);

EventRegistrationSchema.index({ eventId: 1, email: 1 }, { unique: true });
EventRegistrationSchema.index({ registeredAt: -1 });

module.exports = mongoose.model("EventRegistration", EventRegistrationSchema);
