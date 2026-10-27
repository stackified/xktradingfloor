const express = require("express");
const router = express.Router();
const traderReviewController = require("../../../controllers/traderReview.controller");

// B23 point 5: approved reviews of a verified trader.
router.get("/:userId/reviews", traderReviewController.listTraderReviews);

module.exports = router;
