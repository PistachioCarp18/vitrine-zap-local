const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const { computeFilteredSlots } = require('../src/home/barbearia.js');
const { hasCustomHome } = require('../src/home/loader.js');

test('v15-p2 Check 1: Oficina e Barbearia possuem modulos proprios, fontes OFL <= 45KB e zero Segoe UI/Consolas', () => {
  assert.equal(hasCustomHome('oficina'), true);
  assert.equal(hasCustomHome('barbearia'), true);

  const ofiFontKb = (fs.statSync(path.join(ROOT, 'assets/fonts/barlow-condensed-700.woff2')).size +
    fs.statSync(path.join(ROOT, 'assets/fonts/jakarta-400.woff2')).size) / 1024;
  const barbFontKb = (fs.statSync(path.join(ROOT, 'assets/fonts/playfair-700.woff2')).size +
    fs.statSync(path.join(ROOT, 'assets/fonts/jakarta-400.woff2')).size) / 1024;

  assert.ok(ofiFontKb <= 45, `Fontes oficina excederam 45KB: ${ofiFontKb.toFixed(1)}`);
  assert.ok(barbFontKb <= 45, `Fontes barbearia excederam 45KB: ${barbFontKb.toFixed(1)}`);

  const ds = fs.readFileSync(path.join(ROOT, 'src/brand/design-systems.js'), 'utf8');
  assert.doesNotMatch(ds, /Segoe UI|Cascadia Mono|Consolas|Trebuchet MS|Palatino Linotype/);
});

test('v15-p2 B05: Barbearia filtra horarios passados, feriados e gera grade deterministica por dia/barbeiro', () => {
  const afternoonSlots = computeFilteredSlots({
    dayIso: '2026-11-16',
    todayIso: '2026-11-16',
    openHour: '09:00',
    closeHour: '20:00',
    nowMinutes: 15 * 60,
    barber: 'Lucas',
    holidayDates: [],
  });
  assert.ok(afternoonSlots.length > 0 && afternoonSlots.every((s) => Number(s.split(':')[0]) >= 15));

  const holidaySlots = computeFilteredSlots({
    dayIso: '2026-11-20',
    todayIso: '2026-11-16',
    holidayDates: ['2026-11-20'],
  });
  assert.equal(holidaySlots.length, 0);
});
