const express = require('express');
const router = express.Router();
const userController = require('../../../controllers/user.controller');

// Add Operator API
router.post('/addAdminUser', userController.addAdminUser);

module.exports = router;