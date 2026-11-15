const test = require('node:test');
const assert = require('node:assert/strict');
const {
  crc16Ccitt,
  generatePixBrCode,
  resolveCouponDiscount,
  calculateCartTotals,
  normalizeBrPhone,
  isStoreOpenNow,
  buildWhatsAppOrderUrl,
} = require('../src/integrations');
const { createMatrix, renderQrSvg } = require('../src/qrcode');
const { createStore, encodeStoreConfig, decodeStoreConfig, exportOrdersCsv } = require('../src/store');
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

test('resolveCouponDiscount aplica desconto percentual e fixo respeitando o teto do subtotal', () => {
  const coupons = [
    { code: 'BAIRRO10', type: 'percent', value: 10 },
    { code: 'BEMVINDO5', type: 'fixed', value: 5 },
  ];
  assert.equal(resolveCouponDiscount(100, 'bairro10', coupons).discountAmount, 10);
  assert.equal(resolveCouponDiscount(3, 'BEMVINDO5', coupons).discountAmount, 3);
  assert.equal(resolveCouponDiscount(100, 'INVALIDO', coupons).discountAmount, 0);
});

test('calculateCartTotals soma itens, taxa de entrega e subtrai desconto corretamente', () => {
  const totals = calculateCartTotals([
    { name: 'X-Burger', qty: 2, price: 24.9 },
    { name: 'Refri', qty: 1, price: 6.5 },
  ], 6.0, 5.0);
  assert.equal(totals.itemCount, 3);
  assert.equal(totals.subtotal, 56.3);
  assert.equal(totals.deliveryFee, 6);
  assert.equal(totals.discount, 5);
  assert.equal(totals.total, 57.3);
});

test('normalizeBrPhone adiciona prefixo 55 quando ausente', () => {
  assert.equal(normalizeBrPhone('(15) 99711-0674'), '5515997110674');
  assert.equal(normalizeBrPhone('5515997110674'), '5515997110674');
});

test('isStoreOpenNow avalia horario de funcionamento corretamente', () => {
  const noon = new Date('2026-11-15T12:00:00');
  assert.equal(isStoreOpenNow('08:00', '18:00', noon), true);
  assert.equal(isStoreOpenNow('18:00', '23:30', noon), false);
});

test('buildWhatsAppOrderUrl inclui cupom e troco quando informados', () => {
  const res = buildWhatsAppOrderUrl({
    storeName: 'Emporio do Lanche',
    storeWhatsapp: '(15) 99999-0001',
    customerName: 'Leandro',
    deliveryMode: 'Entrega',
    address: 'Rua A, 123',
    paymentMethod: 'Dinheiro',
    changeFor: 'R$ 100,00',
    discount: 5,
    couponCode: 'BEMVINDO5',
    deliveryFee: 6,
    items: [{ name: 'Combo', qty: 1, price: 50 }],
    mode: 'pedido',
  });
  assert.ok(res.url.startsWith('https://wa.me/5515999990001?text='));
  assert.ok(res.message.includes('BEMVINDO5'));
  assert.ok(res.message.includes('Troco para:* R$ 100,00'));
  assert.equal(res.totals.total, 51);
});

test('VitrineStore registra pedidos, perfil do cliente e calcula ticket medio', () => {
  const mem = {};
  const fakeStorage = {
    getItem: k => mem[k] || null,
    setItem: (k, v) => { mem[k] = v; },
  };
  const store = createStore(fakeStorage);
  store.saveCustomerProfile({ name: 'Ana', phone: '15999998888', address: 'Rua B, 10' });
  assert.equal(store.loadCustomerProfile().name, 'Ana');
  store.recordOrder({ customerName: 'Joao', channel: 'WhatsApp', total: 42.9 });
  store.recordOrder({ customerName: 'Maria', channel: 'PDF', total: 65.1 });
  const today = new Date().toISOString().slice(0, 10);
  const summary = store.getDailySummary(today);
  assert.equal(summary.count, 2);
  assert.equal(summary.totalRevenue, 108);
  assert.equal(summary.avgTicket, 54);
});

test('exportOrdersCsv gera CSV valido para planilhas', () => {
  const csv = exportOrdersCsv([
    { id: 'VZ-123', createdAt: '2026-11-15T18:00:00Z', customerName: 'Carlos, Jr', channel: 'WhatsApp', paymentMethod: 'Pix', itemCount: 2, total: 55.5 },
  ]);
  assert.ok(csv.startsWith('ID,Data,Cliente,Canal,Pagamento,Itens,Total'));
  assert.ok(csv.includes('"Carlos, Jr"'));
  assert.ok(csv.includes('55.50'));
});

test('encodeStoreConfig e decodeStoreConfig preservam configuracao da loja na URL', () => {
  const token = encodeStoreConfig(NICHE_PRESETS.lanchonete);
  const decoded = decodeStoreConfig(token);
  assert.equal(decoded.storeName, NICHE_PRESETS.lanchonete.storeName);
  assert.equal(decoded.items.length, NICHE_PRESETS.lanchonete.items.length);
  assert.equal(decodeStoreConfig('invalid@@@'), null);
});

test('NICHE_PRESETS possui os 4 nichos com itens, cupons e horarios', () => {
  for (const key of ['lanchonete', 'padaria', 'petshop', 'oficina']) {
    assert.ok(NICHE_PRESETS[key].items.length >= 4);
    assert.ok(NICHE_PRESETS[key].pitchTip.length > 10);
    assert.ok(NICHE_PRESETS[key].coupons.length >= 1);
    assert.ok(NICHE_PRESETS[key].openHour.includes(':'));
  }
});
