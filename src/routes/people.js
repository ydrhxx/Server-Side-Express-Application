const express = require('express');
const router = express.Router();
const peopleController = require('../controllers/peopleController');

// Route: GET /people/:id
router.get('/:id', peopleController.getPerson);

module.exports = router;
