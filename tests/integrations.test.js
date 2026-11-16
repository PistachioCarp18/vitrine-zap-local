const test = require('node:test');
const assert = require('node:assert/strict');
const {
  crc16Ccitt,
  computeAccessibleBrandTokens,
  generatePixBrCode,
  resolveCouponDiscount,
  calculateFreeDeliveryProgress,
  calculateDepositAmount,
  calculateSplitBill,
  calculateCartTotals,
  normalizeBrPhone,
  isStoreOpenNow,
  evaluateStoreOpenStatus,
  buildShareableBrandUrl,
  buildWhatsAppOrderUrl,
} = require('../src/integrations');
const { createMatrix, renderQrSvg } = require('../src/qrcode');
const { createStore, encodeStoreConfig, decodeStoreConfig, parseBrandUrlParams, exportOrdersCsv } = require('../src/store');
const { NICHE_PRESETS } = require('../src/presets');

// 01-03: Pix EMV & QR Code Offline
test('01. crc16Ccitt retorna 4 caracteres hexadecimais validos', () => {
  const crc = crc16Ccitt('00020126330014br.gov.bcb.pix0111123456789095204000053039865802BR5913ComercioLocal6008Sorocaba62070503***6304');
  assert.match(crc, /^[0-9A-F]{4}$/);
});

test('02. generatePixBrCode gera payload BCB valido com valor e CRC16', () => {
  const code = generatePixBrCode({ pixKey: '15998234575', merchantName: 'Uniao Padaria', merchantCity: 'Sorocaba', amount: 44.5 });
  assert.ok(code.includes('br.gov.bcb.pix'));
  assert.ok(code.includes('540544.50'));
  assert.equal(code.slice(-4), crc16Ccitt(code.slice(0, -4)));
});

test('03. renderQrSvg gera SVG valido 100% offline', () => {
  const brCode = generatePixBrCode({ pixKey: '15998066213', merchantName: 'Emporio Lanches', amount: 32.9 });
  assert.ok(createMatrix(brCode).length >= 29);
  const svg = renderQrSvg(brCode, 176);
  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"') && svg.endsWith('</svg>'));
});

// 04-06: WCAG AA Brand Tokens
test('04. computeAccessibleBrandTokens usa texto escuro (#0F172A) em cor primaria clara', () => {
  const t = computeAccessibleBrandTokens('#FACC15');
  assert.equal(t.onPrimary, '#0F172A');
  assert.equal(t.wcagAA, true);
  assert.ok(t.contrastRatio >= 4.5);
});

test('05. computeAccessibleBrandTokens usa texto branco (#FFFFFF) em cor primaria escura', () => {
  const t = computeAccessibleBrandTokens('#1E293B');
  assert.equal(t.onPrimary, '#FFFFFF');
  assert.equal(t.wcagAA, true);
});

test('06. computeAccessibleBrandTokens normaliza HEX curto e cria tints', () => {
  const t = computeAccessibleBrandTokens('#F60', '#FFFFFF');
  assert.equal(t.primary, '#FF6600');
  assert.match(t.surfaceTint, /^#[0-9A-F]{6}$/);
  assert.match(t.borderTint, /^#[0-9A-F]{6}$/);
});

// 07-12: Carrinho, Frete Gratis, Sinal 50%, Cupons & Split Bill
test('07. calculateFreeDeliveryProgress rastreia meta e zera taxa quando desbloqueado', () => {
  const partial = calculateFreeDeliveryProgress(32.9, 45, 6);
  assert.equal(partial.unlocked, false);
  assert.equal(partial.remaining, 12.1);
  assert.equal(partial.effectiveDeliveryFee, 6);

  const unlocked = calculateFreeDeliveryProgress(48, 45, 6);
  assert.equal(unlocked.unlocked, true);
  assert.equal(unlocked.effectiveDeliveryFee, 0);
});

test('08. calculateDepositAmount calcula sinal exato 50% e saldo na retirada', () => {
  const res = calculateDepositAmount(89.0, 0.5);
  assert.equal(res.deposit, 44.5);
  assert.equal(res.balance, 44.5);
});

test('09. calculateSplitBill divide valor corretamente entre N pessoas', () => {
  const s3 = calculateSplitBill(90, 3);
  assert.equal(s3.peopleCount, 3);
  assert.equal(s3.perPerson, 30);
  assert.ok(s3.perPersonFormatted.includes('30,00'));
});

test('10. calculateSplitBill protege contra valores invalidos (< 1 pessoa)', () => {
  const s0 = calculateSplitBill(50, 0);
  assert.equal(s0.peopleCount, 1);
  assert.equal(s0.perPerson, 50);
});

test('11. resolveCouponDiscount calcula percentual e desconto fixo com teto', () => {
  const coupons = [{ code: 'BAIRRO10', type: 'percent', value: 10 }, { code: 'BEMVINDO5', type: 'fixed', value: 5 }];
  assert.equal(resolveCouponDiscount(100, 'bairro10', coupons).discountAmount, 10);
  assert.equal(resolveCouponDiscount(3, 'BEMVINDO5', coupons).discountAmount, 3);
  assert.equal(resolveCouponDiscount(100, 'NONE', coupons).discountAmount, 0);
});

test('12. calculateCartTotals inclui adicionais, frete e desconto', () => {
  const totals = calculateCartTotals([
    { name: 'X-Martinez', qty: 2, price: 32.9, selectedExtras: [{ name: 'Bacon', price: 5.0 }] },
    { name: 'Refri', qty: 1, price: 6.5 },
  ], 6.0, 5.0);
  assert.equal(totals.itemCount, 3);
  assert.equal(totals.subtotal, 82.3);
  assert.equal(totals.total, 83.3);
});

// 13-16: evaluateStoreOpenStatus & Horarios
test('13. evaluateStoreOpenStatus retorna Aberto dentro do horario comercial', () => {
  const res = evaluateStoreOpenStatus('08:00 - 18:00', new Date('2026-11-16T14:00:00'));
  assert.equal(res.isOpen, true);
  assert.equal(res.statusLabel, 'Aberto');
});

test('14. evaluateStoreOpenStatus retorna Fechado • Abre às HH:MM fora do horario', () => {
  const res = evaluateStoreOpenStatus('18:00 - 23:30', new Date('2026-11-16T14:00:00'));
  assert.equal(res.isOpen, false);
  assert.equal(res.statusLabel, 'Fechado • Abre às 18:00');
  assert.equal(res.actionLabel, 'Agendar pedido');
});

test('15. evaluateStoreOpenStatus suporta turno noturno cruzando meia-noite', () => {
  const late = evaluateStoreOpenStatus('18:00 - 02:00', new Date('2026-11-16T01:00:00'));
  assert.equal(late.isOpen, true);
});

test('16. normalizeBrPhone adiciona prefixo 55 quando ausente', () => {
  assert.equal(normalizeBrPhone('(15) 99639-8869'), '5515996398869');
  assert.equal(normalizeBrPhone('5515996398869'), '5515996398869');
});

// 17-20: Mensagens WhatsApp Polimorficas + Split Bill
test('17. WhatsApp food-delivery inclui divisao de conta (Split Bill), variante e troco', () => {
  const res = buildWhatsAppOrderUrl({
    domainMode: 'food-delivery',
    storeName: 'Emporio Lanches',
    storeWhatsapp: '(15) 99806-6213',
    customerName: 'Lucas',
    deliveryMode: 'Entrega',
    address: 'R. Belmira Loureiro, 100',
    paymentMethod: 'Dinheiro',
    changeFor: 'R$ 100,00',
    splitPeople: 2,
    deliveryFee: 6,
    items: [{ name: 'Combo', qty: 1, price: 68.0, selectedVariant: 'Ao ponto' }],
  });
  assert.ok(res.message.includes('Divisao da conta (2 pessoas)'));
  assert.ok(res.message.includes('Opcao: Ao ponto'));
  assert.ok(res.message.includes('Troco para:* R$ 100,00'));
});

test('18. WhatsApp scheduled-order inclui janela de horario, topo e sinal Pix 50%', () => {
  const res = buildWhatsAppOrderUrl({
    domainMode: 'scheduled-order',
    storeName: 'Uniao Padaria',
    storeWhatsapp: '(15) 99823-4575',
    customerName: 'Ana',
    scheduleDate: '2026-11-20',
    scheduleWindow: '16:00 - 18:30',
    cakeMessage: 'Parabens Ana!',
    payDeposit50: true,
    items: [{ name: 'Bolo Brigadeiro', qty: 1, price: 89.0 }],
  });
  assert.ok(res.message.includes('*ENCOMENDA AGENDADA - Uniao Padaria*'));
  assert.ok(res.message.includes('*Sinal Pix (50%):*'));
});

test('19. WhatsApp recurring-pet inclui pacote selecionado, nome/porte do pet e lembrete', () => {
  const res = buildWhatsAppOrderUrl({
    domainMode: 'recurring-pet',
    storeName: 'Amigo Fiel Pet',
    storeWhatsapp: '15999990003',
    customerName: 'Marcos',
    petName: 'Thor',
    petSize: 'Grande',
    petRemindDays: '30',
    items: [{ name: 'Racao', selectedPack: '15kg (-15%)', qty: 1, price: 169.9 }],
  });
  assert.ok(res.message.includes('(15kg (-15%))'));
  assert.ok(res.message.includes('Thor (Porte: Grande)'));
});

test('20. WhatsApp service-quote inclui codigo SKU [OS-XXX], veiculo, placa, sintoma e validade 7 dias', () => {
  const res = buildWhatsAppOrderUrl({
    domainMode: 'service-quote',
    storeName: 'Fort Center Auto',
    storeWhatsapp: '(15) 99639-8869',
    customerName: 'Rafael',
    vehicleModel: 'Onix 1.0 2021',
    vehiclePlate: 'ABC-1D23',
    vehicleSymptom: 'Barulho ao frear',
    items: [{ sku: 'OS-FREIO-03', name: 'Pastilhas', qty: 1, price: 185 }],
    mode: 'orcamento',
  });
  assert.ok(res.message.includes('[OS-FREIO-03]'));
  assert.ok(res.message.includes('Onix 1.0 2021'));
  assert.ok(res.message.includes('7 dias'));
});

// 21-25: Magic URL, Store, CSV e Topologias Unicas
test('21. buildShareableBrandUrl cabe dentro do QR Code SVG offline', () => {
  const url = buildShareableBrandUrl('https://vitrine-zap-local.vercel.app/', {
    id: 'oficina',
    storeName: 'Fort Center Auto',
    whatsapp: '(15) 99639-8869',
    pixKey: '15996398869',
    primaryColor: '#2563EB',
    brandArchetype: 'industrial-precision',
  });
  const svg = renderQrSvg(url, 210);
  assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'));
});

test('22. parseBrandUrlParams valida inputs de URL e bloqueia cores/arquetipos invalidos', () => {
  const ok = parseBrandUrlParams('?name=Padaria%20Real&color=B45309&archetype=artisanal-warm&niche=padaria');
  assert.equal(ok.storeName, 'Padaria Real');
  assert.equal(ok.primaryColor, '#B45309');
  const bad = parseBrandUrlParams('?color=zzzz&archetype=evil');
  assert.equal(bad.primaryColor, undefined);
  assert.equal(bad.brandArchetype, undefined);
});

test('23. encodeStoreConfig e decodeStoreConfig preservam layoutMode e domainMode', () => {
  const tok = encodeStoreConfig(NICHE_PRESETS.padaria);
  const dec = decodeStoreConfig(tok);
  assert.equal(dec.layoutMode, 'bakery-editorial');
  assert.equal(dec.domainMode, 'scheduled-order');
});

test('24. VitrineStore persiste pedidos, perfil pet, getLastOrder e exportOrdersCsv', () => {
  const mem = {};
  const fake = { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; } };
  const s = createStore(fake);
  s.saveCustomerProfile({ name: 'Ana', petName: 'Mel', petSize: 'Pequeno' });
  s.saveLastCart([{ id: 'pet-1', name: 'Racao', qty: 1, price: 169.9 }]);
  s.recordOrder({ customerName: 'Ana', channel: 'WhatsApp', total: 169.9 });
  assert.equal(s.getLastOrder().items.length, 1);
  assert.equal(s.getDailySummary(new Date().toISOString().slice(0, 10)).count, 1);
  assert.ok(exportOrdersCsv(s.loadHistory()).startsWith('ID,Data,Cliente'));
});

test('25. NICHE_PRESETS define 4 layoutModes e 4 brandArchetypes unicos (sem design generico)', () => {
  const keys = ['lanchonete', 'padaria', 'petshop', 'oficina'];
  assert.equal(new Set(keys.map(k => NICHE_PRESETS[k].layoutMode)).size, 4);
  assert.equal(new Set(keys.map(k => NICHE_PRESETS[k].brandArchetype)).size, 4);
  assert.equal(new Set(keys.map(k => NICHE_PRESETS[k].domainMode)).size, 4);
});

test('26. isStoreOpenNow retrocompativel dentro e fora do turno', () => {
  assert.equal(isStoreOpenNow('08:00', '18:00', new Date('2026-11-16T10:00:00')), true);
  assert.equal(isStoreOpenNow('18:00', '23:30', new Date('2026-11-16T10:00:00')), false);
});
