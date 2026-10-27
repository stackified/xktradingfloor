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
      { name: "logoThumb", maxCount: 1 }, // B8 thumbnail from the browser
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

