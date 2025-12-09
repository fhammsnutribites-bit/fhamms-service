const express = require('express');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ product: productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ product: productId });

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get user's review for a specific product and order
router.get('/user/:productId/:orderId', auth, async (req, res) => {
  try {
    const { productId, orderId } = req.params;

    const review = await Review.findOne({
      user: req.user.id,
      product: productId,
      order: orderId
    });

    res.json({ review });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Create or update a review (only for delivered orders)
router.post('/', auth, async (req, res) => {
  try {
    const { productId, orderId, rating, comment, images } = req.body;

    if (!productId || !orderId || !rating) {
      return res.status(400).json({ message: 'productId, orderId, and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if the order exists and belongs to the user
    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
      isDelivered: true // Only allow reviews for delivered orders
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or not delivered yet' });
    }

    // Check if the product was in the order
    const orderItem = order.orderItems.find(item =>
      item.product.toString() === productId
    );

    if (!orderItem) {
      return res.status(400).json({ message: 'Product was not in this order' });
    }

    // Find existing review or create new one
    let review = await Review.findOne({
      user: req.user.id,
      product: productId,
      order: orderId
    });

    if (review) {
      // Update existing review
      review.rating = rating;
      review.comment = comment || '';
      review.images = images || [];
      await review.save();
    } else {
      // Create new review
      review = new Review({
        user: req.user.id,
        product: productId,
        order: orderId,
        rating,
        comment: comment || '',
        images: images || [],
        isVerified: true // Since it's from a delivered order
      });
      await review.save();
    }

    // Update product rating
    const product = await Product.findById(productId);
    if (product) {
      await product.updateRating();
    }

    // Populate user data for response
    await review.populate('user', 'name');

    res.status(review ? 200 : 201).json(review);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Delete a review
router.delete('/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOneAndDelete({
      _id: reviewId,
      user: req.user.id
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Update product rating after deleting review
    const product = await Product.findById(review.product);
    if (product) {
      await product.updateRating();
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;

