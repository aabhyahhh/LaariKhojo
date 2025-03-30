// vendorSchema.js
const mongoose = require('mongoose');

const operatingHoursSchema = new mongoose.Schema({
  openTime: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // Validates HH:mm format
  },
  closeTime: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // Validates HH:mm format
  },
  days: [{
    type: Number,
    min: 0,
    max: 6,
    required: true
  }]
});

module.exports = mongoose.model('Operating Hours', operatingHoursSchema);
