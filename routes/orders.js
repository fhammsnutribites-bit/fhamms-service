const express = require('express');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

const router = express.Router();

// JWT Auth middleware (same as products.js)
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const admin = (req, res, next) => {
  if (!req.user?.isAdmin) return res.status(403).json({ message: 'Requires admin' });
  next();
};

// Place new order
router.post('/', auth, async (req, res) => {
  const order = new Order({ ...req.body, user: req.user.id });
  await order.save();
  res.status(201).json(order);
});

// Get all orders (admin)
router.get('/', auth, admin, async (req, res) => {
  res.json(await Order.find().populate('user', 'name email'));
});

// Get logged-in user's orders
router.get('/my', auth, async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).populate('orderItems.product').sort({ createdAt: -1 }).limit(20);
  res.json(orders);
});

// Get single order by ID (user can only see their own orders)
router.get('/:id', auth, async (req, res) => {
  const order = await Order.findById(req.params.id).populate('orderItems.product');
  if (!order) return res.status(404).json({ message: 'Order not found' });
  // Check if order belongs to the user (unless admin)
  if (order.user.toString() !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied' });
  }
  res.json(order);
});

// Update order delivery (admin)
router.put('/:id/deliver', auth, admin, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Not found' });
  order.isDelivered = true;
  order.deliveredAt = new Date();
  await order.save();
  res.json(order);
});

module.exports = router;
