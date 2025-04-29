const Notification = require('../models/Notification');
const axios = require('axios');

// Helper function to get user details
async function getUserByRestaurantId(restaurantId) {
  try {
    const response = await axios.get(`${process.env.USER_SERVICE_URL}/internal/users/by-restaurant/${restaurantId}`, {
      headers: {
        'x-service-key': process.env.INTERNAL_API_KEY
      }
    });
    return response.data[0]; // Return the first restaurant owner
  } catch (error) {
    console.error('Error fetching restaurant owner:', error.message);
    return null;
  }
}

// Get user notifications with filtering and pagination
exports.getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, read } = req.query;
    const query = { userId: req.user.id };
    
    if (type) query.type = type;
    if (read !== undefined) query.read = read === 'true';
    
    // If user is restaurant owner, include restaurantId in query
    if (req.user.role === 'restaurantOwner' && req.user.assignedRestaurant) {
      query.restaurantId = req.user.assignedRestaurant;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await Notification.countDocuments(query);
    
    res.json({
      notifications,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalCount: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create notification
exports.createNotification = async (req, res) => {
  try {
    const notification = new Notification({
      ...req.body,
      userId: req.user.id
    });
    
    const savedNotification = await notification.save();
    res.status(201).json(savedNotification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Create order notification helper
exports.createOrderNotification = async (userId, orderId, restaurantId, type, title, message, data = {}) => {
  try {
    // Create notification for the customer
    const customerNotification = new Notification({
      userId,
      title,
      message,
      type,
      orderId,
      data,
      read: false
    });
    
    await customerNotification.save();
    
    // If order has a restaurant, create notification for restaurant owner
    if (restaurantId) {
      // Find restaurant owner using user service
      const restaurantOwner = await getUserByRestaurantId(restaurantId);
      
      if (restaurantOwner) {
        // Create different notification message and title based on notification type
        let ownerTitle = title;
        let ownerMessage = message;
        let ownerType = type;
        
        // Customize notification for different order statuses/events
        if (type === 'success' && message.includes('placed')) {
          ownerTitle = `New Order ${data.orderId || ''}`;
          ownerMessage = `New order received: ${data.orderId || ''}`;
          ownerType = 'order';
        } else if (type === 'error' && message.includes('cancelled')) {
          ownerTitle = `Cancelled Order ${data.orderId || ''}`;
          ownerMessage = `Order ${data.orderId || ''} has been cancelled`;
          ownerType = 'cancel';
        }
        
        const ownerNotification = new Notification({
          userId: restaurantOwner._id,
          restaurantId,
          title: ownerTitle,
          message: ownerMessage,
          type: ownerType,
          orderId,
          data,
          read: false
        });
        
        await ownerNotification.save();
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error creating order notification:', error);
    return false;
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const query = { userId: req.user.id, read: false };
    
    // If restaurant owner, only mark their restaurant's notifications
    if (req.user.role === 'restaurantOwner' && req.user.assignedRestaurant) {
      query.restaurantId = req.user.assignedRestaurant;
    }
    
    const result = await Notification.updateMany(query, { read: true });
    
    res.json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted', deletedId: req.params.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete all read notifications
exports.deleteAllRead = async (req, res) => {
  try {
    const query = { userId: req.user.id, read: true };
    
    // If restaurant owner, only delete their restaurant's notifications
    if (req.user.role === 'restaurantOwner' && req.user.assignedRestaurant) {
      query.restaurantId = req.user.assignedRestaurant;
    }
    
    const result = await Notification.deleteMany(query);
    
    res.json({
      message: 'All read notifications deleted',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const query = { userId: req.user.id, read: false };
    
    // If restaurant owner, only count their restaurant's notifications
    if (req.user.role === 'restaurantOwner' && req.user.assignedRestaurant) {
      query.restaurantId = req.user.assignedRestaurant;
    }
    
    const count = await Notification.countDocuments(query);
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get latest notifications since a specific timestamp
exports.getLatestNotifications = async (req, res) => {
  try {
    const { since } = req.query;
    
    const query = {
      userId: req.user.id,
      createdAt: { $gt: new Date(since) }
    };
    
    // If restaurant owner, only get their restaurant's notifications
    if (req.user.role === 'restaurantOwner' && req.user.assignedRestaurant) {
      query.restaurantId = req.user.assignedRestaurant;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// INTERNAL API ENDPOINTS FOR SERVICE-TO-SERVICE COMMUNICATION

// Create notification from another service
exports.createNotificationInternal = async (req, res) => {
  try {
    const { userId, referenceId, referenceModel, type, message, data } = req.body;
    
    if (!userId || !type || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const notification = new Notification({
      userId,
      title: data?.title || referenceModel || 'Notification',
      message,
      type,
      [referenceModel?.toLowerCase() + 'Id']: referenceId,
      data,
      read: false
    });
    
    const savedNotification = await notification.save();
    
    res.status(201).json(savedNotification);
  } catch (error) {
    console.error('Internal notification creation error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Create order notification from order service
exports.createOrderNotificationInternal = async (req, res) => {
  try {
    const { userId, orderId, restaurantId, type, title, message, data } = req.body;
    
    if (!userId || !orderId || !type || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const result = await exports.createOrderNotification(
      userId, orderId, restaurantId, type, title, message, data
    );
    
    if (result) {
      res.status(201).json({ success: true, message: 'Notifications created successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to create notifications' });
    }
  } catch (error) {
    console.error('Internal order notification error:', error);
    res.status(400).json({ message: error.message });
  }
};
