const { body, validationResult } = require('express-validator');

const registrationValidator = [
  body('email')
    .isEmail()
    .withMessage('Paramter email tidak sesuai format')
    .normalizeEmail(),
  body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .trim(),
  body('last_name')
    .notEmpty()
    .withMessage('Last name is required')
    .trim(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password length minimal 8 karakter'),
];

const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Paramter email tidak sesuai format')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password length minimal 8 karakter'),
];

const updateProfileValidator = [
  body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .trim(),
  body('last_name')
    .notEmpty()
    .withMessage('Last name is required')
    .trim(),
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
  registrationValidator,
  loginValidator,
  updateProfileValidator,
  validate
};