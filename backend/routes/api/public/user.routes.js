const express = require("express");
const router = express.Router();
const userProfileController = require("../../../controllers/userProfile.controller");

router.get("/verified-traders", userProfileController.listVerifiedTraders);
router.get("/:userId", userProfileController.getPublicProfile);

module.exports = router;