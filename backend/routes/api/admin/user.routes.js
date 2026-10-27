const express = require('express');
const router = express.Router();
const userController = require('../../../controllers/user.controller');
const userProfileController = require('../../../controllers/userProfile.controller');
const constants = require('../../../utils/constants');
const { authorization } = require('../../../middleware/authorization.middleware');
const adminOnly = authorization([constants.roles.admin]);

// User management
router.get('/getallusers', userController.getAllUsers);
// Creating staff accounts and changing roles/status: Admin only. An Operator
// could otherwise create an Admin account.
router.post('/addAdminUser', adminOnly, userController.addAdminUser);
router.put('/:userId/updaterole', adminOnly, userController.updateUserRole);
router.put('/:userId/updatestatus', adminOnly, userController.updateUserStatus);

// Verified trader admin flow
router.get('/verified-trader/applications', userProfileController.listVerifiedTraderApplications);
router.post('/verified-trader/invite', userProfileController.inviteVerifiedTrader);
router.post('/verified-trader/:userId/schedule-call', userProfileController.scheduleVerifiedTraderCall);
router.post('/verified-trader/:userId/decide', userProfileController.decideVerifiedTraderApplication);
// B23: edit an approved trader's stats; approve/reject submitted payouts.
router.patch('/verified-trader/:userId/stats', userProfileController.updateVerifiedTraderStats);
router.patch('/verified-trader/:userId/payouts/:payoutId', userProfileController.decidePayout);
// B28: remove a Verified Trader badge (Admin only).
router.post('/verified-trader/:userId/revoke', adminOnly, userProfileController.revokeVerifiedTrader);

module.exports = router;