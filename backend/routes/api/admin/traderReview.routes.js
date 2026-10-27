const express = require('express');
const router = express.Router();
const traderReviewController = require('../../../controllers/traderReview.controller');

// B23 point 5: moderation of reviews of verified traders (Admin/Operator).
router.get('/', traderReviewController.listTraderReviewsForModeration);
router.patch('/:reviewId', traderReviewController.moderateTraderReview);

module.exports = router;
