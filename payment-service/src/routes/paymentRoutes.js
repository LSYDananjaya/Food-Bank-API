// payment-service/src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { auth, serviceAuth } = require("../middleware/auth");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');

// Create payment intent
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { orderData, customerEmail } = req.body;

    if (!orderData?.totalAmount) {
      return res.status(400).json({ message: 'Invalid order data' });
    }

    const amount = Math.max(Math.round(orderData.totalAmount * 100), 50);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method_types: ['card'],
      receipt_email: customerEmail,
      metadata: {
        userId: orderData.userId,
        restaurantId: orderData.restaurantId || '',
        orderType: orderData.orderType || 'pickup',
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ message: 'Payment processing failed', error: error.message });
  }
});

// Confirm payment and create order
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { paymentIntentId, userId, orderData } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    // Create order through Order Service
    const orderResponse = await axios.post(
      `${process.env.ORDER_SERVICE_URL}/internal/orders`,
      { ...orderData, paymentStatus: 'paid', paymentMethod: 'card' },
      { headers: { 'x-service-key': process.env.INTERNAL_API_KEY } }
    );

    // Clear cart through Cart Service
    await axios.delete(
      `${process.env.CART_SERVICE_URL}/internal/carts/${userId}`,
      { headers: { 'x-service-key': process.env.INTERNAL_API_KEY } }
    );

    res.json({ success: true, orderId: orderResponse.data.orderId });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ message: 'Order processing failed', error: error.message });
  }
});

// Internal API for order validation
router.post('/internal/validate-payment', serviceAuth, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    res.json({ isValid: paymentIntent.status === 'succeeded' });
  } catch (error) {
    res.status(400).json({ isValid: false });
  }
});

module.exports = router;
