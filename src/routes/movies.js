// Import express and create a router instance
const express = require('express');
const router = express.Router();

// Import the controller that handles movie-related logic
const moviesController = require('../controllers/moviesController');

router.get('/search', moviesController.searchMovies);
router.get('/data/:imdbID', moviesController.getMovieById);

// Export the router to be used in your main Express app
module.exports = router;
