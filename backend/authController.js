const User = require("./models/userModel");

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

    const { name, email, password } = req.body;

    const isExistUser = await User.findOne({ email });

    if (isExistUser) {
      return res.status(409).json({
        success: false,
        msg: "Email already exists!",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
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
      msg: "Registration Error",
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
    const isPasswordMatch = await bcrypt.compare(password, userData.password);

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
    const userData = await User.findOne({ _id:user_id });

    return res.status(200).json({
      success: true,
      msg: 'Profile Data',
      data: userData
    });
  } 
  catch (error) {
    return res.status(400).json({
      success: false,
      msg:'User Profile Error',
      error: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
};

////////////////    User Profile     ///////////////////
