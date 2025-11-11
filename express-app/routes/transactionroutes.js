const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/auth');
const {
  topupValidator,
  transactionValidator,
  historyValidator,
  validate
} = require('../validators/transactionValidator');

// All transaction routes require authentication
router.get(
  '/balance',
  authMiddleware,
  transactionController.getBalance
);

router.post(
  '/topup',
  authMiddleware,
  topupValidator,
  validate,
  transactionController.topup
);

router.post(
  '/transaction',
  authMiddleware,
  transactionValidator,
  validate,
  transactionController.transaction
);

router.get(
  '/transaction/history',
  authMiddleware,
  historyValidator,
  validate,
  transactionController.getHistory
);

module.exports = router;