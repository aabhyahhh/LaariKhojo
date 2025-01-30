const express = require("express");
const router = express.Router();

require("../authController");
console.log("hi");
const { registerValidator, loginValidator } = require("../helpers/validator");

const auth = require("../middlewares/authMiddleware");

// Import authController
const authController = require("../authController");

// Use authController.registerUser properly
router.post("/register", registerValidator, authController.registerUser);
router.post("/login", loginValidator, authController.loginUser);

//authenticating routes
router.get("/profile", auth, authController.getProfile);

module.exports = router;
