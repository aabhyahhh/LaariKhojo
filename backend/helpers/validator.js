const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const registerUser = require('../controllers/authController'); // Assuming your controller is in a separate file 

// Import and re-export time utilities to avoid circular dependency
const { parseTimeToMinutes, isVendorOpenNow } = require('./timeUtils');
exports.parseTimeToMinutes = parseTimeToMinutes;
exports.isVendorOpenNow = isVendorOpenNow;

exports.registerValidator = [
    check('name', 'Name is required').not().isEmpty(),
    
    check('email', 'Please include a valid email')
        .isEmail()
        .normalizeEmail({
            gmail_remove_dots: true
        }),
    
    check('password', 'Password is required').not().isEmpty(),
    
    check('contactNumber', 'Enter valid 10-digit number')
        .not().isEmpty()
        .matches(/^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/)
        .withMessage('Please enter a valid Indian mobile number'),
    
    check('mapsLink', 'Enter the link for your Laari location')
        .not().isEmpty()
        .matches(/^https:\/\/www\.google\.(com|co\.in)\/maps\/place\/.+/i)
        .withMessage('Please enter a valid Google Maps URL'),
    
    check('operatingHours.openTime', 'Opening time is required')
        .not().isEmpty()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Please provide a valid opening time (HH:MM)'),
    
    check('operatingHours.closeTime', 'Closing time is required')
        .not().isEmpty()
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Please provide a valid closing time (HH:MM)'),
    
    check('operatingHours.days', 'At least one operating day is required')
        .isArray()
        .not().isEmpty()
        .custom((days) => {
            const validDays = [0, 1, 2, 3, 4, 5, 6];
            return days.every(day => validDays.includes(Number(day)));
        })
        .withMessage('Operating days must be valid day indices (0-6, where 0 is Sunday)')
];

exports.loginValidator = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({
        gmail_remove_dots: true
    }),
    check('password', 'Password is required').not().isEmpty(),
];
