const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth, serviceAuth } = require('../middleware/auth');

// User-facing routes (require authentication)
router.get('/notifications/unread/count', auth, notificationController.getUnreadCount);
router.get('/notifications/latest', auth, notificationController.getLatestNotifications);
router.delete('/notifications/clear-read', auth, notificationController.deleteAllRead);
router.patch('/notifications/read-all', auth, notificationController.markAllAsRead);
router.get('/notifications', auth, notificationController.getUserNotifications);
router.post('/notifications', auth, notificationController.createNotification);
router.patch('/notifications/:id/read', auth, notificationController.markAsRead);
router.delete('/notifications/:id', auth, notificationController.deleteNotification);

// Internal API endpoints (service-to-service communication)
router.post('/internal/notifications', serviceAuth, notificationController.createNotificationInternal);
router.post('/internal/order-notifications', serviceAuth, notificationController.createOrderNotificationInternal);

module.exports = router;
