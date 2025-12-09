const express = require('express');
const Order = require('../models/Order');
const PromoCode = require('../models/PromoCode');
const { auth, admin } = require('../middleware/auth');

const router = express.Router();

// Place new order
router.post('/', auth, async (req, res) => {
  try {
    const { 
      orderItems, 
      shippingAddress, 
      totalPrice, 
      paymentMethod,
      promoCode: promoCodeInput 
    } = req.body;
    
    // Calculate subtotal from order items
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    // Check if any order item has product-level discount
    // If originalPrice exists in orderItems, check if it differs from price
    const hasProductDiscount = orderItems.some(item => {
      return item.originalPrice && item.originalPrice !== item.price;
    });
    
    let discount = 0;
    let finalPromoCode = null;
    
    // Validate and apply promo code if provided
    if (promoCodeInput) {
      // Restrict promo code if product discounts are applied
      if (hasProductDiscount) {
        return res.status(400).json({ 
          message: 'Promo codes cannot be applied when products already have discounts. Please remove discounted items from cart to use promo code.' 
        });
      }
      
      const promoCode = await PromoCode.findOne({ 
        code: promoCodeInput.toUpperCase().trim(),
        isActive: true 
      });
      
      if (promoCode) {
        const validation = promoCode.isValid(subtotal, req.user.id);
        
        if (validation.valid) {
          discount = promoCode.calculateDiscount(subtotal);
          finalPromoCode = promoCode.code;
          
          // Update promo code usage
          promoCode.usedCount += 1;
          if (!promoCode.usedBy.includes(req.user.id)) {
            promoCode.usedBy.push(req.user.id);
          }
          await promoCode.save();
        } else {
          return res.status(400).json({ 
            message: validation.message 
          });
        }
      } else {
        return res.status(400).json({ 
          message: 'Invalid promo code' 
        });
      }
    }
    
    const finalTotal = subtotal - discount;
    
    // Ensure final total is not negative
    if (finalTotal < 0) {
      return res.status(400).json({ 
        message: 'Invalid order total' 
      });
    }
    
    const order = new Order({
      user: req.user.id,
      orderItems,
      shippingAddress,
      subtotal,
      promoCode: finalPromoCode,
      discount,
      totalPrice: finalTotal,
      paymentMethod
    });
    
    await order.save();
    await order.populate('orderItems.product');
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
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
