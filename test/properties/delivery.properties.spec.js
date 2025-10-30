const fc = require('fast-check');
const { deliveryFee } = require('../../src/delivery');

// Arbitraries
const addOnArb = fc.constantFrom('sour-cream', 'fried-onion', 'bacon-bits');
const fillingArb = fc.constantFrom('potato', 'sauerkraut', 'sweet-cheese', 'mushroom');
const kindArb = fc.constantFrom('hot', 'frozen');
const zoneArb = fc.constantFrom('local', 'outer');
const tierArb = fc.constantFrom('guest', 'regular', 'vip');

const orderItemArb = fc.record({
  sku: fc.constantFrom('P6-POTATO', 'P12-POTATO', 'P24-POTATO', 'P6-SAUER', 'P12-SAUER'),
  title: fc.string(),
  kind: kindArb,
  filling: fillingArb,
  qty: fc.constantFrom(6, 12, 24),
  unitPriceCents: fc.integer({ min: 500, max: 3000 }),
  addOns: fc.array(addOnArb, { maxLength: 3 })
});

const orderArb = fc.record({
  items: fc.array(orderItemArb, { minLength: 1, maxLength: 5 })
});

const deliveryArb = fc.record({
  zone: zoneArb,
  rush: fc.boolean()
});

const profileArb = fc.record({
  tier: tierArb
});

// thresholds from README (in cents)
const freeThresholdCents = {
  guest: 5000,
  regular: 4000,
  vip: 3000
};

describe('Property-Based Tests for Delivery', () => {
  it('deliveryFee returns a non-negative integer and does not mutate inputs', () => {
    fc.assert(
      fc.property(orderArb, deliveryArb, profileArb, (order, delivery, profile) => {
        const orderClone = JSON.parse(JSON.stringify(order));
        const deliveryClone = JSON.parse(JSON.stringify(delivery));
        const profileClone = JSON.parse(JSON.stringify(profile));

        const fee = deliveryFee(order, delivery, profile);

        // preservation
        if (JSON.stringify(order) !== JSON.stringify(orderClone)) return false;
        if (JSON.stringify(delivery) !== JSON.stringify(deliveryClone)) return false;
        if (JSON.stringify(profile) !== JSON.stringify(profileClone)) return false;

        // type/shape checks
        return typeof fee === 'number' && Number.isInteger(fee) && fee >= 0;
      }),
      { numRuns: 200 }
    );
  });

  it('outer zone should not be cheaper than local for same order and rush flag', () => {
    fc.assert(
      fc.property(orderArb, fc.boolean(), tierArb, (order, rush, tier) => {
        const profile = { tier };
        const local = { zone: 'local', rush };
        const outer = { zone: 'outer', rush };

        const feeLocal = deliveryFee(order, local, profile);
        const feeOuter = deliveryFee(order, outer, profile);

        return Number.isInteger(feeLocal) &&
               Number.isInteger(feeOuter) &&
               feeOuter >= feeLocal &&
               feeLocal >= 0 && feeOuter >= 0;
      }),
      { numRuns: 100 }
    );
  });
});