const test = require('node:test');
const assert = require('node:assert/strict');
const {
  crc16Ccitt,
  computeAccessibleBrandTokens,
  generatePixBrCode,
  resolveCouponDiscount,
  calculateFreeDeliveryProgress,
  calculateDepositAmount,
  calculateCartTotals,
  normalizeBrPhone,
  isStoreOpenNow,
  buildShareableBrandUrl,
  buildWhatsAppOrderUrl,
} = require('../src/integrations');
const { createMatrix, renderQrSvg } = require('../src/qrcode');
const { createStore, encodeStoreConfig, decodeStoreConfig, parseBrandUrlParams, exportOrdersCsv } = require('../src/store');
const { NICHE_PRESETS } = require('../src/presets');

// 1-3: Pix EMV & Offline QR Code
test('01. crc16Ccitt retorna 4 caracteres hexadecimais validos para payload EMV', () => {
  const crc = crc16Ccitt('00020126330014br.gov.bcb.pix0111123456789095204000053039865802BR5913ComercioLocal6008Sorocaba62070503***6304');
  assert.match(crc, /^[0-9A-F]{4}$/);
});

test('02. generatePixBrCode inclui GUI br.gov.bcb.pix, valor formatado e CRC16 final', () => {
  const code = generatePixBrCode({
    pixKey: '15998234575',
    merchantName: 'Uniao Padaria',
    merchantCity: 'Sorocaba',
    amount: 44.5,
  });
  assert.ok(code.includes('br.gov.bcb.pix'));
  assert.ok(code.includes('540544.50'));
  assert.ok(code.includes('5802BR'));
  assert.equal(code.slice(-4), crc16Ccitt(code.slice(0, -4)));
});

test('03. renderQrSvg gera SVG valido 100% offline para payload Pix e Magic Brand URL', () => {
  const brCode = generatePixBrCode({ pixKey: '15998066213', merchantName: 'Emporio Lanches', amount: 32.9 });
  assert.ok(createMatrix(brCode).length >= 29);
  const svg = renderQrSvg(brCode, 176);
  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(svg.includes('<path d="M'));
  assert.ok(svg.endsWith('</svg>'));
});

// 4-7: Motor Matematico de Auto-Contraste WCAG AA (Chameleon Engine)
test('04. computeAccessibleBrandTokens escolhe texto escuro (#0F172A) sobre cor primaria clara', () => {
  const tokens = computeAccessibleBrandTokens('#FACC15'); // Amarelo claro
  assert.equal(tokens.onPrimary, '#0F172A');
  assert.equal(tokens.wcagAA, true);
  assert.ok(tokens.contrastRatio >= 4.5);
});

test('05. computeAccessibleBrandTokens escolhe texto branco (#FFFFFF) sobre cor primaria escura', () => {
  const tokens = computeAccessibleBrandTokens('#1E293B'); // Slate escuro
  assert.equal(tokens.onPrimary, '#FFFFFF');
  assert.equal(tokens.wcagAA, true);
  assert.ok(tokens.contrastRatio >= 4.5);
});

test('06. computeAccessibleBrandTokens normaliza HEX curto (#F60) e gera tints semanticos', () => {
  const tokens = computeAccessibleBrandTokens('#2563EB', '#FFFFFF');
  assert.equal(tokens.primary, '#2563EB');
  assert.match(tokens.surfaceTint, /^#[0-9A-F]{6}$/);
  assert.match(tokens.borderTint, /^#[0-9A-F]{6}$/);
  assert.ok(tokens.luminance > 0 && tokens.luminance < 1);
});

// 7-10: Carrinho, Frete Gratis, Cupons e Sinal 50%
test('07. calculateFreeDeliveryProgress calcula percentual e zera taxa ao atingir meta', () => {
  const partial = calculateFreeDeliveryProgress(45, 60, 6);
  assert.equal(partial.unlocked, false);
  assert.equal(partial.remaining, 15);
  assert.equal(partial.percent, 75);
  assert.equal(partial.effectiveDeliveryFee, 6);

  const unlocked = calculateFreeDeliveryProgress(65, 60, 6);
  assert.equal(unlocked.unlocked, true);
  assert.equal(unlocked.effectiveDeliveryFee, 0);
});

test('08. calculateDepositAmount calcula sinal exato de 50% e saldo restante para encomendas', () => {
  const res = calculateDepositAmount(89.0, 0.5);
  assert.equal(res.deposit, 44.5);
  assert.equal(res.balance, 44.5);
});

test('09. resolveCouponDiscount aplica percentual e fixo respeitando teto do subtotal', () => {
  const coupons = [
    { code: 'BAIRRO10', type: 'percent', value: 10 },
    { code: 'BEMVINDO5', type: 'fixed', value: 5 },
  ];
  assert.equal(resolveCouponDiscount(100, 'bairro10', coupons).discountAmount, 10);
  assert.equal(resolveCouponDiscount(3, 'BEMVINDO5', coupons).discountAmount, 3);
  assert.equal(resolveCouponDiscount(100, 'INEXISTENTE', coupons).discountAmount, 0);
});

test('10. calculateCartTotals soma itens, adicionais pagos, entrega e subtrai cupom', () => {
  const totals = calculateCartTotals([
    { name: 'X-Martinez', qty: 2, price: 32.9, selectedExtras: [{ name: 'Bacon', price: 5.0 }] },
    { name: 'Refri', qty: 1, price: 6.5 },
  ], 6.0, 5.0);
  assert.equal(totals.itemCount, 3);
  assert.equal(totals.subtotal, 82.3);
  assert.equal(totals.total, 83.3);
});

// 11-14: Mensagens WhatsApp Polimorficas para todos os 4 domainModes
test('11. WhatsApp mode food-delivery inclui variante (ponto da carne), adicionais, cupom e troco', () => {
  const res = buildWhatsAppOrderUrl({
    domainMode: 'food-delivery',
    storeName: 'Emporio Lanches Martinez',
    storeWhatsapp: '(15) 99806-6213',
    customerName: 'Lucas',
    deliveryMode: 'Entrega',
    address: 'R. Belmira Loureiro, 100',
    paymentMethod: 'Dinheiro',
    changeFor: 'R$ 100,00',
    discount: 5,
    couponCode: 'BEMVINDO5',
    deliveryFee: 6,
    items: [{ name: 'X-Martinez', qty: 1, price: 32.9, selectedVariant: 'Ao ponto', selectedExtras: [{ name: 'Bacon', price: 5 }] }],
  });
  assert.ok(res.url.startsWith('https://wa.me/5515998066213?text='));
  assert.ok(res.message.includes('*NOVO PEDIDO - Emporio Lanches Martinez*'));
  assert.ok(res.message.includes('Opcao: Ao ponto'));
  assert.ok(res.message.includes('Troco para:* R$ 100,00'));
});

test('12. WhatsApp mode scheduled-order inclui data/janela, topo de bolo e sinal Pix 50%', () => {
  const res = buildWhatsAppOrderUrl({
    domainMode: 'scheduled-order',
    storeName: 'Uniao Padaria',
    storeWhatsapp: '(15) 99823-4575',
    customerName: 'Ana',
    deliveryMode: 'Retirada',
    scheduleDate: '2026-11-20',
    scheduleWindow: '16:00 - 18:30',
    cakeMessage: 'Parabens Ana!',
    payDeposit50: true,
    items: [{ name: 'Bolo Brigadeiro', qty: 1, price: 89.0 }],
  });
  assert.ok(res.message.includes('*ENCOMENDA AGENDADA - Uniao Padaria*'));
  assert.ok(res.message.includes('2026-11-20 (16:00 - 18:30)'));
  assert.ok(res.message.includes('Parabens Ana!'));
  assert.ok(res.message.includes('*Sinal Pix (50%):*'));
  assert.ok(res.message.includes('44,50'));
});

test('13. WhatsApp mode recurring-pet inclui nome/porte do pet e lembrete de recompra', () => {
  const res = buildWhatsAppOrderUrl({
    domainMode: 'recurring-pet',
    storeName: 'Amigo Fiel Pet Care',
    storeWhatsapp: '15999990003',
    customerName: 'Marcos',
    petName: 'Thor',
    petSize: 'Grande',
    petRemindDays: '30',
    items: [{ name: 'Racao 15kg', qty: 1, price: 169.9 }],
  });
  assert.ok(res.message.includes('*PEDIDO PET & RECOMPRA - Amigo Fiel Pet Care*'));
  assert.ok(res.message.includes('Thor (Porte: Grande)'));
  assert.ok(res.message.includes('a cada 30 dias'));
});

test('14. WhatsApp mode service-quote inclui veiculo, placa, sintoma, Peca/MO e validade 7 dias', () => {
  const res = buildWhatsAppOrderUrl({
    domainMode: 'service-quote',
    storeName: 'Fort Center Auto Pecas',
    storeWhatsapp: '(15) 99639-8869',
    customerName: 'Rafael',
    vehicleModel: 'Onix 1.0 2021',
    vehiclePlate: 'ABC-1D23 / 64mil km',
    vehicleSymptom: 'Barulho ao frear',
    items: [{ name: 'Pastilhas Dianteiras', kind: 'Mao de Obra Estimada', qty: 1, price: 185 }],
    mode: 'orcamento',
  });
  assert.ok(res.message.includes('*PRE-ORCAMENTO TECNICO - Fort Center Auto Pecas*'));
  assert.ok(res.message.includes('Onix 1.0 2021'));
  assert.ok(res.message.includes('Barulho ao frear'));
  assert.ok(res.message.includes('[Mao de Obra Estimada]'));
  assert.ok(res.message.includes('7 dias'));
});

// 15-17: Magic Brand URL & QR Code Capacity
test('15. buildShareableBrandUrl gera link compacto e cabe no QR Code SVG offline', () => {
  const url = buildShareableBrandUrl('https://vitrine-zap-local.vercel.app/', {
    id: 'oficina',
    storeName: 'Fort Center Auto',
    whatsapp: '(15) 99639-8869',
    pixKey: '15996398869',
    primaryColor: '#2563EB',
    brandArchetype: 'industrial-precision',
  });
  assert.ok(url.includes('niche=oficina'));
  assert.ok(url.includes('archetype=industrial-precision'));
  const svg = renderQrSvg(url, 132);
  assert.ok(svg.startsWith('<svg'));
});

test('16. parseBrandUrlParams hidrata configuracoes de marca e ignora hex/arquetipos invalidos', () => {
  const parsed = parseBrandUrlParams('?name=Padaria%20Real&phone=15999991111&color=B45309&archetype=artisanal-warm&niche=padaria');
  assert.equal(parsed.storeName, 'Padaria Real');
  assert.equal(parsed.whatsapp, '15999991111');
  assert.equal(parsed.primaryColor, '#B45309');
  assert.equal(parsed.brandArchetype, 'artisanal-warm');
  assert.equal(parsed.id, 'padaria');

  const safeInvalid = parseBrandUrlParams('?color=javascript:alert(1)&archetype=hacked');
  assert.equal(safeInvalid.primaryColor, undefined);
  assert.equal(safeInvalid.brandArchetype, undefined);
});

test('17. encodeStoreConfig e decodeStoreConfig mantem retrocompatibilidade com ?loja=', () => {
  const token = encodeStoreConfig(NICHE_PRESETS.padaria);
  const decoded = decodeStoreConfig(token);
  assert.equal(decoded.domainMode, 'scheduled-order');
  assert.equal(decoded.brandArchetype, 'artisanal-warm');
  assert.equal(decodeStoreConfig('bad@@@'), null);
});

// 18-21: Persistencia, Perfil, CSV, Horario e Presets Polimorficos
test('18. VitrineStore persiste pedidos, perfil com pet, getLastOrder e ticket medio', () => {
  const mem = {};
  const fakeStorage = { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; } };
  const s = createStore(fakeStorage);
  s.saveCustomerProfile({ name: 'Ana', phone: '15999998888', petName: 'Mel', petSize: 'Pequeno' });
  assert.equal(s.loadCustomerProfile().petName, 'Mel');

  s.saveLastCart([{ id: 'pet-1', name: 'Racao 15kg', qty: 1, price: 169.9 }]);
  s.recordOrder({ customerName: 'Ana', channel: 'WhatsApp', total: 169.9 });
  s.recordOrder({ customerName: 'Joao', channel: 'PDF', total: 30.1 });
  assert.equal(s.getLastOrder().items.length, 1);

  const summary = s.getDailySummary(new Date().toISOString().slice(0, 10));
  assert.equal(summary.count, 2);
  assert.equal(summary.totalRevenue, 200);
  assert.equal(summary.avgTicket, 100);
});

test('19. exportOrdersCsv gera CSV escapado pronto para planilhas', () => {
  const csv = exportOrdersCsv([
    { id: 'VZ-101', createdAt: '2026-11-16T10:00:00Z', customerName: 'Silva, Maria', channel: 'WhatsApp', paymentMethod: 'Pix', itemCount: 2, total: 89.5 },
  ]);
  assert.ok(csv.startsWith('ID,Data,Cliente,Canal,Pagamento,Itens,Total'));
  assert.ok(csv.includes('"Silva, Maria"'));
  assert.ok(csv.includes('89.50'));
});

test('20. normalizeBrPhone e isStoreOpenNow funcionam de forma deterministica', () => {
  assert.equal(normalizeBrPhone('(15) 99639-8869'), '5515996398869');
  assert.equal(normalizeBrPhone('5515996398869'), '5515996398869');
  assert.equal(isStoreOpenNow('08:00', '18:00', new Date('2026-11-16T14:00:00')), true);
  assert.equal(isStoreOpenNow('18:00', '23:30', new Date('2026-11-16T14:00:00')), false);
});

test('21. NICHE_PRESETS define 4 domainModes e 4 brandArchetypes unicos e sem duplicacao', () => {
  const keys = ['lanchonete', 'padaria', 'petshop', 'oficina'];
  const modes = new Set(keys.map(k => NICHE_PRESETS[k].domainMode));
  const archetypes = new Set(keys.map(k => NICHE_PRESETS[k].brandArchetype));
  assert.equal(modes.size, 4);
  assert.equal(archetypes.size, 4);
  for (const k of keys) {
    assert.ok(NICHE_PRESETS[k].items.length >= 4);
    assert.ok(NICHE_PRESETS[k].vocab && NICHE_PRESETS[k].vocab.ctaBtn);
  }
});
