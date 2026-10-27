const express = require('express');
const router = express.Router();
const registrationController = require('../../../controllers/eventRegistration.controller');

// Event registration leads (B16). Mounted Admin-only in admin/index.js:
// Operators must not see or export leads.
router.get('/', registrationController.listLeads);
router.get('/export.csv', registrationController.exportLeadsCsv);

module.exports = router;
