const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'default-dev-secret';

module.exports = function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found"
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: true,
      message: 'Authorization header is malformed'
    });
  }

  const token = authHeader.slice(7);

  jwt.verify(token, SECRET, (err, payload) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: true, message: 'JWT token has expired' });
      } else {
        return res.status(401).json({ error: true, message: 'Invalid JWT token' });
      }
    }

    // Store user info on request
    req.user = payload;
    next();
  });
};
