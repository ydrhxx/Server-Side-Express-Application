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
  if (!email) return res.status(400).json({ error: true, message: 'Email required' });

  const user = await knex('users').where({ email }).first();
  if (!user) return res.status(404).json({ error: true, message: 'User not found' });

  return res.status(200).json({
    email: user.email,
    firstName: user.firstName || null,
    lastName: user.lastName || null,
    dob: user.dob || null,
    address: user.address || null
  });
};

exports.updateProfile = async (req, res) => {
  try {
    const { email } = req.params;
    let { firstName, lastName, dob, address } = req.body;

    // Format and validate dob
    if (dob) {
      const formatted = moment(dob, moment.ISO_8601, true);
      if (!formatted.isValid()) {
        return res.status(400).json({ error: true, message: 'Invalid date format for dob' });
      }
      dob = formatted.format('YYYY-MM-DD');
    }

    const result = await knex('users')
      .where({ email })
      .update({ firstName, lastName, dob, address });

    if (result === 0) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
};