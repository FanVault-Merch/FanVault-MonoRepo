const express = require('express');
const { sendOrderConfirmation, sendWelcome } = require('../controllers/email.controller');

const router = express.Router();

router.post('/order-confirmation', ...sendOrderConfirmation);
router.post('/welcome', ...sendWelcome);

module.exports = router;
