const express = require("express");
const router = express.Router();
const companyController = require("../../../controllers/company.controller");
const pdfUpload = require("../../../middleware/file-upload.middleware");

router.post(
  "/request",
  pdfUpload.fileUpload(
    "companies",
    ["pdf", "image"],
    [
      {
        name: "logo",
        maxCount: 1,
      },
    ]
  ),
  companyController.requestCompanyAddition
);

// Get company by ID - requires read permission
router.get(
  "/:companyId/getcompanybyid",
  companyController.getCompanyById
);

module.exports = router;

