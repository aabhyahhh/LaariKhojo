const express = require('express');
const router = express.Router();

// Import the controller and validator
const { addPermission } = require('../admin/permissionController');
const { getPermissions } = require('../admin/permissionController');
const { deletePermission } = require('../admin/permissionController');
const { updatePermission } = require('../admin/permissionController');

const { Validator, deleteValidator, updateValidator } = require('../helpers/adminValidator');

const auth = require('../middlewares/authMiddleware');

// Add Permission by Admin
router.post('/add-permission', auth, Validator, addPermission);

//Get Permissions from Admin
router.get('/get-permissions', auth, getPermissions);

//Delete Permission by Admin
router.post('/delete-permission', auth, deleteValidator, deletePermission);

//Update Permission by Admin
router.post('/update-permission', auth, updateValidator, updatePermission);

// Export the router for use in app.js or other modules
module.exports = router;
