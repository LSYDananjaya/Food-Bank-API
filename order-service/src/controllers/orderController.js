const Order = require('../models/Order');
const axios = require('axios');

// Helper functions for service-to-service communication
async function getUserDetails(userId) {
  try {
    const response = await axios.get(`${process.env.USER_SERVICE_URL}/internal/users/${userId}`, {
      headers: {
        'x-service-key': process.env.INTERNAL_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch user details: ${error.message}`);
    return null;
  }
}

async function getRestaurantDetails(restaurantId) {
  try {
    const response = await axios.get(`${process.env.RESTAURANT_SERVICE_URL}/internal/restaurants/${restaurantId}`, {
      headers: {
        'x-service-key': process.env.INTERNAL_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch restaurant details: ${error.message}`);
    return null;
  }
}

async function getMenuItemDetails(menuItemId) {
  try {
    const response = await axios.get(`${process.env.MENU_SERVICE_URL}/internal/menu-items/${menuItemId}`, {
      headers: {
        'x-service-key': process.env.INTERNAL_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch menu item details: ${error.message}`);
    return null;
  }
}

async function createNotification(userId, order, type, message) {
  try {
    await axios.post(`${process.env.NOTIFICATION_SERVICE_URL}/internal/notifications`, {
      userId,
      referenceId: order._id,
      referenceModel: 'Order',
      type,
      message,
      data: {
        orderId: order.orderId,
        status: order.status
      }
    }, {
      headers: {
        'x-service-key': process.env.INTERNAL_API_KEY
      }
    });
  } catch (error) {
    console.error(`Failed to create notification: ${error.message}`);
  }
}

async function sendSmsNotification(userId, order, status) {
  try {
    await axios.post(`${process.env.SMS_SERVICE_URL}/internal/send`, {
      userId,
      templateType: 'order_status',
      data: {
        orderId: order.orderId,
        status
      }
    }, {
      headers: {
        'x-service-key': process.env.INTERNAL_API_KEY
      }
    });
  } catch (error) {
    console.error(`Failed to send SMS notification: ${error.message}`);
  }
}

// Get all orders
exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, orderType } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (orderType) query.orderType = orderType;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Order.countDocuments(query);
    
    // Enhance response with user and restaurant details
    const enhancedOrders = await Promise.all(orders.map(async (order) => {
      const orderObj = order.toObject();
      
      // Get user details
      const user = await getUserDetails(order.userId);
      if (user) {
        orderObj.user = {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email
        };
      }
      
      // Get restaurant details
      const restaurant = await getRestaurantDetails(order.restaurantId);
      if (restaurant) {
        orderObj.restaurant = {
          id: restaurant._id,
          name: restaurant.name,
          location: restaurant.location
        };
      }
      
      return orderObj;
    }));
    
    res.json({
      orders: enhancedOrders,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalOrders: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get orders by user
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { userId };
    if (status) query.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Order.countDocuments(query);
    
    // Enhance orders with restaurant and menu item details
    const enhancedOrders = await Promise.all(orders.map(async (order) => {
      const orderObj = order.toObject();
      
      // Get restaurant details
      const restaurant = await getRestaurantDetails(order.restaurantId);
      if (restaurant) {
        orderObj.restaurant = {
          id: restaurant._id,
          name: restaurant.name,
          location: restaurant.location
        };
      }
      
      // Enhance menu items with details
      orderObj.items = await Promise.all(order.items.map(async (item) => {
        const menuItem = await getMenuItemDetails(item.menuItem);
        return {
          ...item,
          menuItem: menuItem ? {
            id: menuItem._id,
            name: menuItem.name,
            description: menuItem.description,
            imageUrl: menuItem.imageUrl
          } : { id: item.menuItem, name: 'Unknown item' }
        };
      }));
      
      return orderObj;
    }));
    
    res.json({
      orders: enhancedOrders,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalOrders: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get orders by restaurant
exports.getRestaurantOrders = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { restaurantId };
    if (status) query.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Order.countDocuments(query);
    
    // Enhance orders with user and menu item details
    const enhancedOrders = await Promise.all(orders.map(async (order) => {
      const orderObj = order.toObject();
      
      // Get user details
      const user = await getUserDetails(order.userId);
      if (user) {
        orderObj.user = {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email
        };
      }
      
      // Enhance menu items with details
      orderObj.items = await Promise.all(order.items.map(async (item) => {
        const menuItem = await getMenuItemDetails(item.menuItem);
        return {
          ...item,
          menuItem: menuItem ? {
            id: menuItem._id,
            name: menuItem.name,
            description: menuItem.description,
            imageUrl: menuItem.imageUrl
          } : { id: item.menuItem, name: 'Unknown item' }
        };
      }));
      
      return orderObj;
    }));
    
    res.json({
      orders: enhancedOrders,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalOrders: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      orderType,
      deliveryAddress,
      tableNumber,
      reservationDate,
      reservationTime,
      pickupLocation,
      estimatedDeliveryTime,
      estimatedPickupTime,
      specialInstructions
    } = req.body;
    
    const userId = req.user.id;
    
    // Get user details from User Service
    const user = await getUserDetails(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Generate unique order ID
    const orderId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Use restaurantId from request body if provided, otherwise try to get it from the first item
    const restaurantId = req.body.restaurantId || items[0]?.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant ID is required. Please provide a valid restaurant ID." });
    }
    
    // Verify restaurant exists
    const restaurant = await getRestaurantDetails(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    
    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create new order
    const order = new Order({
      orderId,
      userId,
      restaurantId,
      items,
      orderType,
      status: 'pending',
      paymentStatus: 'pending',
      totalAmount,
      deliveryAddress: orderType === 'delivery' ? (deliveryAddress || user.address) : undefined,
      tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
      reservationDate: orderType === 'dine-in' ? reservationDate : undefined,
      reservationTime: orderType === 'dine-in' ? reservationTime : undefined,
      pickupLocation: orderType === 'pickup' ? pickupLocation : undefined,
      estimatedDeliveryTime,
      estimatedPickupTime,
      specialInstructions
    });
    
    // Save order
    const savedOrder = await order.save();
    
    // If table reservation, update table status
    if (orderType === 'dine-in' && tableNumber) {
      try {
        await axios.post(`${process.env.TABLE_SERVICE_URL}/internal/tables/reserve`, {
          restaurantId,
          tableNumber,
          reservationDate,
          reservationTime,
          orderId: savedOrder._id
        }, {
          headers: {
            'x-service-key': process.env.INTERNAL_API_KEY
          }
        });
      } catch (error) {
        console.error(`Failed to reserve table: ${error.message}`);
        // Continue despite table reservation error
      }
    }
    
    // Clear cart after order placement
    try {
      await axios.delete(`${process.env.CART_SERVICE_URL}/internal/clear/${userId}`, {
        headers: {
          'x-service-key': process.env.INTERNAL_API_KEY
        }
      });
    } catch (error) {
      console.error(`Failed to clear cart: ${error.message}`);
      // Continue despite cart clear error
    }
    
    // Create notifications
    await createNotification(
      userId,
      savedOrder,
      'success',
      'Your order has been placed successfully'
    );
    
    // Notify restaurant owner
    try {
      const restaurantOwners = await axios.get(
        `${process.env.USER_SERVICE_URL}/internal/users/by-restaurant/${restaurantId}`,
        {
          headers: {
            'x-service-key': process.env.INTERNAL_API_KEY
          }
        }
      );
      
      if (restaurantOwners.data && restaurantOwners.data.length > 0) {
        for (const owner of restaurantOwners.data) {
          await createNotification(
            owner._id,
            savedOrder,
            'info',
            `New order ${savedOrder.orderId} has been received`
          );
        }
      }
    } catch (error) {
      console.error(`Failed to notify restaurant owner: ${error.message}`);
      // Continue despite notification error
    }
    
    // Get full order details for response
    const populatedOrder = await Order.findById(savedOrder._id);
    
    // Enhance with restaurant details
    const enhancedOrder = populatedOrder.toObject();
    enhancedOrder.restaurant = {
      id: restaurant._id,
      name: restaurant.name,
      location: restaurant.location
    };
    
    res.status(201).json(enhancedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    
    // First find the order to check restaurant ownership
    const orderToUpdate = await Order.findById(orderId);
    if (!orderToUpdate) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Check if restaurant owner is authorized for this restaurant
    if (req.user.role === 'restaurantOwner' &&
        req.user.assignedRestaurant &&
        orderToUpdate.restaurantId.toString() !== req.user.assignedRestaurant.toString()) {
      return res.status(403).json({
        message: "You are not authorized to update orders for this restaurant"
      });
    }
    
    // Apply status-specific updates
    const updateData = { status };
    
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = req.body.reason || 'Cancelled by restaurant';
    }
    
    // Update the order status
    const order = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );
    
    // Get user details
    const user = await getUserDetails(order.userId);
    
    // Send notifications to customer
    let notificationMessage = '';
    let notificationType = 'info';
    
    switch (status) {
      case 'preparing':
        notificationMessage = 'Your order is being prepared';
        notificationType = 'info';
        break;
      case 'ready':
        notificationMessage = 'Your order is ready for pickup/delivery';
        notificationType = 'success';
        break;
      case 'delivered':
        notificationMessage = 'Your order has been delivered';
        notificationType = 'success';
        break;
      case 'cancelled':
        notificationMessage = 'Your order has been cancelled';
        notificationType = 'error';
        break;
      default:
        notificationMessage = `Your order status has been updated to ${status}`;
    }
    
    // Create notification for customer
    await createNotification(
      order.userId,
      order,
      notificationType,
      notificationMessage
    );
    
    // Send SMS notification if applicable
    if (user && user.mobileNo) {
      try {
        await sendSmsNotification(order.userId, order, status);
      } catch (error) {
        console.error('Failed to send SMS notification:', error);
        // Continue with response even if SMS fails
      }
    }
    
    // Return enhanced order object
    const enhancedOrder = order.toObject();
    if (user) {
      enhancedOrder.user = {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      };
    }
    
    res.json(enhancedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    
    // Find the order
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Create notification for payment status update
    await createNotification(
      order.userId,
      order,
      paymentStatus === 'paid' ? 'success' : 'info',
      `Payment ${paymentStatus} for order ${order.orderId}`
    );
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: req.body.reason || 'No reason provided'
      },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // If dine-in order, release table reservation
    if (order.orderType === 'dine-in' && order.tableNumber) {
      try {
        await axios.post(`${process.env.TABLE_SERVICE_URL}/internal/tables/release`, {
          restaurantId: order.restaurantId,
          tableNumber: order.tableNumber,
          orderId: order._id
        }, {
          headers: {
            'x-service-key': process.env.INTERNAL_API_KEY
          }
        });
      } catch (error) {
        console.error(`Failed to release table: ${error.message}`);
        // Continue despite table release error
      }
    }
    
    // Create notifications for cancellation
    await createNotification(
      order.userId,
      order,
      'error',
      `Order ${order.orderId} has been cancelled${req.body.reason ? ': ' + req.body.reason : ''}`
    );
    
    // Get user details for enhanced response
    const user = await getUserDetails(order.userId);
    const enhancedOrder = order.toObject();
    
    if (user) {
      enhancedOrder.user = {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      };
    }
    
    res.json(enhancedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get order statistics
exports.getOrderStats = async (req, res) => {
  try {
    let query = {};
    
    // If user is a restaurant owner, only show stats for their restaurant
    if (req.user.role === 'restaurantOwner' && req.user.assignedRestaurant) {
      query = { restaurantId: req.user.assignedRestaurant };
    }
    
    // Get date range filter if provided
    const { startDate, endDate } = req.query;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          averageOrderValue: { $avg: "$totalAmount" }
        }
      }
    ]);
    
    const statusCounts = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get order counts by type
    const orderTypeStats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$orderType",
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    res.json({
      ...(stats[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 }),
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      orderTypeStats: orderTypeStats.reduce((acc, curr) => {
        acc[curr._id] = { count: curr.count, revenue: curr.revenue };
        return acc;
      }, {})
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Internal API for service-to-service communication

// Get restaurant orders for internal use
exports.getRestaurantOrdersInternal = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { status, startDate, endDate } = req.query;
    
    const query = { restaurantId };
    
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const orders = await Order.find(query).sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get order summary statistics for internal use
exports.getOrderSummaryInternal = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const todayOrders = await Order.countDocuments(query);
    const totalRevenue = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    const recentOrders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      todayOrders,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get delivery person orders
exports.getDeliveryPersonOrdersInternal = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const orders = await Order.find({
      deliveryPersonId: userId,
      status: { $in: ['in-delivery', 'delivered'] }
    }).sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign delivery person to order
exports.assignDeliveryPerson = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryPersonId } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      orderId,
      { deliveryPersonId, status: 'in-delivery' },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Notify delivery person
    await createNotification(
      deliveryPersonId,
      order,
      'info',
      `You have been assigned to deliver order ${order.orderId}`
    );
    
    // Notify customer
    await createNotification(
      order.userId,
      order,
      'info',
      `Your order ${order.orderId} is out for delivery`
    );
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
