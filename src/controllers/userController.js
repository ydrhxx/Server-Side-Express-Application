// src/controllers/userController.js
const knex = require('../db/knex');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Get user from DB
    const user = await knex('users').where({ email }).first();
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Check password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate tokens (dummy secret, replace in prod!)
    const bearerToken = jwt.sign({ id: user.id, email: user.email }, 'SECRET', { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user.id }, 'REFRESH_SECRET', { expiresIn: '7d' });

    return res.status(200).json({
      bearerToken: { token: bearerToken, token_type: 'Bearer', expires_in: 3600 },
      refreshToken: { token: refreshToken, expires_in: 604800 },
      user: { id: user.id, email: user.email }
    });
  } catch (err) {
    return res.status(500).json({ mess
