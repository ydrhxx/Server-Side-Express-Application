const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'default-dev-secret';

module.exports = function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  // Missing or malformed header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found"
    });
  }

  const token = authHeader.slice(7); // Remove 'Bearer '

  jwt.verify(token, SECRET, (err, payload) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: true,
          message: 'JWT token has expired'
        });
      }

      return res.status(401).json({
        error: true,
        message: 'Invalid JWT token'
      });
    }

    // Token is valid
    req.user = payload;
    next();
  });
};
