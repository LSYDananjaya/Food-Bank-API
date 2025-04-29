// /shared/middleware/auth.js
const jwt = require("jsonwebtoken");
const axios = require("axios");

// Main authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      throw new Error("Authentication token required");
    }
    
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set basic user info from token claims
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      mobileNo: decoded.mobileNo,
      assignedRestaurant: decoded.assignedRestaurant,
      email: decoded.email
    };
    
    // Store token for potential downstream service calls
    req.token = token;
    
    // Add user info to headers for microservice communication
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-role'] = decoded.role;
    
    next();
  } catch (error) {
    res.status(401).json({ message: "Please authenticate" });
  }
};

// Role-based middleware functions
const isAdmin = async (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin rights required." });
  }
  next();
};

const isRestaurantOwner = async (req, res, next) => {
  if (req.user.role !== "restaurantOwner" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Restaurant owner rights required." });
  }
  next();
};

const isRestaurantAuthorized = async (req, res, next) => {
  if (req.user.role === "admin") {
    return next();
  }
  
  // Check if user has an assigned restaurant
  if (!req.user.assignedRestaurant) {
    return res.status(403).json({ message: "No restaurant assigned to this account" });
  }
  
  // Get restaurant ID from params or body
  const restaurantId = req.params.id || req.params.restaurantId || req.body.restaurantId;
  
  if (!restaurantId || req.user.assignedRestaurant.toString() !== restaurantId) {
    return res.status(403).json({ message: "Access denied. Not authorized for this restaurant." });
  }
  
  next();
};

const isDeliveryPerson = async (req, res, next) => {
  if (req.user.role !== "deliveryPerson" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Delivery person rights required." });
  }
  next();
};

// Service authentication middleware for internal service-to-service communication
const serviceAuth = async (req, res, next) => {
  try {
    const serviceKey = req.header("x-service-key");
    
    if (!serviceKey) {
      throw new Error("Service authentication key required");
    }
    
    // Validate against known service keys
    if (serviceKey !== process.env.INTERNAL_API_KEY) {
      throw new Error("Invalid service key");
    }
    
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized service request" });
  }
};

module.exports = { 
  auth, 
  isAdmin, 
  isRestaurantOwner, 
  isRestaurantAuthorized, 
  isDeliveryPerson,
  serviceAuth
};
