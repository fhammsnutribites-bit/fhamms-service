const mongoose = require('mongoose');

const promoSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  description: { type: String },
  discountType: { 
    type: String, 
    enum: ['percentage', 'fixed'], 
    required: true 
  },
  discountValue: { 
    type: Number, 
    required: true,
    min: 0
  },
  minOrderAmount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  maxDiscountAmount: { 
    type: Number,
    min: 0
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  usageLimit: { 
    type: Number,
    min: 0
  },
  usedCount: { 
    type: Number, 
    default: 0 
  },
  usedBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }]
}, { timestamps: true });

// Index for faster lookups
promoSchema.index({ code: 1, isActive: 1 });

// Method to validate promo code
promoSchema.methods.isValid = function(orderAmount, userId) {
  const now = new Date();
  
  // Check if active
  if (!this.isActive) {
    return { valid: false, message: 'Promo code is not active' };
  }
  
  // Check date range
  if (now < this.startDate || now > this.endDate) {
    return { valid: false, message: 'Promo code has expired or not yet active' };
  }
  
  // Check minimum order amount
  if (orderAmount < this.minOrderAmount) {
    return { 
      valid: false, 
      message: `Minimum order amount of ₹${this.minOrderAmount} required` 
    };
  }
  
  // Check usage limit
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'Promo code usage limit reached' };
  }
  
  // Check if user has already used this code (optional - can be removed if users can reuse codes)
  if (userId && this.usedBy.includes(userId)) {
    return { valid: false, message: 'You have already used this promo code' };
  }
  
  return { valid: true };
};

// Method to calculate discount
promoSchema.methods.calculateDiscount = function(orderAmount) {
  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (orderAmount * this.discountValue) / 100;
    // Apply max discount limit if set
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
  } else if (this.discountType === 'fixed') {
    discount = this.discountValue;
    // Don't allow discount more than order amount
    if (discount > orderAmount) {
      discount = orderAmount;
    }
  }
  
  return Math.round(discount * 100) / 100; // Round to 2 decimal places
};

const PromoCode = mongoose.model('PromoCode', promoSchema);
module.exports = PromoCode;



