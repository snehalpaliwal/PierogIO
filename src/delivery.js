/**
 * Calculate delivery fee
 * 
 * @param {Object} order - The order object
 * @param {Object} delivery - Delivery information with zone and rush properties
 * @param {Object} profile - Customer profile with tier property
 * @returns {number} - Delivery fee in cents
 */
function deliveryFee(order, delivery, profile, totalDiscounts = 0) {
  // Calculate subtotal
  let subtotal = 0;
  for (const item of order.items) {
    subtotal += item.unitPriceCents * item.qty;
  }

  // Apply all discounts provided by caller (volume + coupons)
  const discountedSubtotal = subtotal - (totalDiscounts || 0);

  const freeDeliveryThresholds = {
    'guest': 5000,    // $50
    'regular': 4000,  // $40
    'vip': 3000       // $30
  };

  // Use tier-specific threshold, default to guest if tier not recognized
  let threshold = freeDeliveryThresholds[profile.tier];
  if (!threshold) {
    threshold = freeDeliveryThresholds['guest'];
  }

  // If discounted subtotal is above threshold, delivery is free (except rush fee)
  if (discountedSubtotal > threshold) {
    return delivery.rush ? 299 : 0;
  }

  // Base delivery fee is per-order (not per item)
  let fee = delivery.zone === 'local' ? 399 : 699;
  if (delivery.rush) {
    fee += 299;
  }

  return fee;
}

module.exports = { deliveryFee };
