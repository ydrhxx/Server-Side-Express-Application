const knex = require('../db/knex'); // Import Knex database connection
const bcrypt = require('bcrypt'); // For hashing passwords
const jwt = require('jsonwebtoken'); // For generating and verifying JWTs
const moment = require('moment'); // For date formatting and validation

// Fallback JWT secret for development if not set in environment
const SECRET = process.env.JWT_SECRET || 'default-dev-secret';

/**
 * Register a new user with email and hashed password
 */
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: true, message: 'Email and password are required' });
    }

    // Check if user already exists
    const existing = await knex('users').where({ email }).first();
    if (existing) {
      return res.status(409).json({ error: true, message: 'Email is already registered' });
    }

    // Hash password and insert user
    const hashed = await bcrypt.hash(password, 10);
    await knex('users').insert({ email, password: hashed });

    return res.status(201).json({
      message: 'User registered successfully',
    });
  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
};

/**
 * Authenticate user, return access and refresh JWTs
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password)
    return res.status(400).json({
      error: true,
      message: 'Request body incomplete: email and password are required.'
    });

  const user = await knex('users').where({ email }).first();
  if (!user)
    return res.status(401).json({
      error: true,
      message: 'Incorrect email or password.'
    });

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.status(401).json({
      error: true,
      message: 'Incorrect email or password.'
    });

  // Generate access and refresh tokens
  const accessToken = jwt.sign({ email }, SECRET, { expiresIn: '10m' });
  const refreshToken = jwt.sign({ email }, SECRET, { expiresIn: '1d' });

  return res.status(200).json({
    bearerToken: {
      token: accessToken,
      token_type: 'Bearer',
      expires_in: 600
    },
    refreshToken: {
      token: refreshToken,
      token_type: 'Refresh',
      expires_in: 86400
    }
  });
};


/**
 * Refresh access and refresh tokens using a valid refresh token
 */

exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      error: true,
      message: 'Request body incomplete, refresh token required'
    });
  }

  try {
    const payload = jwt.verify(refreshToken, SECRET); // Will throw if expired or invalid

    const accessToken = jwt.sign({ email: payload.email }, SECRET, { expiresIn: '10m' });
    const newRefreshToken = jwt.sign({ email: payload.email }, SECRET, { expiresIn: '1d' });

    return res.status(200).json({
      bearerToken: {
        token: accessToken,
        token_type: 'Bearer',
        expires_in: 600
      },
      refreshToken: {
        token: newRefreshToken,
        token_type: 'Refresh',
        expires_in: 86400
      }
    });
  } catch (err) {
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
};

/**
 * Logout simply verifies the refresh token (in real systems, you'd blacklist it)
 */
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      error: true,
      message: 'Request body incomplete, refresh token required'
    });
  }

  try {
    jwt.verify(refreshToken, SECRET); 

    return res.status(200).json({
      error: false,
      message: 'Token successfully invalidated'
    });
  } catch (err) {
      if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: true, // THIS LINE IS CRITICAL
      message: 'JWT token has expired'
    });
    }
    return res.status(401).json({
      error: true,
      message: 'Invalid JWT token'
    });
  }
};

/**
 * Get user profile info (public or full if authenticated as that user)
 */
exports.getProfile = async (req, res) => {
  const { email } = req.params;
  const user = await knex('users').where({ email }).first();

  if (!user) {
    return res.status(404).json({ error: true, message: 'User not found' });
  }

  // Only allow full access if token email matches the profile
  if (req.user && req.user.email !== email) {
    return res.status(403).json({
      error: true,
      message: 'Forbidden: user does not have access to this profile'
    });
  }

  return res.status(200).json({
    email: user.email,
    firstName: user.firstName || null,
    lastName: user.lastName || null,
    dob: req.user ? user.dob || null : undefined,
    address: req.user ? user.address || null : undefined
  });
};

/**
 * Update user's profile data (only if user is authenticated and owns the profile)
 */
exports.updateProfile = async (req, res) => {
  const { email } = req.params;
  let { firstName, lastName, dob, address } = req.body;

  if (firstName === undefined || lastName === undefined || dob === undefined || address === undefined) {
    return res.status(400).json({
      error: true,
      message: 'Request body incomplete: firstName, lastName, dob and address are required.'
    });
  }

  // Validate input types
  if (typeof firstName !== 'string' || typeof lastName !== 'string' || typeof address !== 'string') {
    return res.status(400).json({
      error: true,
      message: 'Request body invalid: firstName, lastName and address must be strings only.'
    });
  }

  const formatted = moment(dob, 'YYYY-MM-DD', true);
  if (!formatted.isValid()) {
    return res.status(400).json({
      error: true,
      message: 'Invalid input: dob must be a real date in format YYYY-MM-DD.'
    });
  }

  const now = moment().startOf('day');
  if (formatted.isAfter(now)) {
    return res.status(400).json({
      error: true,
      message: 'Invalid input: dob must be a date in the past.'
    });
  }

  try {
    const result = await knex('users')
      .where({ email })
      .update({ firstName, lastName, dob: formatted.format('YYYY-MM-DD'), address });

    if (result === 0) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    // Return updated profile
    const updated = await knex('users')
      .select('email', 'firstName', 'lastName', 'dob', 'address')
      .where({ email })
      .first();

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
};
