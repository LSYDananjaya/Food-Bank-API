const Restaurant = require("../models/restaurantModel");
const User = require("../models/User");
const Order = require("../models/Order");

exports.getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createRestaurant = async (req, res) => {
  const restaurant = new Restaurant(req.body);
  try {
    const newRestaurant = await restaurant.save();
    res.status(201).json(newRestaurant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.json({ message: "Restaurant deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignOwner = async (req, res) => {
  const { restaurantId, userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Check if user is already an owner of another restaurant
    if (user.assignedRestaurant) {
      return res.status(400).json({ message: "User already manages a restaurant" });
    }

    // Update user role and assign restaurant
    user.role = 'restaurantOwner';
    user.assignedRestaurant = restaurantId;
    await user.save();

    res.json({ message: "Restaurant owner assigned successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.removeOwner = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== 'restaurantOwner') {
      return res.status(400).json({ message: "User is not a restaurant owner" });
    }

    // Remove restaurant owner role and assignment
    user.role = 'user';
    user.assignedRestaurant = null;
    await user.save();

    res.json({ message: "Restaurant owner removed successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getRestaurantByOwner = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user.assignedRestaurant);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRestaurantAnalytics = async (req, res) => {
  try {
    // For restaurant owners, use their assigned restaurant if no ID provided
    const restaurantId = req.params.id || req.user.assignedRestaurant;
    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant ID is required" });
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get today's orders
    const todayOrders = await Order.find({
      restaurantId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).populate('userId', 'firstName lastName');

    // Calculate metrics
    const totalOrders = todayOrders.length;
    const totalRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const completedOrders = todayOrders.filter(order => order.status === 'delivered').length;
    
    // Calculate average preparation time
    const preparationTimes = todayOrders
      .filter(order => order.status === 'delivered')
      .map(order => {
        const prepTime = new Date(order.updatedAt) - new Date(order.createdAt);
        return prepTime / (1000 * 60); // Convert to minutes
      });
    
    const avgPrepTime = preparationTimes.length > 0 
      ? preparationTimes.reduce((sum, time) => sum + time, 0) / preparationTimes.length
      : 0;

    res.json({
      totalOrders,
      totalRevenue,
      completedOrders,
      averagePreparationTime: Math.round(avgPrepTime),
      recentOrders: todayOrders.slice(-5) // Last 5 orders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRestaurantOrders = async (req, res) => {
  try {
    const { id: restaurantId } = req.params;
    const { status, startDate, endDate } = req.query;

    let query = { restaurantId };

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'firstName lastName email')
      .populate('items.menuItem');

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateMenu = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    restaurant.menu = req.body.menu;
    await restaurant.save();
    
    res.json({ message: "Menu updated successfully", menu: restaurant.menu });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Internal API methods for service-to-service communication
exports.getAllRestaurantsInternal = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRestaurantByIdInternal = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRestaurantDashboard = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    // Get dashboard metrics
    const [restaurantCount, todayOrders] = await Promise.all([
      Restaurant.countDocuments(),
      Order.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      })
    ]);

    const totalRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalRevenue / (todayOrders.length || 1);

    res.json({
      totalRestaurants: restaurantCount,
      todayOrderCount: todayOrders.length,
      todayRevenue: totalRevenue,
      averageOrderValue,
      recentOrders: todayOrders.slice(-5) // Last 5 orders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};