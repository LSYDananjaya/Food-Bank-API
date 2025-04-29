const mongoose = require("mongoose");

const addonOptionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Name of the addon option (e.g., "Extra Cheese")
  price: { type: Number, required: true }, // Price for this specific option
});

const addonSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Title of the addon group (e.g., "Toppings")
  type: {
    type: String,
    enum: ["One Choice", "Multiple Choices"],
    required: true,
  }, // Selection type
  options: { type: [addonOptionSchema], required: true }, // Array of addon options
});

const menuItemSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  }, // Reference to the restaurant
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MenuCategory",
  }, // Reference to the menu category
  itemId: { type: String, required: true }, // Unique identifier for the menu item
  name: { type: String, required: true }, // Name of the menu item
  description: { type: String, required: true }, // Description of the menu item
  ingredients: { type: [String], required: true }, // Array of ingredients
  veg: { type: Boolean, required: true }, // Whether the item is vegetarian
  preparationTime: { type: Number, required: true }, // Time in minutes to prepare the item
  addons: { type: [addonSchema], required: false }, // Array of addons
  price: { type: Number, required: true }, // Base price of the menu item
  imageUrl: { type: String, required: true }, // URL of the image
  displayOrder: { type: Number, default: 0 }, // Display order of the menu item
  isActive: { type: Boolean, default: true }, // Whether the menu item is active
  createdAt: { type: Date, default: Date.now }, // Creation date of the menu item
  updatedAt: { type: Date, default: Date.now }, // Last update date of the menu item
});

menuItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const MenuItem = mongoose.model("MenuSelection", menuItemSchema);

module.exports = MenuItem;
