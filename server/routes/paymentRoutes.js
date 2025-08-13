const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/authMiddleware');

router.post('/create-checkout-session', auth, paymentController.createCheckoutSession);
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.webhook);
router.get('/success', paymentController.success);
router.get('/cancel', paymentController.cancel);

module.exports = router; 