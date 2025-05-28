const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');
const auth = require('../middleware/auth');

// Auth routes
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);

// Profile routes (protected)
router.get('/:email/profile', auth, controller.getProfile);
router.put('/:email/profile', auth, controller.updateProfile);

module.exports = router;
