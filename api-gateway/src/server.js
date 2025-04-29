const express = require('express');
const cors = require('cors');
const setupProxies = require('./proxy');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'API Gateway is running' });
});

// Setup proxy routes
setupProxies(app);

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
