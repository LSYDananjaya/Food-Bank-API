const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { auth, isDeliveryPerson } = require('../middleware/auth');

// GET delivery by id
router.get('/deliveries/:id', auth, deliveryController.getDelivery);

// POST create new delivery
router.post('/deliveries', auth, deliveryController.createDelivery);

// PUT update delivery status
router.put('/deliveries/:id/status', auth, isDeliveryPerson, deliveryController.updateDeliveryStatus);

// GET delivery metrics
router.get('/metrics', auth, deliveryController.getDeliveryMetrics);

// GET active deliveries in an area
router.get('/active-deliveries', auth, deliveryController.getActiveDeliveriesInArea);

// POST assign delivery person
router.post('/deliveries/:id/assign', auth, isDeliveryPerson, deliveryController.assignDeliveryPerson);

module.exports = router;
