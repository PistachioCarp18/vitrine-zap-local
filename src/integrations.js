(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrineIntegrations = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function crc16Ccitt(payload) {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  function emvField(id, value) {
    const str = String(value);
    const len = String(str.length).padStart(2, '0');
    return `${id}${len}${str}`;
  }

  function sanitizeAscii(text, maxLen) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 .,-]/g, '')
      .trim()
      .slice(0, maxLen);
  }

  function normalizeHexColor(hexColor, fallback = '#0F766E') {
    const raw = String(hexColor || '').trim();
    const shortMatch = /^#([0-9a-fA-F]{3})$/.exec(raw);
    if (shortMatch) {
      const [r, g, b] = shortMatch[1].split('');
      return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
    }
    const fullMatch = /^#([0-9a-fA-F]{6})$/.exec(raw);
    return fullMatch ? `#${fullMatch[1].toUpperCase()}` : fallback;
  }

  function linearizeChannel(channel255) {
    const c = channel255 / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function computeAccessibleBrandTokens(hexColor, surfaceHex = '#FFFFFF') {
    const primary = normalizeHexColor(hexColor, '#0F766E');
    const r = parseInt(primary.slice(1, 3), 16);
    const g = parseInt(primary.slice(3, 5), 16);
    const b = parseInt(primary.slice(5, 7), 16);

    const luminance = Number((
      0.2126 * linearizeChannel(r) +
      0.7152 * linearizeChannel(g) +
      0.0722 * linearizeChannel(b)
    ).toFixed(4));

    const contrastWithWhite = (1.0 + 0.05) / (luminance + 0.05);
    const darkLum = 0.0199;
    const contrastWithDark = (luminance + 0.05) / (darkLum + 0.05);

    const useDarkText = contrastWithDark >= contrastWithWhite;
    const onPrimary = useDarkText ? '#0F172A' : '#FFFFFF';
    const contrastRatio = Number((useDarkText ? contrastWithDark : contrastWithWhite).toFixed(2));

    const surf = normalizeHexColor(surfaceHex, '#FFFFFF');
    const sr = parseInt(surf.slice(1, 3), 16);
    const sg = parseInt(surf.slice(3, 5), 16);
    const sb = parseInt(surf.slice(5, 7), 16);

    const mix = (a, c, ratio) => Math.round(a * ratio + c * (1 - ratio));
    const toHex = (nr, ng, nb) => '#' + [nr, ng, nb].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();

    return {
      primary,
      onPrimary,
      surfaceTint: toHex(mix(r, sr, 0.08), mix(g, sg, 0.08), mix(b, sb, 0.08)),
      borderTint: toHex(mix(r, sr, 0.26), mix(g, sg, 0.26), mix(b, sb, 0.26)),
      luminance,
      contrastRatio,
      wcagAA: contrastRatio >= 4.5,
    };
  }

  function generatePixBrCode({ pixKey, merchantName, merchantCity = 'Sorocaba', amount = 0, txid = 'VITRINEZAP' }) {
    const key = String(pixKey || '').trim();
    if (!key) throw new Error('Chave Pix obrigatoria para gerar BR Code.');

    const gui = emvField('00', 'br.gov.bcb.pix');
    const keyField = emvField('01', key);
    const merchantAccount = emvField('26', gui + keyField);

    const name = sanitizeAscii(merchantName || 'Comercio Local', 25) || 'Comercio Local';
    const city = sanitizeAscii(merchantCity || 'Sorocaba', 15) || 'Sorocaba';
    const safeTxid = sanitizeAscii(txid || '***', 25).replace(/\s+/g, '') || '***';

    let payload = '';
    payload += emvField('00', '01');
    payload += merchantAccount;
    payload += emvField('52', '0000');
    payload += emvField('53', '986');
    if (Number(amount) > 0) {
      payload += emvField('54', Number(amount).toFixed(2));
    }
    payload += emvField('58', 'BR');
    payload += emvField('59', name);
    payload += emvField('60', city);
    payload += emvField('62', emvField('05', safeTxid));
    payload += '6304';

    return payload + crc16Ccitt(payload);
  }

  function resolveCouponDiscount(subtotal, couponCode, couponsList = []) {
    const code = String(couponCode || '').trim().toUpperCase();
    if (!code || subtotal <= 0) return { applied: null, discountAmount: 0 };
    const found = (couponsList || []).find(c => String(c.code || '').toUpperCase() === code);
    if (!found) return { applied: null, discountAmount: 0 };
    const discountAmount = found.type === 'percent'
      ? (subtotal * Number(found.value || 0)) / 100
      : Number(found.value || 0);
    return {
      applied: found,
      discountAmount: Math.min(subtotal, Math.max(0, Number(discountAmount.toFixed(2)))),
    };
  }

  function calculateFreeDeliveryProgress(subtotal, threshold = 0, baseDeliveryFee = 0) {
    const sub = Math.max(0, Number(subtotal || 0));
    const goal = Math.max(0, Number(threshold || 0));
    const fee = Math.max(0, Number(baseDeliveryFee || 0));
    if (goal <= 0 || fee <= 0) {
      return { enabled: false, unlocked: false, remaining: 0, percent: 100, effectiveDeliveryFee: fee };
    }
    const unlocked = sub >= goal;
    const remaining = unlocked ? 0 : Number((goal - sub).toFixed(2));
    const percent = Math.min(100, Math.round((sub / goal) * 100));
    return {
      enabled: true,
      unlocked,
      remaining,
      percent,
      effectiveDeliveryFee: unlocked ? 0 : fee,
    };
  }

  function calculateDepositAmount(total, ratio = 0.5) {
    const t = Math.max(0, Number(total || 0));
    const r = Math.min(1, Math.max(0, Number(ratio)));
    const deposit = Number((t * r).toFixed(2));
    return { deposit, balance: Number((t - deposit).toFixed(2)) };
  }

  function formatBrl(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function calculateSplitBill(total, peopleCount = 1) {
    const people = Math.max(1, Math.min(20, Math.floor(Number(peopleCount || 1))));
    const safeTotal = Math.max(0, Number(total || 0));
    const perPerson = Number((safeTotal / people).toFixed(2));
    return {
      peopleCount: people,
      perPerson,
      perPersonFormatted: formatBrl(perPerson),
    };
  }

  function calculateCartTotals(items, deliveryFee = 0, discount = 0) {
    const safeItems = Array.isArray(items) ? items : [];
    const subtotal = safeItems.reduce((acc, item) => {
      const qty = Math.max(0, Number(item.qty || 0));
      const extrasSum = Array.isArray(item.selectedExtras)
        ? item.selectedExtras.reduce((s, ex) => s + Math.max(0, Number(ex.price || 0)), 0)
        : 0;
      const price = Math.max(0, Number(item.price || 0)) + extrasSum;
      return acc + qty * price;
    }, 0);
    const fee = Math.max(0, Number(deliveryFee || 0));
    const disc = Math.min(subtotal + fee, Math.max(0, Number(discount || 0)));
    const total = Math.max(0, Number((subtotal + fee - disc).toFixed(2)));
    return {
      itemCount: safeItems.reduce((acc, i) => acc + Math.max(0, Number(i.qty || 0)), 0),
      subtotal: Number(subtotal.toFixed(2)),
      deliveryFee: Number(fee.toFixed(2)),
      discount: Number(disc.toFixed(2)),
      total,
    };
  }

  function normalizeBrPhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '';
    return digits.startsWith('55') ? digits : `55${digits}`;
  }

  function isStoreOpenNow(openHour = '08:00', closeHour = '22:00', nowDate = new Date()) {
    const toMins = (hhmm) => {
      const [h, m] = String(hhmm || '00:00').split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    const nowMins = nowDate.getHours() * 60 + nowDate.getMinutes();
    const start = toMins(openHour);
    const end = toMins(closeHour);
    if (start <= end) return nowMins >= start && nowMins <= end;
    return nowMins >= start || nowMins <= end;
  }

  function evaluateStoreOpenStatus(hoursString = '08:00 - 22:00', nowDate = new Date()) {
    const parts = String(hoursString || '08:00 - 22:00').split('-').map(s => s.trim());
    const openHour = /^\d{2}:\d{2}$/.test(parts[0] || '') ? parts[0] : '08:00';
    const closeHour = /^\d{2}:\d{2}$/.test(parts[1] || '') ? parts[1] : '22:00';
    const isOpen = isStoreOpenNow(openHour, closeHour, nowDate);
    return {
      isOpen,
      openHour,
      closeHour,
      statusLabel: isOpen ? 'Aberto' : `Fechado • Abre às ${openHour}`,
      actionLabel: isOpen ? 'Pedido imediato' : 'Agendar pedido',
    };
  }

  function buildShareableBrandUrl(baseUrl, config = {}) {
    const url = new URL(baseUrl);
    url.search = '';
    const params = new URLSearchParams();
    if (config.storeName) params.set('name', String(config.storeName).slice(0, 60));
    if (config.whatsapp) params.set('phone', normalizeBrPhone(config.whatsapp));
    if (config.pixKey) params.set('pix', String(config.pixKey).slice(0, 60));
    if (config.primaryColor) params.set('color', normalizeHexColor(config.primaryColor));
    if (config.brandArchetype) params.set('archetype', config.brandArchetype);
    if (config.id) params.set('niche', config.id);
    if (config.tagline) params.set('tagline', String(config.tagline).slice(0, 80));
    url.search = params.toString();
    return url.toString();
  }

  function buildWhatsAppOrderUrl({
    storeName,
    storeWhatsapp,
    customerName,
    customerPhone,
    deliveryMode,
    address,
    notes,
    items,
    deliveryFee = 0,
    discount = 0,
    couponCode = '',
    paymentMethod = 'Pix',
    changeFor = '',
    splitPeople = 1,
    routeInfo = null,
    mode = 'pedido',
    domainMode = 'food-delivery',
    scheduleDate = '',
    scheduleWindow = '',
    cakeMessage = '',
    payDeposit50 = false,
    petName = '',
    petSize = '',
    petRemindDays = '',
    vehicleModel = '',
    vehiclePlate = '',
    vehicleSymptom = '',
  }) {
    const targetPhone = normalizeBrPhone(storeWhatsapp);
    if (!targetPhone) throw new Error('WhatsApp da loja invalido.');

    const isServiceQuote = domainMode === 'service-quote' || mode === 'orcamento';
    const effectiveFee = (deliveryMode === 'Entrega' && !isServiceQuote) ? deliveryFee : 0;
    const totals = calculateCartTotals(items, effectiveFee, discount);

    const headerMap = {
      'food-delivery': `*NOVO PEDIDO - ${storeName}*`,
      'scheduled-order': `*ENCOMENDA AGENDADA - ${storeName}*`,
      'recurring-pet': `*PEDIDO PET & RECOMPRA - ${storeName}*`,
      'service-quote': `*PRE-ORCAMENTO TECNICO - ${storeName}*`,
    };
    const header = isServiceQuote
      ? headerMap['service-quote']
      : (headerMap[domainMode] || `*NOVO PEDIDO - ${storeName}*`);

    const lines = [header, '', `*Cliente:* ${customerName || 'Nao informado'}`];
    if (customerPhone) lines.push(`*Contato:* ${customerPhone}`);

    if (domainMode === 'scheduled-order') {
      if (scheduleDate || scheduleWindow) {
        lines.push(`*Retirada/Entrega em:* ${scheduleDate || 'A definir'} (${scheduleWindow || 'Horario comercial'})`);
      }
      if (cakeMessage) lines.push(`*Topo/Embalagem:* ${cakeMessage}`);
    }

    if (domainMode === 'recurring-pet') {
      if (petName || petSize) {
        lines.push(`*Pet:* ${petName || 'Pet'} (Porte: ${petSize || 'Nao informado'})`);
      }
      if (petRemindDays) lines.push(`*Lembrete de recompra:* a cada ${petRemindDays} dias`);
    }

    if (isServiceQuote) {
      if (vehicleModel || vehiclePlate) {
        lines.push(`*Veiculo:* ${vehicleModel || 'Nao informado'} | *Placa/KM:* ${vehiclePlate || '-'}`);
      }
      if (vehicleSymptom) lines.push(`*Sintoma relatado:* ${vehicleSymptom}`);
    } else if (deliveryMode) {
      lines.push(`*Modalidade:* ${deliveryMode}`);
      if (deliveryMode === 'Entrega' && address) lines.push(`*Endereco:* ${address}`);
    }

    lines.push('', isServiceQuote ? '*Servicos e Pecas:*' : '*Itens:*');
    (items || []).forEach((item, idx) => {
      const extrasSum = Array.isArray(item.selectedExtras)
        ? item.selectedExtras.reduce((s, ex) => s + Number(ex.price || 0), 0)
        : 0;
      const unitTotal = Number(item.price || 0) + extrasSum;
      const lineTotal = Number(item.qty || 0) * unitTotal;
      const skuPrefix = isServiceQuote && item.sku ? `[${item.sku}] ` : '';
      const packTag = item.selectedPack ? ` (${item.selectedPack})` : '';
      lines.push(`${idx + 1}. ${skuPrefix}${item.qty}x ${item.name}${packTag} — ${formatBrl(lineTotal)}`);
      if (item.selectedVariant) lines.push(`   Opcao: ${item.selectedVariant}`);
      if (extrasSum > 0 && Array.isArray(item.selectedExtras)) {
        lines.push(`   + Adicionais: ${item.selectedExtras.map(e => e.name).join(', ')}`);
      }
      if (item.itemNote) lines.push(`   Obs.: ${item.itemNote}`);
    });

    lines.push('');
    if (!isServiceQuote && deliveryMode === 'Entrega') {
      lines.push(totals.deliveryFee > 0 ? `Taxa de entrega: ${formatBrl(totals.deliveryFee)}` : 'Taxa de entrega: GRATIS');
    }
    if (totals.discount > 0) {
      lines.push(`Desconto${couponCode ? ` (${couponCode})` : ''}: -${formatBrl(totals.discount)}`);
    }
    lines.push(`*Total:* ${formatBrl(totals.total)}`);

    if (Number(splitPeople) > 1) {
      const split = calculateSplitBill(totals.total, splitPeople);
      lines.push(`*Divisao da conta (${split.peopleCount} pessoas):* ${split.perPersonFormatted} / pessoa`);
    }

    if (domainMode === 'scheduled-order' && payDeposit50) {
      const { deposit, balance } = calculateDepositAmount(totals.total, 0.5);
      lines.push(`*Sinal Pix (50%):* ${formatBrl(deposit)}`);
      lines.push(`*Saldo na entrega/retirada:* ${formatBrl(balance)}`);
    }

    lines.push(`*Pagamento:* ${paymentMethod}`);
    if (paymentMethod === 'Dinheiro' && changeFor) {
      lines.push(`*Troco para:* ${changeFor}`);
    }
    if (!isServiceQuote && deliveryMode === 'Entrega' && routeInfo && routeInfo.googleMapsUrl) {
      lines.push('', `*Rota Motoboy (${routeInfo.distanceKm} km • ~${routeInfo.durationMinutes} min):*`);
      lines.push(`Google Maps: ${routeInfo.googleMapsUrl}`);
      if (routeInfo.wazeUrl) lines.push(`Waze: ${routeInfo.wazeUrl}`);
    }
    if (isServiceQuote) lines.push('*Validade deste pre-orcamento:* 7 dias');
    if (notes) lines.push(`*Observacoes:* ${notes}`);

    const text = lines.join('\n');
    return {
      url: `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`,
      message: text,
      totals,
    };
  }

  return {
    crc16Ccitt,
    computeAccessibleBrandTokens,
    generatePixBrCode,
    resolveCouponDiscount,
    calculateFreeDeliveryProgress,
    calculateDepositAmount,
    calculateSplitBill,
    calculateCartTotals,
    formatBrl,
    normalizeBrPhone,
    isStoreOpenNow,
    evaluateStoreOpenStatus,
    buildShareableBrandUrl,
    buildWhatsAppOrderUrl,
  };
}));
