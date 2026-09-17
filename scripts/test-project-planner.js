'use strict';

const assert = require('node:assert/strict');
const {
  calculateProjectItem,
  calculateProjectTotal
} = require('../js/calculators.js');

const slab = calculateProjectItem({
  shape: 'rectangular',
  length: 3,
  width: 3,
  depth: 0.1,
  quantity: 1
});
assert.equal(slab.valid, true);
assert.ok(Math.abs(slab.baseVolume - 0.9) < 1e-12);

const holes = calculateProjectItem({
  shape: 'circular',
  diameter: 0.3,
  depth: 0.6,
  quantity: 6
});
assert.equal(holes.valid, true);
assert.ok(Math.abs(holes.baseVolume - (Math.PI * 0.15 ** 2 * 0.6 * 6)) < 1e-12);

const project = calculateProjectTotal([
  { shape: 'rectangular', length: 3, width: 3, depth: 0.1, quantity: 1 },
  { shape: 'circular', diameter: 0.3, depth: 0.6, quantity: 6 }
], 10);
assert.equal(project.valid, true);
assert.ok(Math.abs(project.totalVolume - 1.269916) < 0.000001);
assert.equal(project.bags, 138);

assert.equal(calculateProjectTotal([], 10).valid, false);
assert.equal(calculateProjectTotal([
  { shape: 'rectangular', length: 0, width: 3, depth: 0.1, quantity: 1 }
], 10).invalidIndex, 0);
assert.equal(calculateProjectTotal([
  { shape: 'circular', diameter: 0.3, depth: 0.6, quantity: 1.5 }
], 10).valid, false);
assert.equal(calculateProjectTotal([
  { shape: 'circular', diameter: 0.3, depth: 0.6, quantity: 1 }
], 31).valid, false);

console.log('PASS: project planner calculations and validation');
