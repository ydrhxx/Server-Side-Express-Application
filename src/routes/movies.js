const express = require('express');
const router = express.Router();
const moviesController = require('../controllers/moviesController');

router.get('/search', moviesController.search);

module.exports = router;
