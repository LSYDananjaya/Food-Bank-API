const { createError } = require('../utils/error');

const validateDeliveryPerson = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'DELIVERY_PERSON') {
            return next(createError(403, 'Access denied. Delivery person role required.'));
        }
        next();
    } catch (err) {
        next(createError(500, 'Error validating delivery person'));
    }
};

module.exports = {
    validateDeliveryPerson
};
