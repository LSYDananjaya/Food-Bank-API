const Cart = require('../models/Cart');
const axios = require('axios');

// Get menu item details from menu service
async function getMenuItemDetails(menuItemId) {
  try {
    const response = await axios.get(`${process.env.MENU_SERVICE_URL}/internal/menu-items/${menuItemId}`, {
      headers: {
        'x-service-key': process.env.INTERNAL_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching menu item ${menuItemId}:`, error.message);
    return null;
  }
}

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Verify user is accessing their own cart
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to access this cart" });
    }
    
    let cart = await Cart.findOne({ userId });
    
    if (!cart) {
      // Return empty cart if not found
      return res.json({ 
        userId, 
        items: [], 
        updatedAt: new Date() 
      });
    }
    
    // Populate menu items from menu service
    const populatedItems = await Promise.all(cart.items.map(async (item) => {
      const menuItemDetails = await getMenuItemDetails(item.menuItem);
      return {
        ...item.toObject(),
        menuItem: menuItemDetails || { _id: item.menuItem, name: 'Unknown item' }
      };
    }));
    
    // Create a populated version of the cart
    const populatedCart = {
      ...cart.toObject(),
      items: populatedItems
    };
    
    res.json(populatedCart);
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { userId, item } = req.body;
    
    // Verify user is modifying their own cart
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to modify this cart" });
    }
    
    // Verify menu item exists
    const menuItemDetails = await getMenuItemDetails(item.menuItem);
    if (!menuItemDetails) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    
    let cart = await Cart.findOne({ userId });
    
    if (!cart) {
      cart = new Cart({
        userId,
        items: [item]
      });
    } else {
      // Check if adding item from a different restaurant
      if (cart.items.length > 0 && cart.items[0].restaurantId.toString() !== item.restaurantId) {
        return res.status(400).json({
          message: "Cannot add items from different restaurants in the same cart. Please clear your cart first."
        });
      }
      
      const existingItemIndex = cart.items.findIndex(
        i => i.menuItem.toString() === item.menuItem &&
        JSON.stringify(i.addons) === JSON.stringify(item.addons)
      );
      
      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += item.quantity;
      } else {
        cart.items.push(item);
      }
    }
    
    await cart.save();
    
    // Populate the cart items for response
    const populatedItems = await Promise.all(cart.items.map(async (cartItem) => {
      const itemDetails = await getMenuItemDetails(cartItem.menuItem);
      return {
        ...cartItem.toObject(),
        menuItem: itemDetails || { _id: cartItem.menuItem, name: 'Unknown item' }
      };
    }));
    
    const populatedCart = {
      ...cart.toObject(),
      items: populatedItems
    };
    
    res.status(201).json(populatedCart);
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(400).json({ message: error.message });
  }
};

// Update cart item quantity
exports.updateQuantity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { itemId, quantity } = req.body;
    
    // Verify user is modifying their own cart
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to modify this cart" });
    }
    
    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    
    const itemIndex = cart.items.findIndex(item => 
      item.menuItem.toString() === itemId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }
    
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
    
    await cart.save();
    
    // Populate the cart items for response
    const populatedItems = await Promise.all(cart.items.map(async (cartItem) => {
      const itemDetails = await getMenuItemDetails(cartItem.menuItem);
      return {
        ...cartItem.toObject(),
        menuItem: itemDetails || { _id: cartItem.menuItem, name: 'Unknown item' }
      };
    }));
    
    const populatedCart = {
      ...cart.toObject(),
      items: populatedItems
    };
    
    res.json(populatedCart);
  } catch (error) {
    console.error("Update quantity error:", error);
    res.status(400).json({ message: error.message });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    
    // Verify user is modifying their own cart
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to modify this cart" });
    }
    
    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    
    const itemIndex = cart.items.findIndex(item => 
      item._id.toString() === itemId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }
    
    cart.items.splice(itemIndex, 1);
    await cart.save();
    
    // Populate the cart items for response
    const populatedItems = await Promise.all(cart.items.map(async (cartItem) => {
      const itemDetails = await getMenuItemDetails(cartItem.menuItem);
      return {
        ...cartItem.toObject(),
        menuItem: itemDetails || { _id: cartItem.menuItem, name: 'Unknown item' }
      };
    }));
    
    const populatedCart = {
      ...cart.toObject(),
      items: populatedItems
    };
    
    res.json(populatedCart);
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(400).json({ message: error.message });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user is modifying their own cart
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to modify this cart" });
    }
    
    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    
    cart.items = [];
    await cart.save();
    
    res.json({
      ...cart.toObject(),
      items: []
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(400).json({ message: error.message });
  }
};

// Internal API for order service to access cart
exports.getCartInternal = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    
    res.json(cart);
  } catch (error) {
    console.error("Internal get cart error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Internal API for order service to clear cart after order creation
exports.clearCartInternal = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    
    cart.items = [];
    await cart.save();
    
    res.json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Internal clear cart error:", error);
    res.status(500).json({ message: error.message });
  }
};
