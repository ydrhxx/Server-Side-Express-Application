const express = require('express');
const router = express.Router();
const moviesController = require('../controllers/moviesController');

// GET /movies/search — list of movies with filters + pagination
router.get('/search', moviesController.search);

// GET /movies/data/:imdbID — single movie by IMDb ID
router.get('/data/:imdbID', moviesController.getMovieById);

module.exports = router;
