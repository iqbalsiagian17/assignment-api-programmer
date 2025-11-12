const { body, query, validationResult } = require('express-validator');

const topupValidator = [
  body('top_up_amount')
    .isInt({ min: 1 })
    .withMessage('Paramter amount hanya boleh angka dan tidak boleh lebih kecil dari 0')
    .toInt(),
];

const transactionValidator = [
  body('service_code')
    .notEmpty()
    .withMessage('Service code is required')
    .trim(),
];

const historyValidator = [
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a positive number')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limit must be a positive number')
    .toInt(),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({
      status: 102,
      message: firstError.msg,
      data: null
    });
  }
  next();
};

module.exports = {
  topupValidator,
  transactionValidator,
  historyValidator,
  validate
};