const express = require("express");
const router = express.Router();

require("../controllers/authController");
const { registerValidator, loginValidator } = require("../helpers/validator");

const auth = require("../middlewares/authMiddleware");
console.log("2");

// Import authController
const authController = require("../controllers/authController");
console.log("3");


// Use authController.registerUser properly
router.post("/register", registerValidator, authController.registerUser);
console.log("4");
router.post("/login", loginValidator, authController.loginUser);
console.log("5");


//authenticating routes
router.get("/profile", auth, authController.getProfile);

router.get("/all-users", authController.getAllUsers);
router.put("/update-profile",auth, authController.updateProfile);
module.exports = router;
