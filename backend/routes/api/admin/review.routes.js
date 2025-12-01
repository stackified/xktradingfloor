const express = require('express');
const router = express.Router();
const reviewController = require('../../../controllers/review.controller');

router.post('/addReview', reviewController.createReview);
router.get('/:userId/getreviewsbyusers', reviewController.getReviewsByUserId);
// router.get('/reviews/:id', reviewController.getReviewById);
// router.put('/reviews/:id', reviewController.updateReview);
// router.put('/reviews/:id/status', reviewController.updateReviewStatus);
router.delete('/:reviewId/deletereview', reviewController.deleteReview);

module.exports = router;