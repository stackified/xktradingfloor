const express = require("express");
const router = express.Router();
const marketingController = require("../../controllers/marketing.controller");
const pdfUpload = require("../../middleware/file-upload.middleware");

// Bulk Email with Excel Upload
router.post(
    "/send-bulk-email",
    pdfUpload.fileUpload("email_list", ["excel", "xlsx"], [
        {
            name: "file",
            maxCount: 1,
        },
    ]),
    marketingController.sendBulkEmail
);

// Campaign History
router.get("/campaign-history", marketingController.getCampaignHistory);

// Email Drafts
router.post("/drafts", marketingController.saveDraft);

module.exports = router;
