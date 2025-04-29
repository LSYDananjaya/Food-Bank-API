const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { auth, serviceAuth } = require('../middleware/auth');

// Public cart endpoints
router.get('/cart/:userId', auth, cartController.getCart);
router.post('/cart', auth, cartController.addToCart);
router.put('/cart/:userId/quantity', auth, cartController.updateQuantity);
router.delete('/cart/:userId/:itemId', auth, cartController.removeFromCart);
router.delete('/cart/:userId', auth, cartController.clearCart);

// Internal endpoints for service-to-service communication
router.get('/internal/:userId', serviceAuth, cartController.getCartInternal);
router.delete('/internal/clear/:userId', serviceAuth, cartController.clearCartInternal);

module.exports = router;
