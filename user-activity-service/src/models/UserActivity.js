const mongoose = require("mongoose");

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  activityType: {
    type: String,
    enum: ["login", "profile_update", "order_placed", "payment_processed", "account_created", "password_changed", "menu_viewed", "restaurant_visited"],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    // For login
    deviceInfo: String,
    ipAddress: String,
    
    // For order_placed
    orderId: String,
    orderAmount: Number,
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId
    },
    restaurantName: String,
    
    // For payment_processed
    paymentId: String,
    paymentAmount: Number,
    paymentMethod: String,
    
    // For other activities
    additionalInfo: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Create indexes for efficient querying
userActivitySchema.index({ userId: 1, activityType: 1 });
userActivitySchema.index({ createdAt: -1 });

const UserActivity = mongoose.model("UserActivity", userActivitySchema);

module.exports = UserActivity;
