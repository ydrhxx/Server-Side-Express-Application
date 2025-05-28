const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// === Auth Controllers ===
const controller = require('../controllers/userController');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);

// === Profile Routes ===
// GET /user/:email/profile
router.get('/:email/profile', auth, async (req, res) => {
  try {
    const { email } = req.params;

    // Only allow users to access their own profile
    if (req.user.email !== email) {
      return res.status(403).json({
        error: true,
        message: 'Forbidden: user does not have access to this profile'
      });
    }

    const user = await knex('users')
      .select('email', 'firstName', 'lastName', 'dob', 'address')
      .where({ email })
      .first();

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

// PUT /user/:email/profile
router.put('/:email/profile', auth, async (req, res) => {
  const { email } = req.params;

  if (req.user.email !== email) {
    return res.status(403).json({
      error: true,
      message: 'Forbidden: user does not have access to this profile'
    });
  }

  const { firstName, lastName, dob, address } = req.body;

  // Validation
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

  const date = new Date(dob);
  if (isNaN(date.getTime()) || !dob.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return res.status(400).json({
      error: true,
      message: 'Invalid input: dob must be a real date in format YYYY-MM-DD.'
    });
  }

  if (date > new Date()) {
    return res.status(400).json({
      error: true,
      message: 'Invalid input: dob must be a date in the past.'
    });
  }

  try {
    await knex('users').where({ email }).update({ firstName, lastName, dob, address });

    const updated = await knex('users')
      .select('email', 'firstName', 'lastName', 'dob', 'address')
      .where({ email })
      .first();

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

module.exports = router;
