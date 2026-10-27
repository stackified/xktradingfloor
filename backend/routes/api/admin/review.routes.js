const express = require('express');
const router = express.Router();
const reviewController = require('../../../controllers/review.controller');
const pdfUpload = require('../../../middleware/file-upload.middleware');

router.post('/addReview', pdfUpload.fileUpload('reviews', ['image'], [{ name: 'screenshot', maxCount: 1 }]),
    reviewController.createReview);
router.get('/:userId/getreviewsbyusers', reviewController.getReviewsByUserId);
// router.get('/reviews/:id', reviewController.getReviewById);
// router.put('/reviews/:id', reviewController.updateReview);
// router.put('/reviews/:id/status', reviewController.updateReviewStatus);
router.delete('/:reviewId/deletereview', reviewController.deleteReview);
// Moderation (Admin/Operator): B19 verify, B11 hide and pin.
router.patch('/:reviewId/verify', reviewController.verifyReview);
router.patch('/:reviewId/hide', reviewController.hideReview);
router.patch('/:reviewId/pin', reviewController.pinReview);

module.exports = router;