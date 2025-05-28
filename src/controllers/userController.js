const knex = require('../db/knex');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const SECRET = process.env.JWT_SECRET;

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: true, message: 'Email and password are required' });
    }

    const existing = await knex('users').where({ email }).first();
    if (existing) {
      return res.status(409).json({ error: true, message: 'Email is already registered' });
    }

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

exports.login = async (req, res) => {
  const { email, password } = req.body;

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

exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({
      error: true,
      message: 'Refresh token not provided.'
    });

  try {
    const payload = jwt.verify(refreshToken, SECRET);
    const newAccessToken = jwt.sign({ email: payload.email }, SECRET, { expiresIn: '10m' });

    return res.status(200).json({
      token: newAccessToken,
      token_type: 'Bearer',
      expires_in: 600
    });
  } catch {
    return res.status(403).json({
      error: true,
      message: 'Invalid refresh token.'
    });
  }
};

exports.logout = async (req, res) => {
  return res.status(200).json({
    message: 'Successfully logged out.'
    // If you want actual logout logic, consider using token blacklisting or DB invalidation
  });
};

exports.getProfile = async (req, res) => {
  const { email } = req.params;
  const user = await knex('users').where({ email }).first();

  if (!user) {
    return res.status(404).json({ error: true, message: 'User not found' });
  }

  // If the request is authenticated but not for the same user
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
    dob: req.user ? user.dob : undefined,
    address: req.user ? user.address : undefined
  });
};

exports.updateProfile = async (req, res) => {
  const { email } = req.params;
  let { firstName, lastName, dob, address } = req.body;

  // === Validation ===
  if (firstName === undefined || lastName === undefined || dob === undefined || address === undefined) {
    return res.status(400).json({
      error: true,
      message: 'Request body incomplete: firstName, lastName, dob and address are required.'
    });
  }

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