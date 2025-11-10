const express = require('express');
const router = express.Router();
const informationController = require('../controllers/informationController');
const authMiddleware = require('../middleware/auth');

// Public route - no authentication required
router.get('/banner', informationController.getBanners);

// Private route - authentication required
router.get('/services', authMiddleware, informationController.getServices);

module.exports = router;