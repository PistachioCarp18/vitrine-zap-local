const test = require('node:test');
const assert = require('node:assert/strict');

const illustrations = require('../src/illustrations');
const {
  getPdpMode,
  getItemGallerySlides,
  getFloralTiers,
  getCategoryPdpSpec,
} = require('../src/pdp');

test('pdp: assigns full-page PDP to moda & floricultura and distinct sheets to remaining verticals', () => {
  assert.equal(getPdpMode('moda'), 'full-page');
  assert.equal(getPdpMode('floricultura'), 'full-page');
  assert.equal(getPdpMode('oficina'), 'technical-sheet');
  assert.equal(getPdpMode('barbearia'), 'booking-sheet');
  assert.equal(getPdpMode('petshop'), 'club-sheet');
  assert.equal(getPdpMode('padaria'), 'bakery-sheet');
  assert.equal(getPdpMode('lanchonete'), 'craving-sheet');
});

test('pdp: moda & floricultura generate 3 distinct gallery slides with live color swatch tint', () => {
  const modSlides = getItemGallerySlides('moda', { id: 'mod-1', name: 'Camiseta Pima' }, { illustrations, swatchHex: '#9A3412' });
  assert.equal(modSlides.length, 3);
  assert.ok(modSlides[0].artHtml.includes('#9A3412'));
  assert.ok(modSlides[1].caption.includes('Caimento'));
  assert.ok(modSlides[2].caption.includes('Fibra'));

  const floSlides = getItemGallerySlides('floricultura', { id: 'flo-1', name: 'Buquê Rosas' }, { illustrations });
  assert.equal(floSlides.length, 3);
  assert.ok(floSlides[1].caption.includes('Proporção'));
  assert.ok(floSlides[2].caption.includes('Pétalas'));
});

test('pdp: floral tiers calculate cumulative deltas and specs adapt notes/accordions per vertical', () => {
  const tiers = getFloralTiers(100);
  assert.equal(tiers.length, 3);
  assert.equal(tiers[0].finalPrice, 100);
  assert.equal(tiers[1].finalPrice, 145);
  assert.equal(tiers[2].finalPrice, 179);

  const modaSpec = getCategoryPdpSpec('moda', { category: 'Camisetas' });
  assert.equal(modaSpec.requiresNote, false);
  assert.equal(modaSpec.accordions.length, 3);

  const floSpec = getCategoryPdpSpec('floricultura', { description: '12 rosas' });
  assert.equal(floSpec.supportsInlineFloralCard, true);
  assert.equal(floSpec.supportsFloralTiers, true);

  const ofiSpec = getCategoryPdpSpec('oficina', { warranty: 'Garantia 90 dias' }, { vehicleName: 'Onix 1.0', mileageKm: 60000 });
  assert.ok(ofiSpec.vehicleHint.includes('Onix 1.0'));
  assert.ok(ofiSpec.techFlags.length >= 2);

  const padSpec = getCategoryPdpSpec('padaria', { yieldLabel: 'Serve 15 fatias' });
  assert.equal(padSpec.requiresNote, false);
  assert.equal(padSpec.simpleQuickNote, true);

  const lanSpec = getCategoryPdpSpec('lanchonete', {});
  assert.equal(lanSpec.requiresNote, true);
});
