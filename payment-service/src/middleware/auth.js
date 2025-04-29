const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication required' });
  }
};

const serviceAuth = (req, res, next) => {
  try {
    const serviceKey = req.header('x-service-key');
    if (serviceKey !== process.env.INTERNAL_API_KEY) {
      throw new Error();
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid service key' });
  }
};

module.exports = { auth, serviceAuth };
