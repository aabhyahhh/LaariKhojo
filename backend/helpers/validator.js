const { body, validationResult } = require('express-validator');

// Register Validator Middleware
const registerValidator = [
    body('name', 'Name is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail().normalizeEmail({
        gmail_remove_dots: true
    }),
    body('password', 'Password is required').not().isEmpty(),
    body('contactNumber', 'Enter valid 10-digit number').not().isEmpty(),
    body('mapsLink', 'Enter the link for your Laari location').not().isEmpty(),
];

// Login Validator Middleware
const loginValidator = [
    body('email', 'Please include a valid email').isEmail().normalizeEmail({
        gmail_remove_dots: true
    }),
    body('password', 'Password is required').not().isEmpty(),
];

// Validation Result Middleware
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            msg: "Validation error",
            errors: errors.array()
        });
    }
    next();
};

module.exports = {
    registerValidator,
    loginValidator,
    validateRequest
};