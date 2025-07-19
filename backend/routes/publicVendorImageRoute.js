const express = require('express');
const router = express.Router();
const vendorImageController = require('../controllers/admin/vendorImageController');

// Public endpoints (no auth, no isAdmin)
router.get('/vendor-images/:vendorId', vendorImageController.getVendorImages);
router.get('/display-picture/:vendorId', vendorImageController.getDisplayPicture);

module.exports = router; 