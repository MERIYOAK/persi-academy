const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/authMiddleware');

// Create checkout session (requires authentication)
router.post('/create-checkout-session', auth, paymentController.createCheckoutSession);

// Webhook endpoint (no auth required, uses Stripe signature verification)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.webhook);

// Success and cancel pages
router.get('/success', paymentController.success);
router.get('/cancel', paymentController.cancel);

// Check if user has purchased a course (requires authentication)
router.get('/check-purchase/:courseId', auth, paymentController.checkPurchase);

// Receipt endpoints (requires authentication)
router.get('/receipt/:courseId', auth, paymentController.getReceipt);
router.get('/download-receipt/:courseId', auth, paymentController.downloadReceipt);

module.exports = router; 