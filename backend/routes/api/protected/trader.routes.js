const express = require("express");
const router = express.Router();
const traderReviewController = require("../../../controllers/traderReview.controller");
const fileUpload = require("../../../middleware/file-upload.middleware");

// B23 point 5: reviews of verified traders (screenshot proof stays private).
const screenshotUpload = fileUpload.fileUpload("trader-review-proofs", ["image"], [{ name: "screenshot", maxCount: 1 }]);

router.post("/:userId/reviews", screenshotUpload, traderReviewController.createTraderReview);
router.patch("/reviews/:reviewId", screenshotUpload, traderReviewController.updateTraderReview);
router.delete("/reviews/:reviewId", traderReviewController.deleteTraderReview);

module.exports = router;
