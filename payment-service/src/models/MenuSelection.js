const mongoose = require("mongoose");

const menuSelectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  }
}, {
  timestamps: true
});

// Add text index for better search functionality
menuSelectionSchema.index({ 
  name: 'text', 
  description: 'text' 
});

const MenuSelection = mongoose.model("MenuSelection", menuSelectionSchema);

module.exports = MenuSelection;
