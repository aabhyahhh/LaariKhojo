const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const registerUser = require('../controllers/authController'); // Assuming your controller is in a separate file 


exports.registerValidator = [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail({
        gmail_remove_dots: true
    }),
    check('password', 'Password is required').not().isEmpty(),
    check('contactNumber', 'Enter valid 10-digit number').not().isEmpty(),
    check('mapsLink', 'Enter the link for your Laari location').not().isEmpty(),
];

exports.loginValidator = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({
        gmail_remove_dots: true
    }),
    check('password', 'Password is required').not().isEmpty(),
];
