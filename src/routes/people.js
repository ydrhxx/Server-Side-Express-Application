const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/auth');
const controller = require('../controllers/peopleController');

// GET /people/:id (secured and fully handled by controller)
router.get('/:id', authenticateJWT, controller.getPerson);

module.exports = router;
