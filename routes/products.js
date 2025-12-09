const express = require('express');
const Product = require('../models/Product');
const { auth, admin } = require('../middleware/auth');

const router = express.Router();

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
