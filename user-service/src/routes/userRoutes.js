const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { auth, isAdmin, serviceAuth } = require("../middleware/auth");

// Public routes 
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

// User profile routes
router.get('/users/:id', auth, userController.getUserById);
router.put('/users/:id', auth, userController.updateUser);
router.delete('/users/:id', auth, isAdmin, userController.deleteUser);

// User address routes
router.get('/users/:id/addresses', auth, userController.getUserAddresses);
router.post('/users/:id/addresses', auth, userController.addUserAddress);
router.put('/users/:id/addresses/:addressId', auth, userController.updateUserAddress);
router.delete('/users/:id/addresses/:addressId', auth, userController.deleteUserAddress);

// Protected routes - Admin only
router.get("/users", auth, isAdmin, userController.getUsers);
router.post("/users", auth, isAdmin, userController.createUser);

// Internal routes for service-to-service communication
router.get("/internal/users/:id", serviceAuth, userController.getUserForInternalService);

module.exports = router;
