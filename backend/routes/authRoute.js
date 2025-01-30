const express = require('express');
const router= express.Router(); 


const{ registerValidator, loginValidator } = require('../helpers/validator');

const auth = require('../middlewares/authMiddleware');

// Import authController
const authController = require('../controllers/authController');

// Use authController.registerUser properly
router.post('/register', registerValidator, authController.registerUser);
router.post('/login', loginValidator, authController.loginUser);

//authenticating routes
router.get('/profile', auth, authController.getProfile);

module.exports = router;