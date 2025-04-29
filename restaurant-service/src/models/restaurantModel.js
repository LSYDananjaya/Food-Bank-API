const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  dineIn: { type: Boolean, required: true },
  pickup: { type: Boolean, required: true },
  reservation: { type: Boolean, required: true },
});

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  location: { type: String, required: true },
  openingHours: { type: String, required: true },
  rating: { type: Number, required: true },
  promo: { type: String },
  cuisine: { type: String, required: true },
  price: { type: String, required: true },
  services: { type: serviceSchema, required: true },
  waitTime: { type: String, required: true },
  popular: { type: Boolean, required: true },
  isActive: { type: Boolean, default: true }
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
