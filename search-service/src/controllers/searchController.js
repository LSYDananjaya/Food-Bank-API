const Restaurant = require("../models/Restaurant");
const MenuSelection = require("../models/MenuSelection");
const axios = require("axios");

exports.search = async (req, res) => {
  try {
    const { query, minPrice, maxPrice, page = 1, limit = 6 } = req.query;

    if (!query) {
      return res.json({
        restaurants: [],
        menuItems: [],
        totalRestaurants: 0,
        totalMenuItems: 0,
        currentPage: 1,
        totalPages: 1
      });
    }

    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(query, 'i');

    // Build menu query
    let menuQuery = {
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    };

    // Add price range filter if provided
    if (minPrice !== undefined || maxPrice !== undefined) {
      menuQuery.price = {};
      if (minPrice !== undefined) menuQuery.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) menuQuery.price.$lte = Number(maxPrice);
    }

    // Get total counts
    const [totalRestaurants, totalMenuItems] = await Promise.all([
      Restaurant.countDocuments({
        $or: [
          { name: searchRegex },
          { cuisine: searchRegex },
          { location: searchRegex }
        ]
      }),
      MenuSelection.countDocuments(menuQuery)
    ]);

    // Search restaurants with pagination
    const restaurants = await Restaurant.find({
      $or: [
        { name: searchRegex },
        { cuisine: searchRegex },
        { location: searchRegex }
      ]
    })
      .skip(skip)
      .limit(Number(limit));

    // Search menu items with price filter and pagination
    const menuItems = await MenuSelection.find(menuQuery)
      .populate('restaurantId', 'name image location')
      .skip(skip)
      .limit(Number(limit));

    // Calculate total pages based on the larger count
    const totalPages = Math.ceil(Math.max(totalRestaurants, totalMenuItems) / limit);

    res.json({
      restaurants,
      menuItems,
      totalRestaurants,
      totalMenuItems,
      currentPage: Number(page),
      totalPages
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.searchSuggestions = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.json({ suggestions: [] });
    }

    const searchRegex = new RegExp(query, 'i');

    // Get unique suggestions from restaurants and menu items
    const [restaurants, menuItems] = await Promise.all([
      Restaurant.find({ name: searchRegex }, 'name image location').limit(3),
      MenuSelection.find({ name: searchRegex }, 'name imageUrl description').limit(3)
    ]);

    const suggestions = [
      ...restaurants.map(r => ({ name: r.name, image: r.image, type: 'restaurant', info: r.location })),
      ...menuItems.map(m => ({ name: m.name, image: m.imageUrl, type: 'menu item', info: m.description }))
    ];

    res.json({ suggestions });
  } catch (error) {
    console.error("Search suggestions error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Add data synchronization methods for microservice architecture
exports.syncRestaurantData = async (req, res) => {
  try {
    const serviceKey = req.header("x-service-key");
    
    // Verify service key for internal calls
    if (serviceKey !== process.env.INTERNAL_API_KEY) {
      return res.status(403).json({ message: "Unauthorized service request" });
    }
    
    // Fetch latest restaurant data from restaurant service
    const restaurantResponse = await axios.get(
      `${process.env.RESTAURANT_SERVICE_URL}/internal/restaurants`,
      { 
        headers: { 
          'x-service-key': process.env.INTERNAL_API_KEY 
        } 
      }
    );
    
    const restaurants = restaurantResponse.data;
    
    // Bulk update restaurant collection
    await Restaurant.deleteMany({}); // Clear existing data
    await Restaurant.insertMany(restaurants);
    
    res.json({ 
      message: "Restaurant data sync completed successfully", 
      count: restaurants.length 
    });
  } catch (error) {
    console.error("Restaurant data sync error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.syncMenuData = async (req, res) => {
  try {
    const serviceKey = req.header("x-service-key");
    
    // Verify service key for internal calls
    if (serviceKey !== process.env.INTERNAL_API_KEY) {
      return res.status(403).json({ message: "Unauthorized service request" });
    }
    
    // Fetch latest menu data from menu service
    const menuResponse = await axios.get(
      `${process.env.MENU_SERVICE_URL}/internal/menu-items`,
      { 
        headers: { 
          'x-service-key': process.env.INTERNAL_API_KEY 
        } 
      }
    );
    
    const menuItems = menuResponse.data;
    
    // Bulk update menu collection
    await MenuSelection.deleteMany({}); // Clear existing data
    await MenuSelection.insertMany(menuItems);
    
    res.json({ 
      message: "Menu data sync completed successfully", 
      count: menuItems.length 
    });
  } catch (error) {
    console.error("Menu data sync error:", error);
    res.status(500).json({ message: error.message });
  }
};
