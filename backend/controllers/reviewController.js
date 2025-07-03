const Review = require('../models/reviewModel');

// Add a new review
const addReview = async (req, res) => {
  try {
    const { vendorId, name, email, rating, comment } = req.body;
    if (!vendorId || !name || !email || !rating) {
      return res.status(400).json({ success: false, msg: 'Missing required fields.' });
    }
    const review = new Review({ vendorId, name, email, rating, comment });
    await review.save();
    return res.status(201).json({ success: true, msg: 'Review added successfully!', data: review });
  } catch (error) {
    return res.status(500).json({ success: false, msg: 'Error adding review', error: error.message });
  }
};

// Get reviews for a vendor (most recent first)
const getReviews = async (req, res) => {
  try {
    const { vendorId } = req.query;
    if (!vendorId) {
      return res.status(400).json({ success: false, msg: 'Missing vendorId.' });
    }
    const reviews = await Review.find({ vendorId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    return res.status(500).json({ success: false, msg: 'Error fetching reviews', error: error.message });
  }
};

module.exports = { addReview, getReviews }; 