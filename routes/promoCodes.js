const express = require('express');
const PromoCode = require('../models/PromoCode');
const { auth, admin } = require('../middleware/auth');

const router = express.Router();

// Validate promo code (public endpoint for users)
router.post('/validate', async (req, res) => {
  try {
    const { code, orderAmount, userId, cartItems } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Promo code is required' });
    }
    
    if (orderAmount === undefined || orderAmount < 0) {
      return res.status(400).json({ message: 'Valid order amount is required' });
    }
    
    // Check if any cart item has product-level discount
    if (cartItems && Array.isArray(cartItems)) {
      const hasProductDiscount = cartItems.some(item => {
        // If originalPrice exists and is different from price, product discount is applied
        return item.originalPrice && item.originalPrice !== item.price;
      });
      
      if (hasProductDiscount) {
        return res.status(400).json({
          valid: false,
          message: 'Promo codes cannot be applied when products already have discounts. Please remove discounted items from cart to use promo code.'
        });
      }
    }
    
    const promoCode = await PromoCode.findOne({ 
      code: code.toUpperCase().trim(),
      isActive: true 
    });
    
    if (!promoCode) {
      return res.status(404).json({ 
        valid: false,
        message: 'Invalid promo code' 
      });
    }
    
    // Validate the promo code
    const validation = promoCode.isValid(orderAmount, userId);
    
    if (!validation.valid) {
      return res.status(400).json({
        valid: false,
        message: validation.message
      });
    }
    
    // Calculate discount
    const discount = promoCode.calculateDiscount(orderAmount);
    const finalAmount = orderAmount - discount;
    
    res.json({
      valid: true,
      code: promoCode.code,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      discount: discount,
      finalAmount: finalAmount,
      message: 'Promo code applied successfully'
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get all promo codes (admin only)
router.get('/', auth, admin, async (req, res) => {
  try {
    const promoCodes = await PromoCode.find().sort({ createdAt: -1 });
    res.json(promoCodes);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get single promo code (admin only)
router.get('/:id', auth, admin, async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      return res.status(404).json({ message: 'Promo code not found' });
    }
    res.json(promoCode);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Create promo code (admin only)
router.post('/', auth, admin, async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      isActive,
      usageLimit
    } = req.body;
    
    // Validate required fields
    if (!code || !discountType || !discountValue || !startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Code, discountType, discountValue, startDate, and endDate are required' 
      });
    }
    
    // Validate discount type
    if (!['percentage', 'fixed'].includes(discountType)) {
      return res.status(400).json({ 
        message: 'discountType must be either "percentage" or "fixed"' 
      });
    }
    
    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ 
        message: 'End date must be after start date' 
      });
    }
    
    // Validate discount value
    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      return res.status(400).json({ 
        message: 'Percentage discount must be between 0 and 100' 
      });
    }
    
    if (discountType === 'fixed' && discountValue < 0) {
      return res.status(400).json({ 
        message: 'Fixed discount must be positive' 
      });
    }
    
    const promoCode = new PromoCode({
      code: code.toUpperCase().trim(),
      description,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: isActive !== undefined ? isActive : true,
      usageLimit
    });
    
    await promoCode.save();
    res.status(201).json(promoCode);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Promo code already exists' });
    }
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Update promo code (admin only)
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      return res.status(404).json({ message: 'Promo code not found' });
    }
    
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      isActive,
      usageLimit
    } = req.body;
    
    // Update fields if provided
    if (code !== undefined) promoCode.code = code.toUpperCase().trim();
    if (description !== undefined) promoCode.description = description;
    if (discountType !== undefined) {
      if (!['percentage', 'fixed'].includes(discountType)) {
        return res.status(400).json({ 
          message: 'discountType must be either "percentage" or "fixed"' 
        });
      }
      promoCode.discountType = discountType;
    }
    if (discountValue !== undefined) {
      if (promoCode.discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
        return res.status(400).json({ 
          message: 'Percentage discount must be between 0 and 100' 
        });
      }
      if (promoCode.discountType === 'fixed' && discountValue < 0) {
        return res.status(400).json({ 
          message: 'Fixed discount must be positive' 
        });
      }
      promoCode.discountValue = discountValue;
    }
    if (minOrderAmount !== undefined) promoCode.minOrderAmount = minOrderAmount;
    if (maxDiscountAmount !== undefined) promoCode.maxDiscountAmount = maxDiscountAmount;
    if (startDate !== undefined) promoCode.startDate = new Date(startDate);
    if (endDate !== undefined) promoCode.endDate = new Date(endDate);
    if (isActive !== undefined) promoCode.isActive = isActive;
    if (usageLimit !== undefined) promoCode.usageLimit = usageLimit;
    
    // Validate dates if both are provided
    if (startDate !== undefined || endDate !== undefined) {
      if (new Date(promoCode.startDate) >= new Date(promoCode.endDate)) {
        return res.status(400).json({ 
          message: 'End date must be after start date' 
        });
      }
    }
    
    await promoCode.save();
    res.json(promoCode);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Promo code already exists' });
    }
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Delete promo code (admin only)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      return res.status(404).json({ message: 'Promo code not found' });
    }
    await promoCode.deleteOne();
    res.json({ message: 'Promo code deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;

