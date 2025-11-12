const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  registrationValidator,
  loginValidator,
  updateProfileValidator,
  validate
} = require('../validators/membershipValidator');

router.post('/registration', registrationValidator, validate, membershipController.registration);

router.post('/login', loginValidator, validate, membershipController.login);

router.get('/profile', authMiddleware, membershipController.getProfile);

router.put('/profile/update', authMiddleware, updateProfileValidator, validate, membershipController.updateProfile);

router.put('/profile/image', authMiddleware,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          status: 102,
          message: 'Format Image tidak sesuai',
          data: null
        });
      }
      next();
    });
  },
  membershipController.updateProfileImage
);

module.exports = router;