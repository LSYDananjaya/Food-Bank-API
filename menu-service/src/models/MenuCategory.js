const mongoose = require("mongoose");

const menuCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  image: {
    type: String
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

menuCategorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const MenuCategory = mongoose.model("MenuCategory", menuCategorySchema);

module.exports = MenuCategory;
