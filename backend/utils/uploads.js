const r2 = require("../helpers/r2.helper");

// Upload an optional single file field to the public bucket; "" when absent.
async function uploadOptionalPublic(req, field, folder) {
    const file = req?.files?.[field]?.[0];
    if (!file) return "";
    return r2.uploadPublic(file.path.replace(/\\/g, "/"), `${file.filename}`, folder);
}

module.exports = { uploadOptionalPublic };
