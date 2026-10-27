// Content format flag (B14): "html" for designed pages (the frontend's
// data-xk-design marker), "rich" for normal rich text. Kept in sync on every
// save of the field it describes.
const formatOf = (html) => (/data-xk-design/.test(String(html || "")) ? "html" : "rich");

// Adds `<flagField>` to a schema and keeps it in step with `<sourceField>`.
function addFormatFlag(schema, sourceField, flagField) {
    schema.add({ [flagField]: { type: String, enum: ["rich", "html"], default: "rich" } });
    schema.pre("save", function syncFormat(next) {
        if (this.isNew || this.isModified(sourceField)) this[flagField] = formatOf(this[sourceField]);
        next();
    });
}

module.exports = { formatOf, addFormatFlag };
