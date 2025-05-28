const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const controller = require('../controllers/userController');

// === Auth Routes ===
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);

// === Profile Routes ===

// GET /user/:email/profile — accessible to everyone, but returns limited fields if unauthenticated
router.get('/:email/profile', async (req, res) => {
  try {
    const { email } = req.params;

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

    // Try to decode the token if present
    let requesterEmail = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        requesterEmail = decoded.email;
      } catch (_) {
        // ignore invalid token
      }
    }

    const isSelf = requesterEmail === email;

    return res.status(200).json({
      email: user.email,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      dob: isSelf ? user.dob?.toISOString().split('T')[0] : undefined,
      address: isSelf ? user.address : undefined
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

// PUT /user/:email/profile — must be authenticated
router.put('/:email/profile', auth, async (req, res) => {
  const { email } = req.params;

  if (req.user.email !== email) {
    return res.status(403).json({
      error: true,
      message: 'Forbidden: user does not have access to this profile'
    });
  }

  const { firstName, lastName, dob, address } = req.body;

  if ([firstName, lastName, dob, address].some(x => x === undefined)) {
    return res.status(400).json({
      error: true,
      message: 'Request body incomplete: firstName, lastName, dob and address are required.'
    });
  }

  if ([firstName, lastName, address].some(x => typeof x !== 'string')) {
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
    const updateResult = await knex('users').where({ email }).update({
      firstName, lastName, dob, address
    });

    if (updateResult === 0) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    const updated = await knex('users')
      .select('email', 'firstName', 'lastName', 'dob', 'address')
      .where({ email })
      .first();

    return res.status(200).json({
      email: updated.email,
      firstName: updated.firstName || null,
      lastName: updated.lastName || null,
      dob: updated.dob?.toISOString().split('T')[0],
      address: updated.address
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

module.exports = router;
