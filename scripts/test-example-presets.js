'use strict';

// Guard the public-input contract, not a particular wording: every example must
// disclose all dimensions it fills, in metres or millimetres, with no job label.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PRESETS } = require('../js/calculators.js');

const tools = [
  ['concrete-slab-calculator', 'slab', ['length', 'width', 'depth']],
  ['post-hole-calculator', 'postHole', ['holeDiameter', 'holeDepth', 'postWidth']],
  ['footing-calculator', 'footing', ['length', 'width', 'depth']],
  ['column-calculator', 'column', ['diameter', 'height']],
  ['circular-slab-calculator', 'circularSlab', ['diameter', 'thickness']]
];

let checked = 0;
for (const [slug, presetGroup, dimensions] of tools) {
  const html = fs.readFileSync(path.join(__dirname, '..', slug, 'index.html'), 'utf8');
  const section = html.match(/<div\b[^>]*\bid="presets-section"[^>]*>/);
  assert(section, `${slug}: example group is missing`);
  assert.match(section[0], /\brole="group"/, `${slug}: accessible group is missing`);
  for (const attribute of ['aria-labelledby', 'aria-describedby']) {
    const reference = section[0].match(new RegExp(`${attribute}="([^"]+)"`));
    assert(reference, `${slug}: ${attribute} is missing`);
    const text = html.match(new RegExp(`<p\\b[^>]*\\bid="${reference[1]}"[^>]*>([^<]+)</p>`));
    assert(text && text[1].trim(), `${slug}: ${attribute} must reference visible text`);
    if (attribute === 'aria-describedby') {
      assert.match(text[1], /examples/i, `${slug}: explain that inputs are illustrative`);
      assert.match(text[1], /not a suitable .* design/i, `${slug}: distinguish arithmetic from design`);
    }
  }

  const buttons = [...html.matchAll(/<button\b[^>]*data-preset="([^"]+)"[^>]*>([^<]+)<\/button>/g)];
  assert.equal(buttons.length, Object.keys(PRESETS[presetGroup]).length, `${slug}: examples and data differ`);
  assert.equal(new Set(buttons.map(button => button[1])).size, buttons.length, `${slug}: duplicate example key`);
  for (const [, key, label] of buttons) {
    const preset = PRESETS[presetGroup][key];
    assert(preset, `${slug}: unknown example ${key}`);
    assert.equal(label, preset.label, `${slug}/${key}: visible and data labels differ`);
    assert.doesNotMatch(label, /shed|driveway|patio|garden|garage|fence|deck|pergola|retaining|veranda|carport|fire pit|birdbath/i,
      `${slug}/${key}: name the dimensions, not an implied suitable project`);
    const displayedMetres = [...label.matchAll(/(\d+(?:\.\d+)?)\s*(mm|m)\b/g)]
      .map(([, number, unit]) => Number(number) / (unit === 'mm' ? 1000 : 1));
    assert.deepEqual(displayedMetres, dimensions.map(dimension => preset[dimension]),
      `${slug}/${key}: label must disclose every filled dimension in order`);
    checked += 1;
  }
}
console.log(`PASS: ${checked} examples disclose every filled dimension and distinguish arithmetic from design`);
