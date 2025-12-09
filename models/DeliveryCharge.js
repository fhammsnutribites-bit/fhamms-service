const mongoose = require('mongoose');

const deliveryChargeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Charge type: 'fixed', 'percentage', 'tiered', 'free_above'
  chargeType: {
    type: String,
    enum: ['fixed', 'percentage', 'tiered', 'free_above'],
    required: true,
    default: 'fixed'
  },
  // For fixed charge
  fixedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  // For percentage charge
  percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // For free_above: minimum order amount for free delivery
  freeDeliveryAbove: {
    type: Number,
    default: 0,
    min: 0
  },
  // For tiered charges: array of { minAmount, maxAmount, charge }
  tiers: [{
    minAmount: { type: Number, required: true, min: 0 },
    maxAmount: { type: Number, required: true, min: 0 },
    charge: { type: Number, required: true, min: 0 }
  }],
  // Minimum order amount to apply this delivery charge
  minOrderAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Maximum order amount (if applicable)
  maxOrderAmount: {
    type: Number,
    default: null
  },
  // Priority: lower number = higher priority
  priority: {
    type: Number,
    default: 0
  },
  // Active status
  isActive: {
    type: Boolean,
    default: true
  },
  // Applicable locations (if needed in future)
  applicableLocations: [{
    type: String
  }]
}, {
  timestamps: true
});

// Method to calculate delivery charge based on order amount
deliveryChargeSchema.methods.calculateCharge = function(orderAmount) {
  if (!this.isActive) {
    return 0;
  }

  // Check if order amount is within range
  if (orderAmount < this.minOrderAmount) {
    return null; // This rule doesn't apply
  }
  if (this.maxOrderAmount && orderAmount > this.maxOrderAmount) {
    return null; // This rule doesn't apply
  }

  let charge = 0;

  switch (this.chargeType) {
    case 'fixed':
      charge = this.fixedAmount || 0;
      break;

    case 'percentage':
      charge = (orderAmount * (this.percentage || 0)) / 100;
      break;

    case 'free_above':
      if (orderAmount >= (this.freeDeliveryAbove || 0)) {
        charge = 0; // Free delivery
      } else {
        // If order is below free delivery threshold, you might want a default charge
        // For now, return 0, but admin can set a fallback rule
        charge = 0;
      }
      break;

    case 'tiered':
      if (this.tiers && this.tiers.length > 0) {
        // Find the tier that matches the order amount
        const matchingTier = this.tiers.find(tier => 
          orderAmount >= tier.minAmount && 
          (tier.maxAmount === null || orderAmount <= tier.maxAmount)
        );
        if (matchingTier) {
          charge = matchingTier.charge;
        } else {
          // No matching tier, return null to indicate this rule doesn't apply
          return null;
        }
      } else {
        return null;
      }
      break;

    default:
      return null;
  }

  return Math.max(0, charge); // Ensure non-negative
};

// Static method to get applicable delivery charge for an order amount
deliveryChargeSchema.statics.getDeliveryCharge = async function(orderAmount) {
  // Get all active delivery charges, sorted by priority (lower number = higher priority)
  const charges = await this.find({ isActive: true }).sort({ priority: 1 });

  for (const charge of charges) {
    const calculatedCharge = charge.calculateCharge(orderAmount);
    if (calculatedCharge !== null) {
      return {
        charge: calculatedCharge,
        rule: charge
      };
    }
  }

  // Default: no delivery charge
  return {
    charge: 0,
    rule: null
  };
};

const DeliveryCharge = mongoose.model('DeliveryCharge', deliveryChargeSchema);

module.exports = DeliveryCharge;



