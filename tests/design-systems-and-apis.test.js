const test = require('node:test');
const assert = require('node:assert/strict');

const { CATEGORY_DESIGN_SYSTEMS, getDesignSystemForCategory } = require('../src/brand/design-systems');
const {
  fetchFipeBrands,
  fetchFipeModels,
  fetchFipeYears,
  fetchFipeVehicleDetail,
  classifyVehicleTier,
  estimateMaintenanceByVehicleAndMileage,
  inferPetSizeFromBreed,
  fetchDogBreedsCatalog,
  fetchUpcomingHolidaysBR,
} = require('../src/category-apis');

test('design-systems: all 7 categories have distinct dsId, aestheticMood and surfaces', () => {
  const categories = ['lanchonete', 'padaria', 'petshop', 'oficina', 'barbearia', 'moda', 'floricultura'];
  const systems = categories.map(c => getDesignSystemForCategory(c));
  const ids = new Set(systems.map(s => s.dsId));
  const moods = new Set(systems.map(s => s.aestheticMood));
  const canvases = new Set(systems.map(s => s.surfaces.canvas));
  assert.equal(ids.size, 7);
  assert.equal(moods.size, 7);
  assert.ok(canvases.size >= 6);

  assert.equal(CATEGORY_DESIGN_SYSTEMS.oficina.colorScheme, 'dark');
  assert.equal(CATEGORY_DESIGN_SYSTEMS.barbearia.colorScheme, 'dark');
  assert.equal(CATEGORY_DESIGN_SYSTEMS.moda.cardRadius, '0px');
  assert.ok(CATEGORY_DESIGN_SYSTEMS.floricultura.cardRadius.includes('18px 4px'));
});

test('category-apis: FIPE cascade offline fallback returns brands, models, years and detail', async () => {
  const { brands, source: bSrc } = await fetchFipeBrands(null);
  assert.equal(bSrc, 'offline-fipe');
  assert.ok(brands.length >= 6);

  const { models } = await fetchFipeModels('59', null);
  assert.ok(models.some(m => /AMAROK|POLO|GOL/i.test(m.nome)));

  const { years } = await fetchFipeYears('59', '5940', null);
  assert.ok(years.length >= 3);

  const detail = await fetchFipeVehicleDetail('59', '5940', '2014-3', null);
  assert.ok(detail.fipePriceNumber > 40000);
  assert.equal(detail.fuel, 'Diesel');
});

test('category-apis: predictive maintenance estimator scales by FIPE tier, fuel and mileage', () => {
  const eco20 = estimateMaintenanceByVehicleAndMileage({
    vehicleName: 'Renault Kwid Zen 1.0',
    fipePriceNumber: 44500,
    fuel: 'Flex',
    year: 2023,
    mileageKm: 20000,
  });
  const suv60 = estimateMaintenanceByVehicleAndMileage({
    vehicleName: 'Toyota Hilux CD SRV 2.8 TDI Diesel',
    fipePriceNumber: 215000,
    fuel: 'Diesel',
    year: 2020,
    mileageKm: 60000,
  });

  assert.equal(classifyVehicleTier({ fipePriceNumber: 44500, year: 2023 }).tierId, 'economico');
  assert.equal(classifyVehicleTier({ fipePriceNumber: 215000, fuel: 'Diesel', year: 2020 }).tierId, 'suv-diesel-premium');

  assert.ok(eco20.totalMin < eco20.totalAvg && eco20.totalAvg < eco20.totalMax);
  assert.ok(suv60.totalAvg > eco20.totalAvg * 2.5, 'SUV Diesel 60k km estimate should substantially exceed Popular 20k km');
  assert.ok(suv60.milestoneLabel.includes('60k'));
});

test('category-apis: dog breed size inference and BR upcoming holidays fallback work deterministically', async () => {
  assert.equal(inferPetSizeFromBreed('Shih Tzu').size, 'Pequeno');
  assert.equal(inferPetSizeFromBreed('Beagle').size, 'Médio');
  assert.equal(inferPetSizeFromBreed('Golden Retriever').size, 'Grande');

  const breedsRes = await fetchDogBreedsCatalog(null);
  assert.equal(breedsRes.source, 'offline-breeds');
  assert.ok(breedsRes.breeds.length >= 10);

  const hol = await fetchUpcomingHolidaysBR(null, new Date('2026-11-16T12:00:00Z'));
  assert.equal(hol.nextHoliday.date, '2026-11-20');
  assert.ok(hol.nextHoliday.name.includes('Consciência Negra'));
});

test('illustrations: renders multi-layer item-specific SVG art and dynamic moda swatch tinting', () => {
  const { getItemSwatches, renderRichItemArt } = require('../src/illustrations');
  const swatches = getItemSwatches({ id: 'mod-1' });
  assert.ok(swatches.length >= 3);
  const svgModa = renderRichItemArt('moda', { id: 'mod-1', name: 'Camiseta Heavy' }, { swatchHex: '#9A3412' });
  assert.ok(svgModa.includes('#9A3412'));
  assert.ok(renderRichItemArt('lanchonete', { id: 'lan-3', name: 'Batata Rústica' }).includes('<svg'));
  assert.ok(renderRichItemArt('padaria', { id: 'pad-1', name: 'Bolo Brigadeiro' }).includes('<svg'));
  assert.ok(renderRichItemArt('floricultura', { id: 'flo-2', name: 'Orquídea Phalaenopsis' }).includes('<svg'));
});
