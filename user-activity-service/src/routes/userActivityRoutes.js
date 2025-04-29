const express = require('express');
const router = express.Router();
const { auth, serviceAuth } = require('../middleware/auth');
const { 
  getUserActivities, 
  getUserActivityStats,
  createActivityInternal,
  getUserActivitiesInternal
} = require('../controllers/userActivityController');

// Public routes with user authentication
router.get('/', auth, getUserActivities);
router.get('/stats', auth, getUserActivityStats);

// Internal routes for service-to-service communication
router.post('/internal/activity', serviceAuth, createActivityInternal);
router.get('/internal/users/:userId/activities', serviceAuth, getUserActivitiesInternal);

module.exports = router;
