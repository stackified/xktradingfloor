const express = require("express");
const router = express.Router();
const marketingController = require("../../controllers/marketing.controller");
const pdfUpload = require("../../middleware/file-upload.middleware");

// Bulk Email with Excel Upload
router.post(
    "/send-bulk-email",
    pdfUpload.fileUpload("email_list", ["excel", "csv"], [
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
router.get("/drafts", marketingController.listDrafts);
router.get("/drafts/:id", marketingController.getDraft);
router.put("/drafts/:id", marketingController.updateDraft);
router.delete("/drafts/:id", marketingController.deleteDraft);

// Recipient lists: upload once, send later (B12)
router.post(
    "/recipients/upload",
    pdfUpload.fileUpload("email_list", ["excel", "csv"], [{ name: "file", maxCount: 1 }]),
    marketingController.uploadRecipients
);
router.get("/recipients", marketingController.listRecipients);
router.post("/recipients/:batchId/send", marketingController.sendToRecipients);

module.exports = router;
