const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Register new user
router.post('/register', userController.register);

// Login and receive JWT tokens
router.post('/login', userController.login);

// Refresh token
router.post('/refresh', userController.refresh);

// Logout (optional endpoint for client-side token clearing)
router.post('/logout', userController.logout);

module.exports = router;
