const express = require('express');
const router = express.Router();

// Import the controller and validator
const { addPermission } = require('../controllers/admin/permissionController');
const { getPermissions } = require('../controllers/admin/permissionController');
const { deletePermission } = require('../controllers/admin/permissionController');
const { updatePermission } = require('../controllers/admin/permissionController');
const vendorImageController = require('../controllers/admin/vendorImageController');

const { Validator, deleteValidator, updateValidator } = require('../helpers/adminValidator');

const auth = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/isAdmin');

// Add Permission by Admin
router.post('/add-permission', auth, isAdmin, Validator, addPermission);

//Get Permissions from Admin
router.get('/get-permissions', auth, isAdmin, getPermissions);

//Delete Permission by Admin
router.post('/delete-permission', auth, isAdmin, deleteValidator, deletePermission);

//Update Permission by Admin
router.post('/update-permission', auth, isAdmin, updateValidator, updatePermission);

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
