const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["success", "info", "warning", "error", "order", "cancel"],
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: false,
  },
  read: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Object,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
