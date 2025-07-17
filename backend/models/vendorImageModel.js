const mongoose = require('mongoose');

const vendorImageSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String, // stores filename or URL
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['display', 'business'],
    required: true
  }
});

module.exports = mongoose.model('VendorImage', vendorImageSchema); 