const express = require('express');
const router = express.Router();

// Import the controller and validator
const vendorImageController = require('../controllers/admin/vendorImageController');

const auth = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/isAdmin');

// Only keep vendor image routes below
// Upload carousel image for vendor
router.post('/upload-vendor-image', auth, isAdmin, vendorImageController.uploadVendorImage);
// Upload or update display picture for vendor
router.post('/upload-display-picture', auth, isAdmin, vendorImageController.uploadDisplayPicture);
// Get all images for a vendor
router.get('/vendor-images/:vendorId', auth, isAdmin, vendorImageController.getVendorImages);
// Get display picture for a vendor
router.get('/display-picture/:vendorId', auth, isAdmin, vendorImageController.getDisplayPicture);
// Delete a business image
router.delete('/vendor-image/:imageId', auth, isAdmin, vendorImageController.deleteBusinessImage);
// Delete display picture for a vendor
router.delete('/display-picture/:vendorId', auth, isAdmin, vendorImageController.deleteDisplayPicture);

// Export the router for use in app.js or other modules
module.exports = router;
