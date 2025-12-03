const express = require('express');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware to verify JWT and admin
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

// Get all products
router.get('/', async (req, res) => {
  res.json(await Product.find().sort({ createdAt: -1 })
  .limit(20));
});

// Get single product
router.get('/:id', async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: 'Not found' });
  res.json(p);
});

// Create product (admin only)
router.post('/', auth, admin, async (req, res) => {
  const product = new Product({ ...req.body, user: req.user.id });
  await product.save();
  res.status(201).json(product);
});

// Update product (admin only)
router.put('/:id', auth, admin, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) return res.status(404).json({ message: 'Not found' });
  res.json(product);
});

// Delete product (admin only)
router.delete('/:id', auth, admin, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Product deleted' });
});

module.exports = router;
