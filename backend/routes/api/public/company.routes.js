const express = require("express");
const router = express.Router();
const companyController = require('../../../controllers/company.controller');

router.post("/getallcompanies", companyController.getAllApprovedCompanies);
router.get("/:companyId/getcompanybyid", companyController.getApprovedCompanyById);

module.exports = router;
