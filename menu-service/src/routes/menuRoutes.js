const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");
const { auth, isAdmin, isRestaurantOwner, isRestaurantAuthorized, serviceAuth } = require("../middleware/auth");

// Public routes
router.get("/menu", menuController.getMenuItems);
router.get("/menu/restaurant/:restaurantId", menuController.getMenuItemsByRestaurant);
router.get("/menu/:restaurantId/item/:itemId", menuController.getMenuItemById);
router.get("/categories", menuController.getCategories);
router.get("/categories/:restaurantId", menuController.getCategoriesByRestaurant);

// Protected routes with authentication
router.get("/menu/restaurant/dashboard", auth, menuController.getMenuDashboard);
router.get("/categories/dashboard", auth, menuController.getCategoriesDashboard);

// Restaurant owner routes
router.post("/categories", auth, isRestaurantOwner, menuController.createCategory);
router.put("/categories/:id", auth, isRestaurantOwner, menuController.updateCategory);
router.delete("/categories/:id", auth, isRestaurantOwner, menuController.deleteCategory);
router.put("/menu/:id/category", auth, isRestaurantOwner, menuController.assignMenuItemCategory);
router.post("/menu", auth, isRestaurantOwner, menuController.createMenuItem);
router.post("/menu/upload", auth, isRestaurantOwner, menuController.uploadImage);
router.put("/menu/:id", auth, isRestaurantOwner, menuController.updateMenuItem);
router.delete("/menu/:id", auth, isRestaurantOwner, menuController.deleteMenuItem);

// Internal API endpoints for service-to-service communication
router.get("/internal/menu-items", serviceAuth, menuController.getAllMenuItemsInternal);

module.exports = router;
