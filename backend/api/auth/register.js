const { validationResult } = require('express-validator');
const { registerValidator, loginValidator, validateRequest } = require("../../helpers/validator");
const authController = require("../../controllers/authController");

// Register Route
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Run validation middleware
      await Promise.all(registerValidator.map(validation => validation.run(req)));
      
      // Check validation results
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          msg: "Validation error",
          errors: errors.array(),
        });
      }

      // Call registerUser controller
      await authController.registerUser(req, res);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ 
        success: false,
        error: 'Registration failed', 
        details: error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}