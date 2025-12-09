const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  qty: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true }, // Discounted price
  originalPrice: { type: Number }, // Original price before discount
  weight: { type: Number },
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  sessionId: { type: String, required: false },
  items: [cartItemSchema]
}, { timestamps: true });

// Index to ensure one cart per user or session
cartSchema.index({ user: 1 }, { sparse: true });
cartSchema.index({ sessionId: 1 }, { unique: true, sparse: true });

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
