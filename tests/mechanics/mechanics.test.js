const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const registry = require('../../src/mechanics/registry');
const depositPix = require('../../src/mechanics/deposit-pix');
const autoshipReminder = require('../../src/mechanics/autoship-reminder');
const slotPicker = require('../../src/mechanics/slot-picker');
const inspectionChecklist = require('../../src/mechanics/inspection-checklist');
const variantPicker = require('../../src/mechanics/variant-picker');
const occasionCardMessage = require('../../src/mechanics/occasion-card-message');
const pickupWindow = require('../../src/mechanics/pickup-window');
const freeShippingProgress = require('../../src/mechanics/free-shipping-progress');
const reorder1Tap = require('../../src/mechanics/reorder-1-tap');
const itemSheetAddons = require('../../src/mechanics/item-sheet-addons');

test('registry: maps all 7 categories and enforces category isolation', () => {
  const categories = ['lanchonete', 'padaria', 'petshop', 'oficina', 'barbearia', 'moda', 'floricultura'];
  for (const cat of categories) {
    const active = registry.resolveActiveMechanics({ vertical: cat });
    assert.ok(active.length >= 1, `${cat} should have at least 1 active mechanic`);
  }

  // Barbearia cannot load lanchonete-only mechanics even if passed in enabledMechanics
  const barbeariaCustom = registry.resolveActiveMechanics({
    vertical: 'barbearia',
    enabledMechanics: ['slot-picker', 'item-sheet-addons', 'autoship-reminder'],
  });
  assert.deepEqual(barbeariaCustom, ['slot-picker']);

  // Lanchonete cannot load oficina/barbearia/moda exclusive mechanics
  const lanchoneteAllowed = registry.getAllowedMechanicsForCategory('lanchonete');
  assert.ok(lanchoneteAllowed.includes('item-sheet-addons'));
  assert.ok(!lanchoneteAllowed.includes('slot-picker'));
  assert.ok(!lanchoneteAllowed.includes('inspection-checklist'));
  assert.ok(!lanchoneteAllowed.includes('variant-picker'));
});

test('deposit-pix: split 50% calculation and accessible switch markup (>=44px class)', () => {
  assert.deepEqual(depositPix.calculateSplitDeposit(120, false), { payNow: 120, payLater: 0, ratio: 1 });
  assert.deepEqual(depositPix.calculateSplitDeposit(101.01, true, 0.5), { payNow: 50.51, payLater: 50.5, ratio: 0.5 });

  const html = depositPix.renderDepositSwitchHtml(true);
  assert.ok(html.includes('id="pay-deposit-50"'));
  assert.ok(html.includes('role="switch"'));
  assert.ok(html.includes('aria-checked="true"'));
});

test('autoship-reminder: duration calculation, label parsing and offline .ics export', () => {
  assert.equal(autoshipReminder.extractKgFromLabel('Pacote 15kg'), 15);
  assert.equal(autoshipReminder.extractKgFromLabel('Saco 2.5 kg'), 2.5);
  assert.equal(autoshipReminder.extractKgFromLabel('Sem peso'), null);

  assert.equal(autoshipReminder.calculateFoodDurationDays(15, 'Médio'), 60);
  assert.equal(autoshipReminder.calculateFoodDurationDays(15, 'Pequeno'), 125);
  assert.equal(autoshipReminder.calculateFoodDurationDays(15, 'Grande'), 33);

  const ics = autoshipReminder.buildPetReminderIcs('Pet Clube', 'Rex', 30);
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('SUMMARY:Repor racao de Rex'));
  assert.ok(ics.includes('END:VCALENDAR'));
});

test('slot-picker: upcoming days list and valid VEVENT .ics generation', () => {
  const base = new Date('2026-11-16T10:00:00Z');
  const days = slotPicker.getUpcomingDays(4, base);
  assert.equal(days.length, 4);
  assert.equal(days[0].label, 'Hoje');
  assert.equal(days[1].label, 'Amanhã');
  assert.equal(days[0].iso, '2026-11-16');

  const ics = slotPicker.buildBookingIcsEvent({
    storeName: 'Barbearia Navalha',
    serviceName: 'Corte + Barba',
    professional: 'Lucas',
    dateIso: '2026-11-17',
    timeSlot: '14:30',
  });
  assert.ok(ics.includes('DTSTART:20261117T143000'));
  assert.ok(ics.includes('SUMMARY:Corte + Barba'));
  assert.ok(ics.includes('Profissional: Lucas'));
});

test('inspection-checklist: severity inference and itemized approval total', () => {
  assert.equal(inspectionChecklist.getItemSeverity({ category: 'Freios' }), 'critico');
  assert.equal(inspectionChecklist.getItemSeverity({ name: 'Alinhamento 3D' }), 'atencao');
  assert.equal(inspectionChecklist.getItemSeverity({ name: 'Troca de óleo' }), 'rotina');

  const items = [
    { cartKey: 'i1', price: 200, partsPrice: 120, laborPrice: 80, qty: 1 },
    { cartKey: 'i2', price: 150, qty: 2 },
  ];
  const setPartial = new Set(['i1']);
  const partial = inspectionChecklist.computeItemizedQuoteTotals(items, setPartial);
  assert.equal(partial.approvedCount, 1);
  assert.equal(partial.approvedTotal, 200);
  assert.equal(partial.partsTotal, 120);
  assert.equal(partial.laborTotal, 80);

  const mapPartial = new Map([['i1', true], ['i2', false]]);
  const mapRes = inspectionChecklist.computeItemizedQuoteTotals(items, mapPartial);
  assert.equal(mapRes.approvedCount, 1);
  assert.equal(mapRes.approvedTotal, 200);
});

test('variant-picker: availability guard and size guide table HTML', () => {
  const item = { outOfStockSizes: ['GG'] };
  assert.equal(variantPicker.isSizeAvailable(item, 'M'), true);
  assert.equal(variantPicker.isSizeAvailable(item, 'GG'), false);
  const tableHtml = variantPicker.renderSizeGuideTableHtml();
  assert.ok(tableHtml.includes('<table class="size-guide-table">'));
  assert.equal(variantPicker.SIZE_GUIDE_CM.length, 4);
});

test('occasion-card-message: limits message to 160 chars and prefixes surprise gift', () => {
  const longText = 'A'.repeat(200);
  const formatted = occasionCardMessage.formatCardSummary(longText, true);
  assert.ok(formatted.startsWith('[Presente Surpresa - Sem remetente] '));
  assert.equal(formatted.length, '[Presente Surpresa - Sem remetente] '.length + 160);
  assert.equal(occasionCardMessage.formatCardSummary('', false), '');
});

test('pickup-window: filters elapsed morning slots when scheduling for today', () => {
  const tomorrow = pickupWindow.getTomorrowIso(new Date('2026-11-16T12:00:00Z'));
  assert.equal(tomorrow, '2026-11-17');

  const windows = ['08:30 - 11:30', '13:30 - 16:30', '17:00 - 19:00'];
  assert.deepEqual(pickupWindow.resolveAvailableWindows(windows, true, 12), ['13:30 - 16:30', '17:00 - 19:00']);
  assert.deepEqual(pickupWindow.resolveAvailableWindows(windows, true, 20), ['Próxima janela disponível']);
  assert.deepEqual(pickupWindow.resolveAvailableWindows(windows, false, 20), windows);
});

test('free-shipping-progress, reorder-1-tap & item-sheet-addons: contract outputs', () => {
  assert.equal(freeShippingProgress.renderFreeBarHtml({ enabled: false }), '');
  const bar = freeShippingProgress.renderFreeBarHtml({
    enabled: true,
    unlocked: false,
    remainingFormatted: 'R$ 15,00',
    percent: 75,
  });
  assert.ok(bar.includes('Faltam R$ 15,00 para Entrega Grátis'));
  assert.ok(bar.includes('aria-valuenow="75"'));

  assert.equal(reorder1Tap.canQuickReorder(null), false);
  assert.equal(reorder1Tap.canQuickReorder({ items: [{ name: 'Burger' }] }), true);

  assert.equal(itemSheetAddons.calculateModalUnitTotal(29.9, [{ price: 4 }, { price: 5.5 }]), 39.4);
});

test('contracts: every mechanic in category-map has matching JSON contract & JS module', () => {
  const root = path.resolve(__dirname, '..', '..');
  const mapJson = JSON.parse(fs.readFileSync(path.join(root, 'mechanics', 'category-map.json'), 'utf8'));
  const ids = new Set(Object.values(mapJson['category-map']).flat());
  for (const id of ids) {
    assert.ok(fs.existsSync(path.join(root, 'mechanics', `${id}.json`)), `Missing contract mechanics/${id}.json`);
    assert.ok(fs.existsSync(path.join(root, 'src', 'mechanics', `${id}.js`)), `Missing module src/mechanics/${id}.js`);
  }
});
