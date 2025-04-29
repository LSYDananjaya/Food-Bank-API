const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  mobileNo: {
    type: String,
    required: true,
  },
  countryCode: {
    type: String,
    default: "1" // Default to US code
  },
  countryFlag: {
    type: String,
    default: null
  },
  password: {
    type: String,
    required: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'restaurantOwner', 'deliveryPerson'],
    default: 'user',
    required: true
  },
  assignedRestaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: function() {
      return this.role === 'restaurantOwner';
    }
  },
  avatar: {
    type: String,
    default: null
  },
  resetPasswordOTP: String,
  resetPasswordOTPExpiry: Date,
  lastLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to check if password matches
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
