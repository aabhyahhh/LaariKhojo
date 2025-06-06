const mongoose = require('mongoose');

const vendorLocationSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  location: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const VendorLocation = mongoose.model('VendorLocation', vendorLocationSchema);

module.exports = VendorLocation; 