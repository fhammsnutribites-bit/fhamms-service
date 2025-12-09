const mongoose = require('mongoose');

const weightOptionSchema = new mongoose.Schema({
  weight: { type: Number, required: true }, // in grams
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  discountType: { type: String, enum: ['percentage', 'fixed', null], default: null },
  discountValue: { type: Number, default: 0 },
  isDiscountActive: { type: Boolean, default: false }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  basePrice: { type: Number, required: true }, // Base price for 250g
  image: { type: String },
  stock: { type: Number, required: true, default: 0 },
  category: { type: String },
  weightOptions: [weightOptionSchema], // Array of weight options
  // Product-level discount (applies to all weight options if not overridden)
  discountType: { type: String, enum: ['percentage', 'fixed', null], default: null },
  discountValue: { type: Number, default: 0 },
  isDiscountActive: { type: Boolean, default: false },
  // Rating and review fields
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Helper method to calculate discounted price
weightOptionSchema.methods.getDiscountedPrice = function(productDiscount = null) {
  const originalPrice = this.price;
  
  // Check if weight option has its own discount
  if (this.isDiscountActive && this.discountType && this.discountValue) {
    if (this.discountType === 'percentage') {
      return originalPrice - (originalPrice * this.discountValue / 100);
    } else if (this.discountType === 'fixed') {
      return Math.max(0, originalPrice - this.discountValue);
    }
  }
  
  // Check if product has discount
  if (productDiscount && productDiscount.isDiscountActive && productDiscount.discountType && productDiscount.discountValue) {
    if (productDiscount.discountType === 'percentage') {
      return originalPrice - (originalPrice * productDiscount.discountValue / 100);
    } else if (productDiscount.discountType === 'fixed') {
      return Math.max(0, originalPrice - productDiscount.discountValue);
    }
  }
  
  return originalPrice;
};

// For backward compatibility, calculate price from weightOptions if price is accessed
productSchema.virtual('price').get(function() {
  if (this.weightOptions && this.weightOptions.length > 0) {
    return this.weightOptions[0].price; // Return first weight option price
  }
  return this.basePrice;
});

// Method to update product rating based on reviews
productSchema.methods.updateRating = async function() {
  const Review = mongoose.model('Review');
  const reviews = await Review.find({ product: this._id });

  if (reviews.length === 0) {
    this.averageRating = 0;
    this.reviewCount = 0;
  } else {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = totalRating / reviews.length;
    this.reviewCount = reviews.length;
  }

  await this.save();
  return this;
};

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
