const express = require('express');
const router = express.Router();
const reviewController = require('../../../controllers/review.controller');
const pdfUpload = require('../../../middleware/file-upload.middleware');

// Create a review
router.post(
    '/addReview',
    pdfUpload.fileUpload('reviews', ['image'], [{ name: 'screenshot', maxCount: 1 }]),
    reviewController.createReview
);

// Update a review
router.put(
    '/:reviewId',
    pdfUpload.fileUpload('reviews', ['image'], [{ name: 'screenshot', maxCount: 1 }]),
    reviewController.updateReview
);

// Delete a review
router.delete('/:reviewId', reviewController.deleteReview);

module.exports = router;