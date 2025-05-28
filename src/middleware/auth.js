const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

module.exports = function authenticateJWT(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ error: true, message: "Authorization header ('Bearer token') not found" });
  }
  const token = h.slice(7);
  jwt.verify(token, SECRET, (err, payload) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: true, message: 'JWT token has expired' });
      } else {
        return res.status(401).json({ error: true, message: 'Invalid JWT token' });
      }
    }
    req.user = payload;
    next();
  });
};
