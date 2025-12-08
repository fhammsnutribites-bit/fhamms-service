const express = require('express');
const jwt = require('jsonwebtoken');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const router = express.Router();

// Auth middleware (same pattern used elsewhere)
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get current user's cart (create if missing)
router.get('/', auth, async (req, res) => {
  let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
  if (!cart) {
    cart = new Cart({ user: req.user.id, items: [] });
    await cart.save();
  }
  res.json(cart);
});

// Add or update an item in cart
// Body: { productId, qty, price?, weight? }
router.post('/items', auth, async (req, res) => {
  const { productId, qty = 1, price, weight } = req.body;
  if (!productId) return res.status(400).json({ message: 'productId required' });

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const itemPrice = typeof price === 'number' ? price : (product.price || product.basePrice || 0);

  const cart = await Cart.findOneAndUpdate(
    { user: req.user.id },
    { $setOnInsert: { user: req.user.id } },
    { upsert: true, new: true }
  );

  // Try to find existing item with same product and weight
  const existingIdx = cart.items.findIndex(i => i.product.toString() === productId.toString() && (i.weight || null) === (weight || null));
  if (existingIdx > -1) {
    cart.items[existingIdx].qty = cart.items[existingIdx].qty + Number(qty);
    cart.items[existingIdx].price = itemPrice;
  } else {
    cart.items.push({ product: productId, qty: Number(qty), price: itemPrice, weight });
  }

  await cart.save();
  await cart.populate('items.product');
  res.status(201).json(cart);
});

// Update item quantity
router.put('/items/:itemId', auth, async (req, res) => {
  const { itemId } = req.params;
  const { qty } = req.body;
  if (typeof qty !== 'number') return res.status(400).json({ message: 'qty number required' });

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return res.status(404).json({ message: 'Cart not found' });

  const item = cart.items.id(itemId);
  if (!item) return res.status(404).json({ message: 'Item not found' });

  if (qty <= 0) {
    item.remove();
  } else {
    item.qty = qty;
  }

  await cart.save();
  await cart.populate('items.product');
  res.json(cart);
});

// Remove an item
router.delete('/items/:itemId', auth, async (req, res) => {
  const { itemId } = req.params;
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return res.status(404).json({ message: 'Cart not found' });

  const item = cart.items.id(itemId);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  item.remove();
  await cart.save();
  await cart.populate('items.product');
  res.json(cart);
});

// Clear cart
router.delete('/', auth, async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return res.status(404).json({ message: 'Cart not found' });
  cart.items = [];
  await cart.save();
  res.json(cart);
});

module.exports = router;
