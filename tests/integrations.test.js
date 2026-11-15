const test = require('node:test');
const assert = require('node:assert/strict');
const {
  crc16Ccitt,
  generatePixBrCode,
  calculateCartTotals,
  normalizeBrPhone,
  buildWhatsAppOrderUrl,
} = require('../src/integrations');
const { createMatrix, renderQrSvg } = require('../src/qrcode');
const { createStore } = require('../src/store');
const { NICHE_PRESETS } = require('../src/presets');

test('crc16Ccitt retorna 4 caracteres hexadecimais validos para payload EMV', () => {
  const crc = crc16Ccitt('00020126330014br.gov.bcb.pix0111123456789095204000053039865802BR5913ComercioLocal6008Sorocaba62070503***6304');
  assert.match(crc, /^[0-9A-F]{4}$/);
});

test('generatePixBrCode inclui GUI br.gov.bcb.pix, valor formatado e CRC16 final', () => {
  const code = generatePixBrCode({
    pixKey: '15999990001',
    merchantName: 'Padaria do Goncalo',
    merchantCity: 'Sorocaba',
    amount: 42.5,
  });
  assert.ok(code.includes('br.gov.bcb.pix'));
  assert.ok(code.includes('540542.50'));
  assert.ok(code.includes('5802BR'));
  const bodyWithoutCrc = code.slice(0, -4);
  const crc = code.slice(-4);
  assert.equal(crc, crc16Ccitt(bodyWithoutCrc));
});

test('renderQrSvg gera SVG valido 100% offline para payload Pix BR Code', () => {
  const brCode = generatePixBrCode({
    pixKey: '15999990001',
    merchantName: 'Emporio do Lanche',
    merchantCity: 'Sorocaba',
    amount: 42.9,
  });
  const mat = createMatrix(brCode);
  assert.ok(mat.length >= 29);
  const svg = renderQrSvg(brCode, 176);
  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(svg.includes('<path d="M'));
  assert.ok(svg.endsWith('</svg>'));
});

test('calculateCartTotals soma itens e taxa de entrega corretamente', () => {
  const totals = calculateCartTotals([
    { name: 'X-Burger', qty: 2, price: 24.9 },
    { name: 'Refri', qty: 1, price: 6.5 },
  ], 6.0);
  assert.equal(totals.itemCount, 3);
  assert.equal(totals.subtotal, 56.3);
  assert.equal(totals.deliveryFee, 6);
  assert.equal(totals.total, 62.3);
});

test('normalizeBrPhone adiciona prefixo 55 quando ausente', () => {
  assert.equal(normalizeBrPhone('(15) 99711-0674'), '5515997110674');
  assert.equal(normalizeBrPhone('5515997110674'), '5515997110674');
});

test('buildWhatsAppOrderUrl gera link wa.me formatado sem depender de API paga', () => {
  const res = buildWhatsAppOrderUrl({
    storeName: 'Elefante Auto Center',
    storeWhatsapp: '(15) 3227-5835',
    customerName: 'Leandro',
    deliveryMode: 'Retirada',
    items: [{ name: 'Alinhamento', qty: 1, price: 130 }],
    mode: 'orcamento',
  });
  assert.ok(res.url.startsWith('https://wa.me/551532275835?text='));
  assert.ok(res.message.includes('*ORCAMENTO - Elefante Auto Center*'));
  assert.equal(res.totals.total, 130);
});

test('VitrineStore registra pedidos e calcula resumo diario corretamente', () => {
  const mem = {};
  const fakeStorage = {
    getItem: k => mem[k] || null,
    setItem: (k, v) => { mem[k] = v; },
  };
  const store = createStore(fakeStorage);
  store.recordOrder({ customerName: 'Joao', channel: 'WhatsApp', total: 42.9 });
  store.recordOrder({ customerName: 'Maria', channel: 'PDF', total: 65.0 });
  const today = new Date().toISOString().slice(0, 10);
  const summary = store.getDailySummary(today);
  assert.equal(summary.count, 2);
  assert.equal(summary.totalRevenue, 107.9);
});

test('NICHE_PRESETS possui os 4 nichos com itens e dicas de demonstracao', () => {
  for (const key of ['lanchonete', 'padaria', 'petshop', 'oficina']) {
    assert.ok(NICHE_PRESETS[key].items.length >= 4);
    assert.ok(NICHE_PRESETS[key].pitchTip.length > 10);
  }
});
