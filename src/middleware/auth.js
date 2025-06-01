// Load the jsonwebtoken library
const jwt = require('jsonwebtoken');

// Get the JWT secret from environment variables or use a default
const SECRET = process.env.JWT_SECRET || 'default-dev-secret';

// Middleware function to authenticate requests using JWT
module.exports = function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  // Check if the Authorization header exists and follows 'Bearer <token>' format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found"
    });
  }

  // Extract the token from the header
  const token = authHeader.split(' ')[1];

  try {
    // Verify the token using the secret key
    const payload = jwt.verify(token, SECRET);
    // Attach decoded payload to the request for downstream access
    req.user = payload;

    // Continue to the next middleware or route
    next();
  } catch (err) {
    // Handle token errors such as expiration or invalid signature
    return res.status(401).json({
      error: true,
      message: err.name === 'TokenExpiredError'
        ? 'JWT token has expired'
        : 'Invalid JWT token'
    });
  }
};
