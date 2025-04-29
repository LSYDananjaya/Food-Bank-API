const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MenuSelection",
    required: true,
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
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
  addons: {
    sauce: String,
    toppings: [String],
    instructions: String
  },
  preference: {
    type: {
      type: String,
      enum: ['pickup', 'delivery', 'dine-in'],
      required: true
    },
    details: {
      id: String,
      name: String,
      address: String,
      date: String,
      time: String,
      table: {
        _id: String,
        tableNumber: String,
        capacity: Number,
        location: String,
        status: String
      }
    }
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
