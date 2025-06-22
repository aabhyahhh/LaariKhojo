// vendorSchema.js
const mongoose = require('mongoose');

const operatingHoursSchema = new mongoose.Schema({
  openTime: {
    type: String,
    required: true,
    match: /^(0?[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/i // Validates 12-hour format e.g., "9:00 AM"
  },
  closeTime: {
    type: String,
    required: true,
    match: /^(0?[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/i // Validates 12-hour format e.g., "10:30 PM"
  },
  days: [{
    type: Number,
    min: 0,
    max: 6,
    required: true
  }]
});

module.exports = mongoose.model('Operating Hours', operatingHoursSchema);
