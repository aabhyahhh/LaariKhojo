const User = require("../models/userModel");

const { validationResult } = require("express-validator");

const bcrypt = require("bcrypt"); //decrypting password
const jwt = require("jsonwebtoken");

///////////////////    registerUser      ///////////////////

const registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation error",
        errors: errors.array(),
      });
    }

    
      const { name, email, password, contactNumber, mapsLink, operatingHours} = req.body;
  
      if (!contactNumber || !mapsLink || !operatingHours) {
        return res.status(409).json({
          success: false,
          msg: "Contact Number, Operating Hours & Location are required!",
        });
      }
  
      // Validate & Extract Coordinates from mapsLink
      const mapsRegex = /@([-+]?\d*\.\d+),([-+]?\d*\.\d+)/;
      const match = mapsLink.match(mapsRegex);
  
      if (!match) {
        return res.status(400).json({
          success: false,
          msg: "Invalid maps link! Please use a valid Google Maps link.",
        });
      }
  
      const latitude = parseFloat(match[1]);
      const longitude = parseFloat(match[2]);
  

    const isExistEmail = await User.findOne({ email });

    if (isExistEmail) {
      return res.status(409).json({
        success: false,
        msg: "Email already exists!",
      });
    }

    const hashedPassword = await bcrypt.hashSync(password, 10);
    const user = new User({
      name,
      email,
      contactNumber,
      mapsLink,
      password: hashedPassword,
      latitude, 
      longitude,
      operatingHours
    });

    const userData = await user.save();

    return res.status(201).json({
      success: true,
      msg: "Registered Successfully!",
      data: userData,
    });
  } catch (error) {
    console.error("Error registering user:", error);

    return res.status(400).json({
      success: false,
      msg: "Error registering user",
      error: error.message,
    });
  }
};

///////////////////    loginUser      ///////////////////

//access token for jwtwebtoken
const generateAccessToken = async (user) => {
  if (!process.env.ACCESS_SECRET_TOKEN) {
    throw new Error(
      "ACCESS_SECRET_TOKEN is not defined in the environment variables."
    );
  }
  return jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, { expiresIn: "2h" });
};

const loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation error",
        errors: errors.array(),
      });
    }

    //accepting response from api
    const { email, password } = req.body;

    const userData = await User.findOne({ email });

    if (!userData) {
      return res.status(400).json({
        success: false,
        msg: "Email and Password is incorrect!",
      });
    }

    //matching password with bcrypt
    const isPasswordMatch = await bcrypt.compareSync(password, userData.password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        msg: "Email and Password is incorrect!",
      });
    }

    //calling access token
    const accessToken = await generateAccessToken({ user: userData });

    //response for login api
    return res.status(200).json({
      success: true,
      msg: "Logged in successfully!",
      accessToken: accessToken,
      tokenType: "Bearer",
      data: userData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: "Login Error",
      error: error.message,
    });
  }
};

////////////////    User Profile     ///////////////////
const getProfile = async (req, res) => {
  try {
    const user_id = req.user._id;
    const userData = await User.findOne({ _id: user_id });

    if (!userData) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Laari Data",
      data: userData,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: "User Profile Error",
      error: error.message,
    });
  }
};

//////////////////   GET ALL USERS    //////////////////////
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude passwords
    return res.status(200).json({
      success: true,
      msg: "All Laari Vendors",
      data: users,
    });
  } catch (error) {
    return res.status(500).json({ success: false, msg: "Error fetching users", error: error.message });
  }
};

///////////////////           EDIT USER PROFILE            ///////////////////////
const updateProfile = async (req, res) => {
  try {
    // Check if req.user exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        msg: "Authentication required. Please log in.",
      });
    }
    
    const userId = req.user._id; // Get user ID from the authenticated request
    const { name, contactNumber, mapsLink, operatingHours } = req.body;

    // Check if the user exists
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: "User not found",
      });
    }

    // Validate & Extract Coordinates if mapsLink is updated
    let latitude = user.latitude;
    let longitude = user.longitude;

    if (mapsLink && mapsLink !== user.mapsLink) {
      const mapsRegex = /@([-+]?\d*\.\d+),([-+]?\d*\.\d+)/;
      const match = mapsLink.match(mapsRegex);

      if (!match) {
        return res.status(400).json({
          success: false,
          msg: "Invalid maps link! Please use a valid Google Maps link.",
        });
      }

      latitude = parseFloat(match[1]);
      longitude = parseFloat(match[2]);
    }

    // Update user details
    user.name = name || user.name;
    user.contactNumber = contactNumber || user.contactNumber;
    user.mapsLink = mapsLink || user.mapsLink;
    user.latitude = latitude;
    user.longitude = longitude;
    user.operatingHours = operatingHours || user.operatingHours;

    // Save the updated user data
    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      msg: "Profile updated successfully!",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({
      success: false,
      msg: "Error updating profile",
      error: error.message,
    });
  }
};


module.exports = {
  registerUser,
  loginUser,
  getProfile,
  getAllUsers, 
  updateProfile 
};
