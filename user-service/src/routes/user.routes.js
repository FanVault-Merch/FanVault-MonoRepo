const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const {
  getProfile,
  createProfile,
  updateProfile,
  addAddress,
  removeAddress,
  getProfileByAuthId,
} = require('../controllers/user.controller');

const router = express.Router();

// Internal service call – protected by shared secret header
const internalOnly = (req, res, next) => {
  const secret = req.headers['x-internal-secret'];
  if (secret !== process.env.INTERNAL_SECRET)
    return res.status(403).json({ error: 'Forbidden' });
  next();
};

const addressValidation = [
  body('line1').notEmpty().withMessage('Address line 1 is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('postalCode').notEmpty().withMessage('Postal code is required'),
  body('country').notEmpty().withMessage('Country is required'),
];

router.get('/me', authenticate, getProfile);
router.post(
  '/me',
  authenticate,
  [
    body('email').isEmail().normalizeEmail(),
    body('firstName').optional().isLength({ max: 50 }),
    body('lastName').optional().isLength({ max: 50 }),
  ],
  createProfile
);
router.patch('/me', authenticate, updateProfile);
router.post('/me/addresses', authenticate, addressValidation, addAddress);
router.delete('/me/addresses/:addressId', authenticate, removeAddress);

// Internal route
router.get('/:authId', internalOnly, getProfileByAuthId);

module.exports = router;
