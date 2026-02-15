const express = require("express");
const router = express.Router();
const multer = require("multer");
const marketingController = require("../../controllers/marketing.controller");
const path = require("path");
const pdfUpload = require('../../middleware/file-upload.middleware');

router.post(
    "/send-bulk-email",
    pdfUpload.fileUpload(
        "email_list",
        ["excel", "xlsx"],
        [{
            name: "file",
            maxCount: 1
        },]
    ),
    marketingController.sendBulkEmail
);

module.exports = router;
