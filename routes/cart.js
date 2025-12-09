const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { auth, optionalAuth } = require('../middleware/auth');
const { getProductPriceInfo } = require('../utils/discount');

const router = express.Router();

// Helper function to get cart identifier
const getCartIdentifier = (req) => {
  if (req.user && req.user.id) {
    return { user: req.user.id };
  }
  const sessionId = req.headers['x-session-id'] || req.body.sessionId;
  if (!sessionId) {
    return null;
  }
  return { sessionId };
};

// Helper function to find or create cart
const findOrCreateCart = async (identifier) => {
  console.log('Finding or creating cart for identifier:', identifier);
  if (!identifier) return null;
  
  let cart = await Cart.findOne(identifier).populate('items.product');
  console.log('Cart found:', !cart,!cart ? 'No cart found, will create new' : '');
  if (!cart) {
    cart = new Cart({ ...identifier, items: [] });
    await cart.save();
    await cart.populate('items.product');
  }
  return cart;
};

// Get current user's or guest's cart
router.get('/', optionalAuth, async (req, res) => {
  try {
    console.log('Received request to get cart' ,req.user ? 'for user ' + req.user.id : 'for guest');
    const identifier = getCartIdentifier(req);
    if (!identifier) {
      return res.status(400).json({ message: 'Session ID required for guest cart' });
    }
    console.log('Getting cart for identifier:', identifier);
    const cart = await findOrCreateCart(identifier);
    if (!cart) {
      return res.status(500).json({ message: 'Failed to create cart' });
    }
    
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Add or update an item in cart
// Body: { productId, qty, price?, originalPrice?, weight?, sessionId? }
router.post('/items', optionalAuth, async (req, res) => {
  try {
    const { productId, qty = 1, price, originalPrice, weight } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId required' });

    const identifier = getCartIdentifier(req);
    if (!identifier) {
      return res.status(400).json({ message: 'Session ID required for guest cart' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Find the weight option if weight is specified
    let weightOption = null;
    if (weight) {
      weightOption = product.weightOptions?.find(w => w.weight === weight);
    } else if (product.weightOptions && product.weightOptions.length > 0) {
      weightOption = product.weightOptions[0];
    }

    // Calculate original and discounted prices using shared utility
    const priceInfo = getProductPriceInfo(product, weightOption || null);

    // Use provided prices if available, otherwise use calculated prices
    const itemPrice = typeof price === 'number' ? price : priceInfo.discounted;
    const calculatedOriginalPrice = priceInfo.original;

    // If originalPrice is explicitly provided, use it; otherwise use calculated original price
    // This allows frontend to override for products that may have been discounted at product level
    const finalOriginalPrice = typeof originalPrice === 'number' ? originalPrice : calculatedOriginalPrice;

    let cart = await Cart.findOne(identifier);
    if (!cart) {
      cart = new Cart({ ...identifier, items: [] });
    }

    // Try to find existing item with same product and weight
    const existingIdx = cart.items.findIndex(i => 
      i.product.toString() === productId.toString() && 
      (i.weight || null) === (weight || null)
    );
    
    if (existingIdx > -1) {
      cart.items[existingIdx].qty = cart.items[existingIdx].qty + Number(qty);
      cart.items[existingIdx].price = itemPrice;
      cart.items[existingIdx].originalPrice = finalOriginalPrice;
    } else {
      cart.items.push({
        product: productId,
        qty: Number(qty),
        price: itemPrice,
        originalPrice: finalOriginalPrice,
        weight
      });
    }

    await cart.save();
    await cart.populate('items.product');
    res.status(201).json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Update item quantity
router.put('/items/:itemId', optionalAuth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { qty } = req.body;
    if (typeof qty !== 'number') return res.status(400).json({ message: 'qty number required' });

    const identifier = getCartIdentifier(req);
    if (!identifier) {
      return res.status(400).json({ message: 'Session ID required for guest cart' });
    }

    const cart = await Cart.findOne(identifier);
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
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Remove an item
router.delete('/items/:itemId', optionalAuth, async (req, res) => {
  try {
    const { itemId } = req.params;
    
    if (!itemId) {
      return res.status(400).json({ message: 'Item ID is required' });
    }
    
    const identifier = getCartIdentifier(req);
    if (!identifier) {
      return res.status(400).json({ message: 'Session ID required for guest cart' });
    }

    const cart = await Cart.findOne(identifier);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    
    // Remove the item from the array
    cart.items.pull(itemId);
    await cart.save();
    
    // Reload cart with populated products
    const updatedCart = await Cart.findOne(identifier).populate('items.product');
    res.json(updatedCart);
  } catch (err) {
    console.error('Remove item error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Clear cart
router.delete('/', optionalAuth, async (req, res) => {
  try {
    const identifier = getCartIdentifier(req);
    if (!identifier) {
      return res.status(400).json({ message: 'Session ID required for guest cart' });
    }

    const cart = await Cart.findOne(identifier);
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    
    cart.items = [];
    await cart.save();
    await cart.populate('items.product');
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Merge guest cart with user cart (called on login)
router.post('/merge', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId required' });
    }

    // Get user cart
    let userCart = await Cart.findOne({ user: req.user.id });
    if (!userCart) {
      userCart = new Cart({ user: req.user.id, items: [] });
    }

    // Get guest cart
    const guestCart = await Cart.findOne({ sessionId });
    
    if (guestCart && guestCart.items.length > 0) {
      // Merge items from guest cart into user cart
      for (const guestItem of guestCart.items) {
        const existingIdx = userCart.items.findIndex(i => 
          i.product.toString() === guestItem.product.toString() && 
          (i.weight || null) === (guestItem.weight || null)
        );
        
        if (existingIdx > -1) {
          // Merge quantities
          userCart.items[existingIdx].qty += guestItem.qty;
        } else {
          // Add new item
          userCart.items.push({
            product: guestItem.product,
            qty: guestItem.qty,
            price: guestItem.price,
            originalPrice: guestItem.originalPrice,
            weight: guestItem.weight
          });
        }
      }
      
      await userCart.save();
      
      // Delete guest cart after merging
      await Cart.deleteOne({ sessionId });
    }

    await userCart.populate('items.product');
    res.json(userCart);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;
