const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");
const { serviceAuth } = require("../middleware/auth");

// Public search routes
router.get("/search", searchController.search);
router.get("/search/suggestions", searchController.searchSuggestions);

// Internal routes for data synchronization
router.post("/internal/sync/restaurants", serviceAuth, searchController.syncRestaurantData);
router.post("/internal/sync/menu-items", serviceAuth, searchController.syncMenuData);

module.exports = router;
