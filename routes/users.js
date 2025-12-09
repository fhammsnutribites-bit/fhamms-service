const express = require('express');
const User = require('../models/User');
const { auth, admin } = require('../middleware/auth');

const router = express.Router();

// List all users (admin)
router.get('/', auth, admin, async (req, res) => {
  res.json(await User.find().select('-password'));
});

// Delete a user by id (admin)
router.delete('/:id', auth, admin, async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User deleted' });
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// Update user profile: allow name, email, password
router.put('/me', auth, async (req, res) => {
  const updates = {};
  const { name, email, password } = req.body;
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (password) updates.password = password;
  let user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  Object.assign(user, updates);
  await user.save();
  user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

// Add address
router.post('/me/address', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  user.addresses.push(req.body);
  await user.save();
  res.json(user.addresses);
});

// Edit address (by array index)
router.put('/me/address/:idx', auth, async (req, res) => {
  const { idx } = req.params;
  const user = await User.findById(req.user.id);
  if(+idx < 0 || +idx >= user.addresses.length) return res.status(404).json({ message: 'No such address' });
  user.addresses[idx] = req.body;
  await user.save();
  res.json(user.addresses);
});

// Delete address
router.delete('/me/address/:idx', auth, async (req, res) => {
  const { idx } = req.params;
  const user = await User.findById(req.user.id);
  if(+idx < 0 || +idx >= user.addresses.length) return res.status(404).json({ message: 'No such address' });
  user.addresses.splice(idx,1);
  await user.save();
  res.json(user.addresses);
});

// Add payment method (mock)
router.post('/me/payment', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  user.paymentMethods.push(req.body);
  await user.save();
  res.json(user.paymentMethods);
});
// Edit payment method (mock, by index)
router.put('/me/payment/:idx', auth, async (req, res) => {
  const { idx } = req.params;
  const user = await User.findById(req.user.id);
  if(+idx < 0 || +idx >= user.paymentMethods.length) return res.status(404).json({ message: 'No such payment method' });
  user.paymentMethods[idx] = req.body;
  await user.save();
  res.json(user.paymentMethods);
});
// Delete payment method (mock)
router.delete('/me/payment/:idx', auth, async (req, res) => {
  const { idx } = req.params;
  const user = await User.findById(req.user.id);
  if(+idx < 0 || +idx >= user.paymentMethods.length) return res.status(404).json({ message: 'No such payment method' });
  user.paymentMethods.splice(idx,1);
  await user.save();
  res.json(user.paymentMethods);
});

module.exports = router;
