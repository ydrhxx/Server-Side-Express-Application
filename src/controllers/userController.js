const knex = require('../db/knex');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load secrets from .env
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret';

// Helper: create JWT
function generateTokens(email, bearerExpiresIn = 600, refreshExpiresIn = 86400) {
  const accessToken = jwt.sign({ email }, ACCESS_TOKEN_SECRET, { expiresIn: bearerExpiresIn });
  const refreshToken = jwt.sign({ email }, REFRESH_TOKEN_SECRET, { expiresIn: refreshExpiresIn });
  return { accessToken, refreshToken };
}

// POST /user/register
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: true, message: 'Email and password are required.' });

    const existingUser = await knex('users').where({ email }).first();
    if (existingUser)
      return res.status(409).json({ error: true, message: 'Email already registered.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    await knex('users').insert({ email, password: hashedPassword });

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
};

// POST /user/login
exports.login = async (req, res) => {
  try {
    const { email, password, bearerExpiresInSeconds, refreshExpiresInSeconds } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: true, message: 'Email and password required.' });

    const user = await knex('users').where({ email }).first();
    if (!user)
      return res.status(401).json({ error: true, message: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: true, message: 'Invalid credentials.' });

    const tokens = generateTokens(email, bearerExpiresInSeconds || 600, refreshExpiresInSeconds || 86400);
    res.status(200).json(tokens);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
};

// POST /user/refresh
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: true, message: 'Refresh token required.' });

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) return res.status(401).json({ error: true, message: 'Invalid or expired refresh token.' });

      const tokens = generateTokens(decoded.email);
      res.status(200).json(tokens);
    });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
};

// POST /user/logout (optional — used by frontend)
exports.logout = async (req, res) => {
  // Nothing to do on server unless you use token blacklisting
  res.status(200).json({ message: 'Logged out successfully.' });
};
