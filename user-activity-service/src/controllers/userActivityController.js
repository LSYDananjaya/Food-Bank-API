const UserActivity = require('../models/UserActivity');
const axios = require('axios');
const mongoose = require('mongoose');

// Log a user activity
const logUserActivity = async (userId, activityType, description, metadata = {}) => {
  try {
    const activity = new UserActivity({
      userId,
      activityType,
      description,
      metadata
    });
    return await activity.save();
  } catch (error) {
    console.error('Error logging user activity:', error);
    // Still return success to prevent blocking main operations
    return null;
  }
};

// Get user activities with pagination
const getUserActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, activityType } = req.query;
    const query = { userId };
    
    // Filter by activity type if provided
    if (activityType) {
      query.activityType = activityType;
    }
    
    // Get activities from the last 30 days by default
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    query.createdAt = { $gte: thirtyDaysAgo };
    
    const options = {
      sort: { createdAt: -1 },
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    };
    
    const [activities, total] = await Promise.all([
      UserActivity.find(query, null, options),
      UserActivity.countDocuments(query)
    ]);
    
    // Enhance response with restaurant details
    const enhancedActivities = await Promise.all(activities.map(async (activity) => {
      const activityObj = activity.toObject();
      
      // Fetch restaurant data if needed
      if (activity.metadata && activity.metadata.restaurantId) {
        try {
          const restaurantResponse = await axios.get(
            `${process.env.RESTAURANT_SERVICE_URL}/internal/restaurants/${activity.metadata.restaurantId}`,
            {
              headers: {
                'x-service-key': process.env.INTERNAL_API_KEY
              }
            }
          );
          
          if (restaurantResponse.data) {
            activityObj.metadata.restaurantDetails = {
              name: restaurantResponse.data.name,
              logo: restaurantResponse.data.image
            };
          }
        } catch (error) {
          console.error(`Failed to fetch restaurant details: ${error.message}`);
        }
      }
      
      return activityObj;
    }));
    
    res.status(200).json({
      success: true,
      data: {
        activities: enhancedActivities,
        totalPages: Math.ceil(total / parseInt(limit)),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    console.error('Error getting user activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user activities',
      error: error.message
    });
  }
};

// Get user activity statistics
const getUserActivityStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get order statistics from Order Service
    let completedOrdersCount = 0;
    let totalSpent = 0;
    let favoriteRestaurant = null;
    let recentOrder = null;
    
    try {
      const orderStatsResponse = await axios.get(
        `${process.env.ORDER_SERVICE_URL}/internal/users/${userId}/order-stats`,
        {
          headers: {
            'x-service-key': process.env.INTERNAL_API_KEY
          }
        }
      );
      
      const orderStats = orderStatsResponse.data;
      completedOrdersCount = orderStats.completedOrdersCount;
      totalSpent = orderStats.totalSpent;
      favoriteRestaurant = orderStats.favoriteRestaurant;
      recentOrder = orderStats.recentOrder;
    } catch (error) {
      console.error('Error fetching order statistics:', error.message);
      // Continue execution despite error to provide partial data
    }
    
    // Get user last login time from User Service
    let lastLogin = null;
    try {
      const userResponse = await axios.get(
        `${process.env.USER_SERVICE_URL}/internal/users/${userId}`,
        {
          headers: {
            'x-service-key': process.env.INTERNAL_API_KEY
          }
        }
      );
      
      lastLogin = userResponse.data.lastLogin;
    } catch (error) {
      console.error('Error fetching user details:', error.message);
      // Continue execution despite error
    }
    
    res.status(200).json({
      success: true,
      data: {
        completedOrdersCount,
        totalSpent,
        favoriteRestaurant,
        recentOrder,
        lastLogin
      }
    });
  } catch (error) {
    console.error('Error getting user activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user activity statistics',
      error: error.message
    });
  }
};

// Create activity from other services (internal API)
const createActivityInternal = async (req, res) => {
  try {
    const { userId, activityType, description, metadata } = req.body;
    
    if (!userId || !activityType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, activityType, and description are required'
      });
    }
    
    const activity = new UserActivity({
      userId,
      activityType,
      description,
      metadata
    });
    
    const savedActivity = await activity.save();
    
    res.status(201).json({
      success: true,
      data: savedActivity
    });
  } catch (error) {
    console.error('Error creating activity (internal):', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user activity',
      error: error.message
    });
  }
};

// Get activities for a specific user (internal API)
const getUserActivitiesInternal = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, activityType } = req.query;
    
    const query = { userId };
    
    if (activityType) {
      query.activityType = activityType;
    }
    
    const activities = await UserActivity.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.status(200).json(activities);
  } catch (error) {
    console.error('Error getting user activities (internal):', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user activities',
      error: error.message
    });
  }
};

module.exports = {
  logUserActivity,
  getUserActivities,
  getUserActivityStats,
  createActivityInternal,
  getUserActivitiesInternal
};
