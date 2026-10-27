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
    // PDF, images, Excel and CSV, 10 MB each (B26).
    fileUpload.fileUpload("verified-trader-proofs", ["pdf", "image", "excel", "csv"], [
        { name: "brokerStatements", maxCount: 5 },
        { name: "payoutProofs", maxCount: 5 },
    ]),
    userProfileController.applyForVerifiedTrader
);
// B23 point 4: a verified trader adds a payout with a private proof.
router.post(
    "/verified-trader/payouts",
    fileUpload.fileUpload("verified-trader-payouts", ["pdf", "image"], [
        { name: "proof", maxCount: 1 },
    ]),
    userProfileController.submitPayout
);

module.exports = router;
