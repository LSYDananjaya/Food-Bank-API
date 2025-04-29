const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth, isAdmin, isRestaurantOwner, isRestaurantAuthorized, isDeliveryPerson, serviceAuth } = require('../middleware/auth');

// User routes
router.get('/user/:userId', auth, orderController.getUserOrders);
router.post('/', auth, orderController.createOrder);
router.post('/:id/cancel', auth, orderController.cancelOrder);

// Restaurant routes
router.get('/restaurant/:restaurantId', auth, isRestaurantAuthorized, orderController.getRestaurantOrders);
router.patch('/:id/status', auth, (req, res, next) => {
  // Allow both admins and restaurant owners to update status
  if (req.user.role === 'admin' || (req.user.role === 'restaurantOwner' && req.user.assignedRestaurant)) {
    return next();
  }
  return res.status(403).json({ message: "Access denied. Admin or Restaurant owner rights required." });
}, orderController.updateOrderStatus);

router.patch('/:id/payment', auth, (req, res, next) => {
  // Allow both admins and restaurant owners to update payment status
  if (req.user.role === 'admin' || (req.user.role === 'restaurantOwner' && req.user.assignedRestaurant)) {
    return next();
  }
  return res.status(403).json({ message: "Access denied. Admin or Restaurant owner rights required." });
}, orderController.updatePaymentStatus);

// Admin routes
router.get('/', auth, isAdmin, orderController.getOrders);

// Stats routes
router.get('/stats', auth, (req, res, next) => {
  // Allow both admins and restaurant owners to access order statistics
  if (req.user.role === 'admin' || (req.user.role === 'restaurantOwner' && req.user.assignedRestaurant)) {
    return next();
  }
  return res.status(403).json({ message: "Access denied. Admin or Restaurant owner rights required." });
}, orderController.getOrderStats);

// Delivery person routes
router.patch('/:orderId/assign-delivery', auth, isAdmin, orderController.assignDeliveryPerson);

// Internal API routes for service-to-service communication
router.get('/internal/restaurants/:restaurantId/orders', serviceAuth, orderController.getRestaurantOrdersInternal);
router.get('/internal/orders/summary', serviceAuth, orderController.getOrderSummaryInternal);
router.get('/internal/orders/delivery-person/:userId', serviceAuth, orderController.getDeliveryPersonOrdersInternal);

module.exports = router;
