const { TaxAPI } = require('../apis/tax-api');

/**
 * Calculate tax for an order
 *
 * This implementation mirrors the logic in `src/reference.js`:
 * - Tax only applies when the order contains hot items
 * - Hot-items tax is calculated on the hot-item subtotal after
 *   applying discounts proportionally
 * - Delivery fee is taxable only when the order contains hot items
 * - Tax rates from TaxAPI are returned in basis points and must be
 *   converted to a fractional rate (basisPoints / 10000)
 *
 * @param {Object} order - The order object with items array
 * @param {number} orderSubtotal - The pre-discount subtotal (in cents)
 * @param {number} totalDiscounts - Total discounts applied (in cents)
 * @param {number} orderDelivery - Delivery fee applied (in cents)
 * @returns {number} - Tax amount in cents
 */
function tax(order, orderSubtotal, totalDiscounts, orderDelivery) {
  // If there is no subtotal, nothing to tax
  if (!order || !order.items || order.items.length === 0) return 0;

  // Compute hot-items subtotal and detect presence of hot items
  let hotSubtotal = 0;
  let hasHot = false;
  for (const item of order.items) {
    const line = item.unitPriceCents * item.qty;
    if (item.kind === 'hot') {
      hotSubtotal += line;
      hasHot = true;
    }
  }

  if (!hasHot) return 0;

  // Protect against division by zero
  const dp = orderSubtotal > 0 ? (totalDiscounts / orderSubtotal) : 0;

  // Hot items after their proportional share of discounts
  const hotAfterDiscounts = hotSubtotal - Math.floor(hotSubtotal * dp);

  // Taxable base includes hot items after discounts plus the delivery fee
  const taxableBase = hotAfterDiscounts + (orderDelivery || 0);

  // Get tax rate for hot items (TaxAPI returns basis points)
  const basisPoints = TaxAPI.lookup('hot') || 0;
  const rate = basisPoints / 10000;

  const taxAmount = Math.floor(taxableBase * rate);
  return taxAmount;
}

module.exports = { tax };
