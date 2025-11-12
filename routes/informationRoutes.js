const express = require('express');
const router = express.Router();
const informationController = require('../controllers/informationController');
const authMiddleware = require('../middleware/auth');

router.get('/banner', informationController.getBanners);

router.get('/services', authMiddleware, informationController.getServices);

module.exports = router;