const express = require("express");
const router = express.Router();
const userProfileController = require("../../../controllers/userProfile.controller");
const fileUpload = require("../../../middleware/file-upload.middleware");

router.get("/me", userProfileController.getMyProfile);
router.patch(
    "/me",
    fileUpload.fileUpload("profile-avatars", ["image"], [
        { name: "profileImage", maxCount: 1 },
    ]),
    userProfileController.updateMyProfile
);
router.post(
    "/verified-trader/apply",
    fileUpload.fileUpload("verified-trader-proofs", ["pdf", "image"], [
        { name: "brokerStatements", maxCount: 5 },
        { name: "payoutProofs", maxCount: 5 },
    ]),
    userProfileController.applyForVerifiedTrader
);

module.exports = router;
