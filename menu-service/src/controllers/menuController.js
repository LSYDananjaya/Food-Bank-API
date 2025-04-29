const MenuSelection = require("../models/MenuSelection");
const MenuCategory = require("../models/MenuCategory");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/menu-items';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
}).single('image');

// Upload image
exports.uploadImage = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Use full URL path for images
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/menu-items/${req.file.filename}`;
    
    res.json({ imageUrl });
  });
};

exports.getMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuSelection.find().populate('restaurantId', 'name');
    
    // Add base URL to all image URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const itemsWithFullUrls = menuItems.map(item => ({
      ...item.toObject(),
      imageUrl: item.imageUrl.startsWith('http') ? item.imageUrl : `${baseUrl}${item.imageUrl}`
    }));
    
    res.json(itemsWithFullUrls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMenuItemsByRestaurant = async (req, res) => {
  try {
    const menuItems = await MenuSelection.find({ restaurantId: req.params.restaurantId });
    
    // Add base URL to all image URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const itemsWithFullUrls = menuItems.map(item => ({
      ...item.toObject(),
      imageUrl: item.imageUrl.startsWith('http') ? item.imageUrl : `${baseUrl}${item.imageUrl}`
    }));
    
    res.json(itemsWithFullUrls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMenuItemById = async (req, res) => {
  try {
    const { itemId, restaurantId } = req.params;
    const menuItem = await MenuSelection.findOne({
      _id: itemId,
      restaurantId: restaurantId
    }).populate('categoryId');
    
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    
    // Add base URL to image URL if it's not already a full URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const itemWithFullUrl = {
      ...menuItem.toObject(),
      imageUrl: menuItem.imageUrl.startsWith('http') ? menuItem.imageUrl : `${baseUrl}${menuItem.imageUrl}`
    };
    
    res.json(itemWithFullUrl);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createMenuItem = async (req, res) => {
  const newMenuItem = new MenuSelection(req.body);
  try {
    const savedMenuItem = await newMenuItem.save();
    
    // Notify search service about new menu item
    try {
      await axios.post(
        `${process.env.SEARCH_SERVICE_URL}/internal/sync/menu-items`,
        {},
        { 
          headers: { 
            'x-service-key': process.env.INTERNAL_API_KEY 
          } 
        }
      );
    } catch (syncError) {
      console.error("Failed to sync with search service:", syncError.message);
      // Continue despite sync error
    }
    
    res.status(201).json(savedMenuItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const updatedMenuItem = await MenuSelection.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedMenuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    
    // Notify search service about updated menu
    try {
      await axios.post(
        `${process.env.SEARCH_SERVICE_URL}/internal/sync/menu-items`,
        {},
        { 
          headers: { 
            'x-service-key': process.env.INTERNAL_API_KEY 
          } 
        }
      );
    } catch (syncError) {
      console.error("Failed to sync with search service:", syncError.message);
      // Continue despite sync error
    }
    
    res.json(updatedMenuItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuSelection.findByIdAndDelete(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    
    // Notify search service about deleted menu item
    try {
      await axios.post(
        `${process.env.SEARCH_SERVICE_URL}/internal/sync/menu-items`,
        {},
        { 
          headers: { 
            'x-service-key': process.env.INTERNAL_API_KEY 
          } 
        }
      );
    } catch (syncError) {
      console.error("Failed to sync with search service:", syncError.message);
      // Continue despite sync error
    }
    
    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Category Management
exports.getCategories = async (req, res) => {
  try {
    const categories = await MenuCategory.find().sort({ displayOrder: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCategoriesByRestaurant = async (req, res) => {
  try {
    const categories = await MenuCategory.find({
      restaurantId: req.params.restaurantId,
      isActive: true
    }).sort({ displayOrder: 1 });
    
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const newCategory = new MenuCategory({
      name: req.body.name,
      description: req.body.description,
      restaurantId: req.body.restaurantId,
      image: req.body.image,
      displayOrder: req.body.displayOrder
    });
    
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const updatedCategory = await MenuCategory.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    res.json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await MenuCategory.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    
    // Update all menu items that had this category to have no category
    await MenuSelection.updateMany(
      { categoryId: req.params.id },
      { $unset: { categoryId: "" } }
    );
    
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.assignMenuItemCategory = async (req, res) => {
  try {
    const { categoryId } = req.body;
    const menuItem = await MenuSelection.findByIdAndUpdate(
      req.params.id,
      { categoryId },
      { new: true }
    );
    
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    
    res.json(menuItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getMenuDashboard = async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId;
    let query = {};
    
    if (restaurantId) {
      query.restaurantId = restaurantId;
    }
    
    const [totalItems, popularItems] = await Promise.all([
      MenuSelection.countDocuments(query),
      MenuSelection.find(query).sort({ displayOrder: 1 }).limit(5)
    ]);
    
    res.json({
      totalItems,
      popularItems
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCategoriesDashboard = async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId;
    let query = {};
    
    if (restaurantId) {
      query.restaurantId = restaurantId;
    }
    
    const [totalCategories, categoriesWithItemCounts] = await Promise.all([
      MenuCategory.countDocuments(query),
      MenuCategory.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'menuselections',
            localField: '_id',
            foreignField: 'categoryId',
            as: 'items'
          }
        },
        {
          $project: {
            name: 1,
            description: 1,
            image: 1,
            isActive: 1,
            itemCount: { $size: '$items' }
          }
        },
        { $sort: { itemCount: -1 } }
      ])
    ]);
    
    res.json({
      totalCategories,
      categoriesWithItemCounts,
      totalActiveItems: await MenuSelection.countDocuments({ ...query, isActive: true })
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Internal API for service-to-service communication
exports.getAllMenuItemsInternal = async (req, res) => {
  try {
    const items = await MenuSelection.find({ isActive: true })
      .populate('categoryId', 'name')
      .populate('restaurantId', 'name');
    
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
