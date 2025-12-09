/**
 * Calculate discounted price based on discount type and value
 * @param {number} originalPrice - Original price
 * @param {string} discountType - 'percentage' or 'fixed'
 * @param {number} discountValue - Discount value
 * @returns {number} Discounted price
 */
const calculateDiscountedPrice = (originalPrice, discountType, discountValue) => {
  if (!discountType || !discountValue || discountValue <= 0) {
    return originalPrice;
  }

  if (discountType === 'percentage') {
    return originalPrice - (originalPrice * discountValue / 100);
  } else if (discountType === 'fixed') {
    return Math.max(0, originalPrice - discountValue);
  }

  return originalPrice;
};

/**
 * Get price information for a product (with discount calculation)
 * @param {Object} product - Product object
 * @param {Object} weightOption - Optional weight option
 * @returns {Object} Price info with original, discounted, hasDiscount, discountInfo
 */
const getProductPriceInfo = (product, weightOption = null) => {
  let originalPrice;
  let discountType = null;
  let discountValue = null;
  let isDiscountActive = false;

  // Determine base price and discount from weight option or product
  if (weightOption) {
    originalPrice = weightOption.price;
    
    // Check weight option discount first
    if (weightOption.isDiscountActive && weightOption.discountType && weightOption.discountValue) {
      isDiscountActive = true;
      discountType = weightOption.discountType;
      discountValue = weightOption.discountValue;
    }
    // Fall back to product discount if weight option doesn't have one
    else if (product.isDiscountActive && product.discountType && product.discountValue) {
      isDiscountActive = true;
      discountType = product.discountType;
      discountValue = product.discountValue;
    }
  } else {
    originalPrice = product.price || product.basePrice;
    
    if (product.isDiscountActive && product.discountType && product.discountValue) {
      isDiscountActive = true;
      discountType = product.discountType;
      discountValue = product.discountValue;
    }
  }

  const discountedPrice = isDiscountActive
    ? calculateDiscountedPrice(originalPrice, discountType, discountValue)
    : originalPrice;

  return {
    original: originalPrice,
    discounted: discountedPrice,
    hasDiscount: isDiscountActive,
    discountInfo: isDiscountActive ? { type: discountType, value: discountValue } : null
  };
};

module.exports = {
  calculateDiscountedPrice,
  getProductPriceInfo
};



