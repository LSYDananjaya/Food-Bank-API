const express = require("express");
const router = express.Router();
const restaurantController = require("../controllers/restaurantController");
const { auth, isAdmin, isRestaurantOwner, isRestaurantAuthorized, serviceAuth } = require("../middleware/auth");

// Public routes - no authentication required
router.get("/", restaurantController.getRestaurants);
router.get("/:id", restaurantController.getRestaurantById);

// Admin dashboard route
router.get("/dashboard", auth, isAdmin, restaurantController.getRestaurantDashboard);

// Admin only routes
router.post("/", auth, isAdmin, restaurantController.createRestaurant);
router.put("/:id", auth, isAdmin, restaurantController.updateRestaurant);
router.delete("/:id", auth, isAdmin, restaurantController.deleteRestaurant);

// Restaurant owner management routes
router.post("/assign-owner", auth, isAdmin, restaurantController.assignOwner);
router.delete("/remove-owner/:userId", auth, isAdmin, restaurantController.removeOwner);

// Restaurant owner routes
router.get("/owner/managed", auth, isRestaurantOwner, restaurantController.getRestaurantByOwner);
router.get("/:id/analytics", auth, isRestaurantOwner, isRestaurantAuthorized, restaurantController.getRestaurantAnalytics);
router.put("/:id/menu", auth, isRestaurantOwner, isRestaurantAuthorized, restaurantController.updateMenu);
router.get("/:id/orders", auth, isRestaurantOwner, isRestaurantAuthorized, restaurantController.getRestaurantOrders);

// Internal API routes for service-to-service communication
router.get("/internal/restaurants", serviceAuth, restaurantController.getAllRestaurantsInternal);
router.get("/internal/restaurants/:id", serviceAuth, restaurantController.getRestaurantByIdInternal);

module.exports = router;
