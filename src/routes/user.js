const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST /user/register
router.post('/register', userController.register);

// POST /user/login
router.post('/login', userController.login);

// (You can add refresh, logout, profile, etc. later!)

module.exports = router;
