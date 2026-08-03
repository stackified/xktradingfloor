const express = require('express');
const router = express.Router();
const userController = require('../../../controllers/user.controller');
const userProfileController = require('../../../controllers/userProfile.controller');

// User management
router.get('/getallusers', userController.getAllUsers);
router.post('/addAdminUser', userController.addAdminUser);
router.put('/:userId/updaterole', userController.updateUserRole);
router.put('/:userId/updatestatus', userController.updateUserStatus);

// Verified trader admin flow
router.get('/verified-trader/applications', userProfileController.listVerifiedTraderApplications);
router.post('/verified-trader/invite', userProfileController.inviteVerifiedTrader);
router.post('/verified-trader/:userId/schedule-call', userProfileController.scheduleVerifiedTraderCall);
router.post('/verified-trader/:userId/decide', userProfileController.decideVerifiedTraderApplication);

module.exports = router;