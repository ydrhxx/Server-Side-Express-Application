// Import express and create a router instance
const express = require('express');
const router = express.Router();

// Import JWT authentication middleware
const authenticateJWT = require('../middleware/auth');

// Import the controller that handles person-related logic
const controller = require('../controllers/peopleController');

// GET /people/:id (secured and fully handled by controller)
router.get('/:id', authenticateJWT, controller.getPerson);


// Export the router so it can be used in the main Express application
module.exports = router;
