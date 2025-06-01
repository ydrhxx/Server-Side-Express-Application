const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const moment = require('moment');

//Auth Controllers
const controller = require('../controllers/userController');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);

// Profile Routes

// GET /user/:email/profile
router.get('/:email/profile', async (req, res) => {
  try {
    const { email } = req.params;
    const authHeader = req.headers.authorization;
    let isSelf = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        isSelf = payload.email === email;
      } catch (err) {
        return res.status(403).json({ error: true, message: 'Invalid or expired token' });
      }
    }

    const user = await knex('users')
      .select('email', 'firstName', 'lastName', 'dob', 'address')
      .where({ email })
      .first();

    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    const response = {
    email: user.email,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null
    };

    if (isSelf) {
    response.dob = user.dob ? moment(user.dob).format('YYYY-MM-DD') : null;
    response.address = user.address ?? null;
    }


    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: true, message: 'Internal server error' });
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

  if (
    firstName === undefined ||
    lastName === undefined ||
    dob === undefined ||
    address === undefined
  ) {
    return res.status(400).json({
      error: true,
      message: 'Request body incomplete: firstName, lastName, dob and address are required.'
    });
  }

  if (
    typeof firstName !== 'string' ||
    typeof lastName !== 'string' ||
    typeof address !== 'string'
  ) {
    return res.status(400).json({
      error: true,
      message: 'Request body invalid: firstName, lastName and address must be strings only.'
    });
  }

  const validDate = moment(dob, 'YYYY-MM-DD', true);
  if (!validDate.isValid()) {
    return res.status(400).json({
      error: true,
      message: 'Invalid input: dob must be a real date in format YYYY-MM-DD.'
    });
  }

  if (validDate.isAfter(moment())) {
    return res.status(400).json({
      error: true,
      message: 'Invalid input: dob must be a date in the past.'
    });
  }

  try {
    const updatedCount = await knex('users').where({ email }).update({
      firstName,
      lastName,
      dob: validDate.format('YYYY-MM-DD'),
      address
    });

    if (updatedCount === 0) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    const updated = await knex('users')
      .select('email', 'firstName', 'lastName', 'dob', 'address')
      .where({ email })
      .first();

    return res.status(200).json({
      email: updated.email,
      firstName: updated.firstName ?? null,
      lastName: updated.lastName ?? null,
      dob: updated.dob ? moment(updated.dob).format('YYYY-MM-DD') : null,
      address: updated.address ?? null
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: true, message: 'Internal server error' });
  }
});

module.exports = router;
