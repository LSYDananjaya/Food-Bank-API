const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const searchRoutes = require("./routes/searchRoutes");
const dotenv = require("dotenv");
const cron = require("node-cron");
const axios = require("axios");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5010;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("Connected to MongoDB");
  
  // Schedule regular data synchronization
  setupSyncJobs();
})
.catch(err => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});

// Set up scheduled data synchronization jobs
function setupSyncJobs() {
  if (process.env.ENABLE_SYNC_JOBS === 'true') {
    // Sync restaurant data every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      console.log('Running scheduled restaurant data sync');
      try {
        await axios.post(
          `http://localhost:${PORT}/internal/sync/restaurants`,
          {},
          { headers: { 'x-service-key': process.env.INTERNAL_API_KEY } }
        );
      } catch (error) {
        console.error('Restaurant data sync job failed:', error.message);
      }
    });

    // Sync menu data every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      console.log('Running scheduled menu data sync');
      try {
        await axios.post(
          `http://localhost:${PORT}/internal/sync/menu-items`,
          {},
          { headers: { 'x-service-key': process.env.INTERNAL_API_KEY } }
        );
      } catch (error) {
        console.error('Menu data sync job failed:', error.message);
      }
    });
    
    console.log('Data synchronization jobs scheduled');
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Search service is running" });
});

// Routes
app.use("/", searchRoutes);

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
  console.log(`Search service running on port ${PORT}`);
});
