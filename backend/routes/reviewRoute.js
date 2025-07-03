const express = require('express');
const router = express.Router();
const { addReview, getReviews } = require('../controllers/reviewController');

// Add a review
router.post('/reviews', addReview);

// Get reviews for a vendor
router.get('/reviews', getReviews);

module.exports = router; 