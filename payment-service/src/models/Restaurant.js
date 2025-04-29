const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  cuisine: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: null
  },
  rating: {
    type: Number,
    default: 0
  },
  price: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add text index for better search performance
restaurantSchema.index({ 
  name: 'text', 
  cuisine: 'text', 
  location: 'text'
});

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

module.exports = Restaurant;
