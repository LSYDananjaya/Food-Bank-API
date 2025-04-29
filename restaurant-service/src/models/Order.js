const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MenuItem",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  selectedAddons: [{
    addonGroup: String,
    selections: [{
      name: String,
      price: Number
    }]
  }],
  specialInstructions: String,
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "preparing", "ready", "in-delivery", "delivered", "cancelled"],
    default: "pending",
  },
  orderType: {
    type: String,
    enum: ["delivery", "pickup", "dine-in"],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },
  // For delivery orders
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
  },
  // For dine-in orders
  tableNumber: String,
  reservationDate: Date,
  reservationTime: String,
  // For pickup orders
  pickupLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant"
  },
  estimatedPickupTime: Date,
  // Common fields
  estimatedDeliveryTime: Date,
  specialInstructions: String,
  deliveryPersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  deliveredAt: Date,
  cancelledAt: Date,
  cancellationReason: String
}, {
  timestamps: true
});

// Generate orderId before validation
orderSchema.pre('validate', async function(next) {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `ORD${String(count + 1001).padStart(6, '0')}`;
  }
  next();
});

// Validate required fields based on orderType
orderSchema.pre('validate', function(next) {
  if (this.orderType === 'delivery' && !this.deliveryAddress) {
    next(new Error('Delivery address is required for delivery orders'));
  } else if (this.orderType === 'dine-in' && !this.tableNumber) {
    next(new Error('Table number is required for dine-in orders'));
  } else if (this.orderType === 'pickup' && !this.pickupLocation) {
    next(new Error('Pickup location is required for pickup orders'));
  } else {
    next();
  }
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
