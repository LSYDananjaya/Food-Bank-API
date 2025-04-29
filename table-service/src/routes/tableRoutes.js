const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { auth, isAdmin, isRestaurantOwner, isRestaurantAuthorized, serviceAuth } = require('../middleware/auth');

// Table management routes
router.get('/tables/available', auth, tableController.getAvailableTables);
router.get('/:restaurantId', auth, tableController.getTables);
router.post('/', auth, isRestaurantOwner, tableController.createTable);
router.put('/:id', auth, isRestaurantOwner, tableController.updateTable);
router.delete('/:id', auth, isRestaurantOwner, tableController.deleteTable);

// Table reservation
router.post('/reserve', auth, tableController.reserveTable);

// Internal API for service-to-service communication
router.post('/internal/tables/reserve', serviceAuth, tableController.reserveTableInternal);
router.post('/internal/tables/release', serviceAuth, tableController.releaseTableInternal);

module.exports = router;
