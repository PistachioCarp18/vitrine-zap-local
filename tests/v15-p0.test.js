const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const slotPicker = require('../src/mechanics/slot-picker.js');
const pickupWindow = require('../src/mechanics/pickup-window.js');

test('v15-p0 B02: getUpcomingDays & buildBookingIcsEvent preservam data local entre 21:00 e 23:59 em Sao Paulo', () => {
  const prevTz = process.env.TZ;
  process.env.TZ = 'America/Sao_Paulo';
  try {
    // 2026-11-16T22:30:00-03:00 == 2026-11-17T01:30:00Z (UTC ja mudou de dia!)
    const lateNightSp = new Date('2026-11-16T22:30:00-03:00');
    const days = slotPicker.getUpcomingDays(4, lateNightSp);
    assert.equal(days[0].label, 'Hoje');
    assert.equal(days[0].iso, '2026-11-16');
    assert.equal(days[1].label, 'Amanhã');
    assert.equal(days[1].iso, '2026-11-17');

    const ics = slotPicker.buildBookingIcsEvent({
      storeName: 'Barbearia Navalha',
      serviceName: 'Corte',
      dateIso: days[0].iso,
      timeSlot: '09:30',
    });
    assert.match(ics, /DTSTART:20261116T093000/);

    assert.equal(pickupWindow.getTomorrowIso(lateNightSp), '2026-11-17');
  } finally {
    if (prevTz === undefined) delete process.env.TZ;
    else process.env.TZ = prevTz;
  }
});

test('v15-p0 B04/B01/B15: manifest PWA completo com icones 192/512, carimbo de build e pre-cache SW completo', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.lang, 'pt-BR');
  assert.ok(manifest.id && manifest.scope);
  assert.match(manifest.start_url, /\?demo=1/);
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);
  for (const size of ['192x192', '512x512']) {
    const ic = manifest.icons.find((x) => x.sizes === size);
    assert.ok(ic, `Icone ${size} ausente no manifest`);
    const iconFile = path.join(ROOT, ic.src.replace(/^\.\//, ''));
    assert.ok(fs.existsSync(iconFile) && fs.statSync(iconFile).size > 200);
  }

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /<meta name="build" content="v15-/);
  assert.match(html, /id="studio-build-stamp"/);

  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  assert.match(sw, /vitrine-zap-v15/);
  assert.match(sw, /slot-picker\.js/);
  assert.match(sw, /verticals\/barbearia\.json/);
  assert.match(sw, /icon-192\.png/);
});
