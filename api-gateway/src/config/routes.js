// Routes configuration for API Gateway
// This file defines all routes and their corresponding microservice targets

const routes = [
  // Delivery Service Routes
  {
    context: '/api/delivery',
    target: 'http://delivery-service:5012',
    auth: true,
    pathRewrite: {
      '^/api/delivery': '/'
    }
  },

  // Payment Service Routes
  {
    context: '/api/payments',
    target: 'http://payment-service:5009',
    auth: true,
    pathRewrite: {
      '^/api/payments': '/'
    }
  },
  
  // User Service Routes
  {
    context: '/api/users',
    target: 'http://user-service:5002',
    auth: false,
    pathRewrite: {
      '^/api/users': '/users'
    }
  },

  // Restaurant Service Routes
  {
    context: '/api/restaurants',
    target: 'http://restaurant-service:5003',
    auth: false,
    pathRewrite: {
      '^/api/restaurants': '/restaurants'
    }
  },

  // Menu Service Routes
  {
    context: '/api/menus',
    target: 'http://menu-service:5004',
    auth: false,
    pathRewrite: {
      '^/api/menus': '/menus'
    }
  },

  // Cart Service Routes
  {
    context: '/api/cart',
    target: 'http://cart-service:5005',
    auth: true,
    pathRewrite: {
      '^/api/cart': '/cart'
    }
  },

  // Order Service Routes
  {
    context: '/api/orders',
    target: 'http://order-service:5006',
    auth: true,
    pathRewrite: {
      '^/api/orders': '/orders'
    }
  },

  // Table Service Routes
  {
    context: '/api/tables',
    target: 'http://table-service:5007',
    auth: true,
    pathRewrite: {
      '^/api/tables': '/tables'
    }
  },

  // Notification Service Routes
  {
    context: '/api/notifications',
    target: 'http://notification-service:5008',
    auth: true,
    pathRewrite: {
      '^/api/notifications': '/notifications'
    }
  },

  // Search Service Routes
  {
    context: '/api/search',
    target: 'http://search-service:5010',
    auth: false,
    pathRewrite: {
      '^/api/search': '/search'
    }
  },

  // User Activity Service Routes
  {
    context: '/api/user-activity',
    target: 'http://user-activity-service:5011',
    auth: true,
    pathRewrite: {
      '^/api/user-activity': '/user-activity'
    }
  },

  // Health Check Routes
  {
    context: '/health',
    target: 'http://api-gateway:5000',
    auth: false
  }
];

module.exports = routes;
