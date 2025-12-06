const express = require("express");
const router = express.Router();
const companyController = require("../../../controllers/company.controller");

// Public routes - no authentication required
router.get("/companies", companyController.getPublicCompanies);

module.exports = router;
