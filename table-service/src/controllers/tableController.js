const Table = require('../models/TableModel');
const axios = require('axios');

// Helper function to validate restaurant existence
async function validateRestaurant(restaurantId) {
  try {
    const response = await axios.get(`${process.env.RESTAURANT_SERVICE_URL}/internal/restaurants/${restaurantId}`, {
      headers: { 'x-service-key': process.env.INTERNAL_API_KEY }
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to validate restaurant: ${error.message}`);
    return null;
  }
}

// Get all tables for a restaurant
exports.getTables = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Validate restaurant exists
    const restaurant = await validateRestaurant(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    
    const tables = await Table.find({ restaurantId });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new table
exports.createTable = async (req, res) => {
  try {
    const { restaurantId, tableNumber, capacity, location, status } = req.body;
    
    // Validate restaurant exists
    const restaurant = await validateRestaurant(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    
    // Check if a table with the same number already exists in this restaurant
    const existingTable = await Table.findOne({ restaurantId, tableNumber });
    if (existingTable) {
      return res.status(400).json({ message: "A table with this number already exists" });
    }
    
    const table = new Table({
      restaurantId,
      tableNumber,
      capacity,
      location,
      status: status || 'available'
    });
    
    const newTable = await table.save();
    res.status(201).json(newTable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a table
exports.updateTable = async (req, res) => {
  try {
    const updatedTable = await Table.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedTable) {
      return res.status(404).json({ message: "Table not found" });
    }
    
    res.json(updatedTable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a table
exports.deleteTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }
    
    res.json({ message: "Table deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get available tables for a specific time
exports.getAvailableTables = async (req, res) => {
  try {
    const { restaurantId, date, time } = req.query;
    
    // Validate restaurant exists
    const restaurant = await validateRestaurant(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    
    // Find all tables for the restaurant that are available
    const availableTables = await Table.find({
      restaurantId,
      status: 'available'
    }).sort({ tableNumber: 1 });
    
    res.json(availableTables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reserve a table
exports.reserveTable = async (req, res) => {
  try {
    const { tableId, date, time } = req.body;
    
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }
    
    if (table.status !== 'available') {
      return res.status(400).json({ message: "Table is not available" });
    }
    
    table.status = 'reserved';
    await table.save();
    
    res.json(table);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Internal API for service-to-service communication
exports.reserveTableInternal = async (req, res) => {
  try {
    const { restaurantId, tableNumber, reservationDate, reservationTime, orderId } = req.body;
    
    const table = await Table.findOne({ restaurantId, tableNumber });
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }
    
    if (table.status !== 'available') {
      return res.status(400).json({ message: "Table is not available" });
    }
    
    table.status = 'reserved';
    await table.save();
    
    res.json({ 
      message: "Table reserved successfully", 
      table: {
        id: table._id,
        tableNumber: table.tableNumber,
        status: table.status
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.releaseTableInternal = async (req, res) => {
  try {
    const { restaurantId, tableNumber, orderId } = req.body;
    
    const table = await Table.findOne({ restaurantId, tableNumber });
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }
    
    table.status = 'available';
    await table.save();
    
    res.json({ 
      message: "Table released successfully", 
      table: {
        id: table._id,
        tableNumber: table.tableNumber,
        status: table.status
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
