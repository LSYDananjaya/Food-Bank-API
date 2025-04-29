const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'delivered', 'cancelled'],
        default: 'pending'
    },
    assignedDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedAt: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    address: {
        street: {
            type: String,
            required: true
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                required: true
            }
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        zipCode: {
            type: String,
            required: true
        }
    },
    deliveryTime: {
        type: Date
    },
    assignedDriver: {
        type: String
    },    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

deliverySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Create a 2dsphere index for geospatial queries
deliverySchema.index({ 'address.location': '2dsphere' });

const Delivery = mongoose.model('Delivery', deliverySchema);

module.exports = Delivery;
