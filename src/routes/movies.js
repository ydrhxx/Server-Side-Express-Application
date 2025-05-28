// src/routes/movies.js
const express = require('express');
const router = express.Router();
const moviesController = require('../controllers/moviesController');

// @route   GET /movies/search
// @desc    Search for movies by title, year, and pagination
// @access  Public
router.get('/search', moviesController.search);

module.exports = router;
