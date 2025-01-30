const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
  let token;

  // Check for token in different locations
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(403).json({
      success: false,
      msg: 'A token is required for authentication',
    });
  }

  try {
    const decodedData = jwt.verify(token, process.env.ACCESS_SECRET_TOKEN);
    req.user = decodedData.user;
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: 'Invalid Token',
      error: error.message,
    });
  }

  return next();
};

module.exports = verifyToken;