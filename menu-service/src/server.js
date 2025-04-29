const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const menuRoutes = require("./routes/menuRoutes");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5004;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Connect to database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Menu service is running" });
});

// Routes
app.use("/", menuRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Menu service running on port ${PORT}`);
});
