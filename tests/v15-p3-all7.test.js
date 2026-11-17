const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const { REGISTERED_HOMES, hasCustomHome } = require('../src/home/loader.js');
const { resolveBatchStatus } = require('../src/home/padaria.js');
const { computeFloralCutoffStatus } = require('../src/home/floricultura.js');
const {
  calibrateMaintenanceEstimate,
  fetchProductNutritionOrAllergens,
  fetchBotanicalTaxonomy,
} = require('../src/category-apis.js');

const ALL_CATEGORIES = ['lanchonete', 'padaria', 'petshop', 'oficina', 'barbearia', 'moda', 'floricultura'];

test('v15-p2 ALL7: todas as 7 categorias possuem home modular propria e fontes OFL <= 45KB', () => {
  assert.equal(REGISTERED_HOMES.length, 7);
  const fontSets = {
    oficina: ['barlow-condensed-700.woff2', 'jakarta-400.woff2'],
    barbearia: ['playfair-700.woff2', 'jakarta-400.woff2'],
    padaria: ['fraunces-700.woff2', 'jakarta-400.woff2'],
    moda: ['archivo-700.woff2', 'bodoni-italic-600.woff2', 'jakarta-400.woff2'],
    lanchonete: ['bricolage-700.woff2', 'jakarta-400.woff2'],
    petshop: ['nunito-700.woff2', 'jakarta-400.woff2'],
    floricultura: ['cormorant-700.woff2', 'dm-sans-400.woff2'],
  };

  for (const cat of ALL_CATEGORIES) {
    assert.equal(hasCustomHome(cat), true, `${cat} sem home customizado`);
    assert.ok(fs.existsSync(path.join(ROOT, `src/home/${cat}.js`)));
    assert.ok(fs.existsSync(path.join(ROOT, `styles/home-${cat}.css`)));
    const kb = fontSets[cat].reduce((s, f) => s + fs.statSync(path.join(ROOT, 'assets/fonts', f)).size, 0) / 1024;
    assert.ok(kb <= 45, `${cat} excedeu 45KB de fontes (${kb.toFixed(1)} KB)`);
  }
});

test('v15-p3 Estimador Oficina v2: calibra deterministicamente a partir de 8+ OS fechadas', () => {
  const baseEst = { totalMin: 400, totalAvg: 500, totalMax: 600 };
  const early = calibrateMaintenanceEstimate(baseEst, [{ total: 650 }, { total: 700 }]);
  assert.equal(early.calibrated, false);
  assert.equal(early.totalAvg, 500);
  assert.match(early.calibrationNote, /Estimativa ilustrativa/i);

  const eightOs = Array.from({ length: 8 }, () => ({ total: 600 }));
  const cal = calibrateMaintenanceEstimate(baseEst, eightOs);
  assert.equal(cal.calibrated, true);
  assert.equal(cal.totalAvg, 600);
  assert.match(cal.calibrationNote, /Calibrado com 8 OS locais/);
});

test('v15-p3 Fallbacks & Regras Locais: Padaria fornada, Floricultura corte 15h, OpenFoodFacts e GBIF', async () => {
  const batch = resolveBatchStatus(true, { tempC: 18 });
  assert.equal(batch.nextBatch, '16:00');
  assert.match(batch.climateTip, /18°C/);

  const cutoff = computeFloralCutoffStatus(true);
  assert.equal(cutoff.canSameDay, true);
  assert.match(cutoff.cutoffText, /entregar hoje/);

  const nut = await fetchProductNutritionOrAllergens('789', null);
  assert.equal(nut.source, 'offline-padaria');

  const bot = await fetchBotanicalTaxonomy('Rosa', null);
  assert.equal(bot.source, 'offline-botanica');
  assert.match(bot.careTip, /água/);
});
