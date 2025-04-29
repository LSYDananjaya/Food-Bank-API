const mongoose = require('mongoose');
const Delivery = require('../models/delivery');
const { AppError } = require('../utils/error');

const createDelivery = async (req, res, next) => {
    try {
        const delivery = new Delivery(req.body);
        await delivery.save();
        res.status(201).json(delivery);
    } catch (error) {
        next(new AppError('Error creating delivery', 400));
    }
};

const getDelivery = async (req, res, next) => {
    try {
        const delivery = await Delivery.findById(req.params.id);
        if (!delivery) {
            return next(new AppError('Delivery not found', 404));
        }
        res.json(delivery);
    } catch (error) {
        next(new AppError('Error fetching delivery', 400));
    }
};

const updateDeliveryStatus = async (req, res, next) => {
    try {
        const delivery = await Delivery.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true, runValidators: true }
        );
        if (!delivery) {
            return next(new AppError('Delivery not found', 404));
        }
        res.json(delivery);
    } catch (error) {
        next(new AppError('Error updating delivery status', 400));
    }
};

const assignDriver = async (req, res, next) => {
    try {
        const delivery = await Delivery.findByIdAndUpdate(
            req.params.id,
            { 
                assignedDriver: req.body.driverId,
                status: 'in_progress'
            },
            { new: true }
        );
        if (!delivery) {
            return next(new AppError('Delivery not found', 404));
        }
        res.json(delivery);
    } catch (error) {
        next(new AppError('Error assigning driver', 400));
    }
};

const getUserDeliveries = async (req, res, next) => {
    try {
        const deliveries = await Delivery.find({ userId: req.params.userId });
        res.json(deliveries);
    } catch (error) {
        next(new AppError('Error fetching user deliveries', 400));
    }
};

const getDeliveryMetrics = async (req, res, next) => {
    try {
        const metrics = await Delivery.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    averageDeliveryTime: {
                        $avg: {
                            $cond: [
                                { $eq: ['$status', 'delivered'] },
                                { $subtract: ['$deliveredAt', '$createdAt'] },
                                null
                            ]
                        }
                    }
                }
            }
        ]);

        const formattedMetrics = metrics.reduce((acc, curr) => {
            acc[curr._id] = {
                count: curr.count,
                averageDeliveryTime: curr.averageDeliveryTime ? Math.round(curr.averageDeliveryTime / (1000 * 60)) : null // Convert to minutes
            };
            return acc;
        }, {});

        res.json(formattedMetrics);
    } catch (error) {
        next(new AppError('Error fetching delivery metrics', 400));
    }
};

const getActiveDeliveriesInArea = async (req, res, next) => {
    try {
        const { latitude, longitude, radius = 5000 } = req.query; // radius in meters

        const activeDeliveries = await Delivery.find({
            status: 'in_progress',
            'address.location': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: radius
                }
            }
        }).populate('assignedDriver', 'name phone');

        res.json(activeDeliveries);
    } catch (error) {
        next(new AppError('Error fetching active deliveries', 400));
    }
};

const assignDeliveryPerson = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { deliveryPersonId } = req.body;

        if (!deliveryPersonId) {
            return next(new AppError('Delivery person ID is required', 400));
        }

        const delivery = await Delivery.findByIdAndUpdate(
            id,
            {
                assignedDriver: deliveryPersonId,
                status: 'in_progress',
                assignedAt: new Date()
            },
            { new: true, runValidators: true }
        );

        if (!delivery) {
            return next(new AppError('Delivery not found', 404));
        }

        res.json(delivery);
    } catch (error) {
        next(new AppError('Error assigning delivery person', 400));
    }
};

module.exports = {
    createDelivery,
    getDelivery,
    updateDeliveryStatus,
    assignDeliveryPerson,
    getDeliveryMetrics,
    getActiveDeliveriesInArea
};
