const express = require('express');
const router = express.Router();
const DeliveryCharge = require('../models/DeliveryCharge');
const { auth, admin } = require('../middleware/auth');

// Public endpoint: Get delivery charge for an order amount
router.post('/calculate', async (req, res) => {
  try {
    const { orderAmount } = req.body;
    
    if (typeof orderAmount !== 'number' || orderAmount < 0) {
      return res.status(400).json({ message: 'Valid order amount is required' });
    }

    const result = await DeliveryCharge.getDeliveryCharge(orderAmount);
    res.json({
      deliveryCharge: result.charge,
      rule: result.rule ? {
        id: result.rule._id,
        name: result.rule.name,
        chargeType: result.rule.chargeType
      } : null
    });
  } catch (err) {
    console.error('Calculate delivery charge error:', err);
    res.status(500).json({ message: 'Failed to calculate delivery charge' });
  }
});

// Admin: Get all delivery charges
router.get('/', auth, admin, async (req, res) => {
  try {
    const charges = await DeliveryCharge.find().sort({ priority: 1, createdAt: -1 });
    res.json(charges);
  } catch (err) {
    console.error('Get delivery charges error:', err);
    res.status(500).json({ message: 'Failed to fetch delivery charges' });
  }
});

// Admin: Get delivery charge by ID
router.get('/:id', auth, admin, async (req, res) => {
  try {
    const charge = await DeliveryCharge.findById(req.params.id);
    if (!charge) {
      return res.status(404).json({ message: 'Delivery charge not found' });
    }
    res.json(charge);
  } catch (err) {
    console.error('Get delivery charge error:', err);
    res.status(500).json({ message: 'Failed to fetch delivery charge' });
  }
});

// Admin: Create delivery charge
router.post('/', auth, admin, async (req, res) => {
  try {
    const {
      name,
      description,
      chargeType,
      fixedAmount,
      percentage,
      freeDeliveryAbove,
      tiers,
      minOrderAmount,
      maxOrderAmount,
      priority,
      isActive,
      applicableLocations
    } = req.body;

    // Validation
    if (!name || !chargeType) {
      return res.status(400).json({ message: 'Name and charge type are required' });
    }

    if (!['fixed', 'percentage', 'tiered', 'free_above'].includes(chargeType)) {
      return res.status(400).json({ message: 'Invalid charge type' });
    }

    // Validate based on charge type
    if (chargeType === 'fixed' && (!fixedAmount || fixedAmount < 0)) {
      return res.status(400).json({ message: 'Fixed amount is required for fixed charge type' });
    }

    if (chargeType === 'percentage' && (!percentage || percentage < 0 || percentage > 100)) {
      return res.status(400).json({ message: 'Valid percentage (0-100) is required for percentage charge type' });
    }

    if (chargeType === 'free_above' && (!freeDeliveryAbove || freeDeliveryAbove < 0)) {
      return res.status(400).json({ message: 'Free delivery above amount is required for free_above charge type' });
    }

    if (chargeType === 'tiered' && (!tiers || tiers.length === 0)) {
      return res.status(400).json({ message: 'Tiers are required for tiered charge type' });
    }

    // Validate tiers if provided
    if (tiers && tiers.length > 0) {
      for (const tier of tiers) {
        if (typeof tier.minAmount !== 'number' || tier.minAmount < 0) {
          return res.status(400).json({ message: 'Invalid tier minAmount' });
        }
        if (tier.maxAmount !== null && (typeof tier.maxAmount !== 'number' || tier.maxAmount < tier.minAmount)) {
          return res.status(400).json({ message: 'Invalid tier maxAmount' });
        }
        if (typeof tier.charge !== 'number' || tier.charge < 0) {
          return res.status(400).json({ message: 'Invalid tier charge' });
        }
      }
    }

    const deliveryCharge = new DeliveryCharge({
      name,
      description,
      chargeType,
      fixedAmount: chargeType === 'fixed' ? fixedAmount : 0,
      percentage: chargeType === 'percentage' ? percentage : 0,
      freeDeliveryAbove: chargeType === 'free_above' ? freeDeliveryAbove : 0,
      tiers: chargeType === 'tiered' ? tiers : [],
      minOrderAmount: minOrderAmount || 0,
      maxOrderAmount: maxOrderAmount || null,
      priority: priority || 0,
      isActive: isActive !== undefined ? isActive : true,
      applicableLocations: applicableLocations || []
    });

    await deliveryCharge.save();
    res.status(201).json(deliveryCharge);
  } catch (err) {
    console.error('Create delivery charge error:', err);
    res.status(500).json({ message: 'Failed to create delivery charge' });
  }
});

// Admin: Update delivery charge
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const {
      name,
      description,
      chargeType,
      fixedAmount,
      percentage,
      freeDeliveryAbove,
      tiers,
      minOrderAmount,
      maxOrderAmount,
      priority,
      isActive,
      applicableLocations
    } = req.body;

    const deliveryCharge = await DeliveryCharge.findById(req.params.id);
    if (!deliveryCharge) {
      return res.status(404).json({ message: 'Delivery charge not found' });
    }

    // Validation (same as create)
    if (chargeType && !['fixed', 'percentage', 'tiered', 'free_above'].includes(chargeType)) {
      return res.status(400).json({ message: 'Invalid charge type' });
    }

    // Update fields
    if (name !== undefined) deliveryCharge.name = name;
    if (description !== undefined) deliveryCharge.description = description;
    if (chargeType !== undefined) deliveryCharge.chargeType = chargeType;
    if (fixedAmount !== undefined) deliveryCharge.fixedAmount = fixedAmount;
    if (percentage !== undefined) deliveryCharge.percentage = percentage;
    if (freeDeliveryAbove !== undefined) deliveryCharge.freeDeliveryAbove = freeDeliveryAbove;
    if (tiers !== undefined) deliveryCharge.tiers = tiers;
    if (minOrderAmount !== undefined) deliveryCharge.minOrderAmount = minOrderAmount;
    if (maxOrderAmount !== undefined) deliveryCharge.maxOrderAmount = maxOrderAmount;
    if (priority !== undefined) deliveryCharge.priority = priority;
    if (isActive !== undefined) deliveryCharge.isActive = isActive;
    if (applicableLocations !== undefined) deliveryCharge.applicableLocations = applicableLocations;

    await deliveryCharge.save();
    res.json(deliveryCharge);
  } catch (err) {
    console.error('Update delivery charge error:', err);
    res.status(500).json({ message: 'Failed to update delivery charge' });
  }
});

// Admin: Delete delivery charge
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const deliveryCharge = await DeliveryCharge.findByIdAndDelete(req.params.id);
    if (!deliveryCharge) {
      return res.status(404).json({ message: 'Delivery charge not found' });
    }
    res.json({ message: 'Delivery charge deleted successfully' });
  } catch (err) {
    console.error('Delete delivery charge error:', err);
    res.status(500).json({ message: 'Failed to delete delivery charge' });
  }
});

// Admin: Toggle active status
router.patch('/:id/toggle', auth, admin, async (req, res) => {
  try {
    const deliveryCharge = await DeliveryCharge.findById(req.params.id);
    if (!deliveryCharge) {
      return res.status(404).json({ message: 'Delivery charge not found' });
    }
    deliveryCharge.isActive = !deliveryCharge.isActive;
    await deliveryCharge.save();
    res.json(deliveryCharge);
  } catch (err) {
    console.error('Toggle delivery charge error:', err);
    res.status(500).json({ message: 'Failed to toggle delivery charge' });
  }
});

module.exports = router;



