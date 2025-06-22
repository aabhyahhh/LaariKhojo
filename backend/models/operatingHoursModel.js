// vendorSchema.js
const mongoose = require('mongoose');

const operatingHoursSchema = new mongoose.Schema({
  openTime: {
    type: String,
    required: true,
    match: /^([01]?\d|2[0-3]):[0-5]\d$/ // Validates 24-hour format e.g., "09:00", "18:30"
  },
  closeTime: {
    type: String,
    required: true,
    match: /^([01]?\d|2[0-3]):[0-5]\d$/ // Validates 24-hour format e.g., "21:00", "02:30"
  },
  days: [{
    type: Number,
    min: 0,
    max: 6,
    required: true
  }]
});

module.exports = mongoose.model('Operating Hours', operatingHoursSchema);
