const { createProxyMiddleware } = require('http-proxy-middleware');
const routes = require('./config/routes');
const { auth, isAdmin, isRestaurantOwner, isRestaurantAuthorized, isDeliveryPerson } = require('./middleware/auth');

const setupProxies = (app) => {
  // Loop through route configurations and set up proxies
  routes.forEach(route => {
    console.log(`Setting up proxy for ${route.context} -> ${route.target}`);
    
    const proxyOptions = {
      target: route.target,
      changeOrigin: true,
      pathRewrite: route.pathRewrite || {},
      logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      onError: (err, req, res) => {
        console.error(`Proxy error: ${err.message}`);
        res.status(500).json({ message: 'Service unavailable', error: err.message });
      }
    };
    
    // Apply authentication middleware based on route requirements
    if (route.auth) {
      // Apply specific role-based middleware if specified
      if (route.adminOnly) {
        app.use(route.context, auth, isAdmin, createProxyMiddleware(proxyOptions));
      } else if (route.restaurantOwnerOnly) {
        app.use(route.context, auth, isRestaurantOwner, createProxyMiddleware(proxyOptions));
      } else if (route.restaurantAuthorized) {
        app.use(route.context, auth, isRestaurantAuthorized, createProxyMiddleware(proxyOptions));
      } else if (route.deliveryPersonOnly) {
        app.use(route.context, auth, isDeliveryPerson, createProxyMiddleware(proxyOptions));
      } else {
        // Basic authentication only
        app.use(route.context, auth, createProxyMiddleware(proxyOptions));
      }
    } else {
      // No authentication required
      app.use(route.context, createProxyMiddleware(proxyOptions));
    }
  });
};

module.exports = setupProxies;
