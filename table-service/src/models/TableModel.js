const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  tableNumber: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ["available", "reserved", "occupied", "maintenance"],
    default: "available",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Update the updatedAt timestamp before saving
tableSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Table = mongoose.model("Table", tableSchema);

module.exports = Table;
