const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");

// Enhanced error handling wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(error.message);
    next(error);
  });
};

// Generate a custom userId
const generateUserId = async () => {
  try {
    // Find all users and extract the highest number
    const users = await User.find({ userId: /^User\d+$/ });
    let maxNumber = 100; // Start from 101 if no users exist
    
    for (const user of users) {
      const match = user.userId.match(/^User(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    
    const nextNumber = maxNumber + 1;
    return `User${nextNumber}`;
  } catch (error) {
    console.error("Error generating userId:", error);
    throw new Error("Failed to generate unique user ID");
  }
};

// Helper function to parse phone number with country code
const parsePhoneNumber = (phoneStr) => {
  // Handle formats like "+1 1234567890" or "+44 1234567890"
  const regex = /^\+?(\d+)\s*(.*)$/;
  const match = phoneStr.match(regex);
  
  if (match) {
    const countryCode = match[1];
    // Remove any non-digit characters from the phone number
    const phoneNumber = match[2].replace(/\D/g, '');
    return { countryCode, phoneNumber };
  }
  
  // If no country code is found, return the cleaned number only
  return {
    countryCode: "1", // Default to US
    phoneNumber: phoneStr.replace(/\D/g, '')
  };
};

// Get all users (admin only)
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    res.json({
      users,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, mobileNo, password, address } = req.body;
    
    // Validate required fields
    const requiredFields = { firstName, lastName, email, mobileNo, password };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || typeof value !== 'string' || !value.trim()) {
        return res.status(400).json({
          success: false,
          message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
        });
      }
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address"
      });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }
    
    // Validate phone number (basic)
    const phoneRegex = /^\d{10,}$/;
    if (!phoneRegex.test(mobileNo.replace(/\D/g, ''))) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number (at least 10 digits)"
      });
    }
    
    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }
    
    // Parse the phone number to extract country code
    const { countryCode, phoneNumber } = parsePhoneNumber(mobileNo);
    
    // Format the phone number with country code for storage
    const formattedPhone = `+${countryCode} ${phoneNumber}`;
    
    // Generate userId
    const userId = await generateUserId();
    
    // Get role from request body or default to 'user'
    const role = req.body.role || 'user';
    
    // Validate role
    if (!['user', 'deliveryPerson', 'restaurantOwner'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified"
      });
    }
    
    // Create new user
    const newUser = new User({
      userId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      mobileNo: formattedPhone,
      countryCode,
      password,
      ...(address && Object.values(address).some(val => val) ? { address } : {}),
      role
    });
    
    // If country flag URL was provided
    if (req.body.countryFlag) {
      newUser.countryFlag = req.body.countryFlag;
    }
    
    const savedUser = await newUser.save();
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: savedUser._id,
        role: savedUser.role,
        mobileNo: savedUser.mobileNo, // Include mobile number in the token
        email: savedUser.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    // Return response
    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        id: savedUser._id,
        userId: savedUser.userId,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        mobileNo: savedUser.mobileNo,
        countryCode: savedUser.countryCode,
        countryFlag: savedUser.countryFlag,
        role: savedUser.role,
        address: savedUser.address,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt
      },
      token
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Error during registration"
    });
  }
};

// Login a user
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Check for user
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  
  // Verify password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  
  // Update last login time
  user.lastLogin = new Date();
  await user.save();
  
  // Create JWT token with mobile number included
  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      mobileNo: user.mobileNo, // Include mobile number in the token
      email: user.email,
      assignedRestaurant: user.assignedRestaurant
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  // Prepare response data
  const responseData = {
    id: user._id,
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    mobileNo: user.mobileNo,
    countryCode: user.countryCode || (user.mobileNo ? parsePhoneNumber(user.mobileNo).countryCode : '1'),
    countryFlag: user.countryFlag,
    role: user.role,
    avatar: user.avatar,
    address: user.address,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    token,
  };
  
  // Add role-specific data
  if (user.role === 'restaurantOwner') {
    responseData.assignedRestaurant = user.assignedRestaurant;
  } else if (user.role === 'deliveryPerson') {
    // In microservices, we'll need to fetch this data from the order service
    try {
      const activeDeliveriesResponse = await axios.get(
        `${process.env.ORDER_SERVICE_URL}/internal/orders/delivery-person/${user._id}`,
        { 
          headers: { 
            'x-service-key': process.env.INTERNAL_API_KEY 
          } 
        }
      );
      
      responseData.activeDeliveries = activeDeliveriesResponse.data;
      responseData.deliveryStatus = user.deliveryStatus || 'available';
    } catch (error) {
      console.error('Error fetching delivery person data:', error.message);
      // Continue without active deliveries data
      responseData.activeDeliveries = [];
      responseData.deliveryStatus = user.deliveryStatus || 'available';
    }
  }
  
  res.json(responseData);
});

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Users can only view their own profile unless they're admins
    if (req.user.role !== 'admin' && req.user.id.toString() !== req.params.id) {
      return res.status(403).json({ message: "Not authorized to view other users' profiles" });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user details
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, mobileNo, address, role, assignedRestaurantId, countryFlag } = req.body;
  
  try {
    // Only admins can change roles
    if (role && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to change roles" });
    }
    
    // Users can only update their own profiles unless they're admins
    if (req.user.role !== 'admin' && req.user.id.toString() !== id) {
      return res.status(403).json({ message: "Not authorized to update other users" });
    }
    
    const updateData = {};
    
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (address) updateData.address = address;
    
    // Only admins can update roles
    if (role && req.user.role === 'admin') {
      updateData.role = role;
    }
    
    // Process the phone number if provided
    if (mobileNo) {
      // Parse the phone number to extract country code
      const { countryCode, phoneNumber } = parsePhoneNumber(mobileNo);
      // Format the phone number with country code for storage
      const formattedPhone = `+${countryCode} ${phoneNumber}`;
      updateData.mobileNo = formattedPhone;
      updateData.countryCode = countryCode;
    }
    
    // Update country flag if provided
    if (countryFlag) {
      updateData.countryFlag = countryFlag;
    }
    
    if (role === 'restaurantOwner' && assignedRestaurantId) {
      updateData.assignedRestaurant = assignedRestaurantId;
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Only admins can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to delete users" });
    }
    
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create user (admin only)
const createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      mobileNo,
      password,
      role,
      assignedRestaurantId
    } = req.body;
    
    // Generate unique userId
    const userId = await generateUserId();
    
    const user = new User({
      userId,
      firstName,
      lastName,
      email,
      mobileNo,
      password,
      role: role || 'user'
    });
    
    if (role === 'restaurantOwner' && assignedRestaurantId) {
      user.assignedRestaurant = assignedRestaurantId;
    }
    
    await user.save();
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get user addresses
const getUserAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user.address ? [user.address] : []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a new address for user
const addUserAddress = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { street, city, state, zipCode, isDefault } = req.body;
    
    // For now, we only support one address per user
    user.address = { street, city, state, zipCode };
    await user.save();
    
    res.status(201).json(user.address);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update user address
const updateUserAddress = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { street, city, state, zipCode, isDefault } = req.body;
    user.address = { street, city, state, zipCode };
    await user.save();
    
    res.json(user.address);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete user address
const deleteUserAddress = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    user.address = undefined;
    await user.save();
    
    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Internal API for service-to-service communication
const getUserForInternalService = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  getUserForInternalService
};
