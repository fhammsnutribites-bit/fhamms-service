const mongoose = require('mongoose');

const weightOptionSchema = new mongoose.Schema({
  weight: { type: Number, required: true }, // in grams
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  basePrice: { type: Number, required: true }, // Base price for 250g
  image: { type: String },
  stock: { type: Number, required: true, default: 0 },
  category: { type: String },
  weightOptions: [weightOptionSchema], // Array of weight options
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// For backward compatibility, calculate price from weightOptions if price is accessed
productSchema.virtual('price').get(function() {
  if (this.weightOptions && this.weightOptions.length > 0) {
    return this.weightOptions[0].price; // Return first weight option price
  }
  return this.basePrice;
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
