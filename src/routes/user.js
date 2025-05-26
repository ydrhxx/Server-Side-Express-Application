const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Login route
router.post('/login', userController.login);

// Register route (if needed)
router.post('/register', userController.register);

// Profile routes (if needed)
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Refresh token route (if needed)
router.post('/refresh', userController.refreshToken);

// Logout route (if needed)
router.post('/logout', userController.logout);

module.exports = router;
