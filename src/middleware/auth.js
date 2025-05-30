const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'default-dev-secret';

module.exports = function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found"
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({
      error: true,
      message: err.name === 'TokenExpiredError'
        ? 'JWT token has expired'
        : 'Invalid JWT token'
    });
  }
};
