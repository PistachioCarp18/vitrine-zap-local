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
    let discountAmount = 0;
    if (found.type === 'percent') {
      discountAmount = (subtotal * Number(found.value || 0)) / 100;
    } else {
      discountAmount = Number(found.value || 0);
    }
    discountAmount = Math.min(subtotal, Math.max(0, Number(discountAmount.toFixed(2))));
    return { applied: found, discountAmount };
  }

  /**
   * Engenharia reversa iFood/Amazon: barra de progresso de Frete Gratis.
   */
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

  function formatBrl(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
    mode = 'pedido',
  }) {
    const targetPhone = normalizeBrPhone(storeWhatsapp);
    if (!targetPhone) throw new Error('WhatsApp da loja invalido.');

    const totals = calculateCartTotals(items, deliveryMode === 'Entrega' ? deliveryFee : 0, discount);
    const header = mode === 'orcamento'
      ? `*ORCAMENTO - ${storeName}*`
      : `*NOVO PEDIDO - ${storeName}*`;

    const lines = [
      header,
      '',
      `*Cliente:* ${customerName || 'Nao informado'}`,
    ];
    if (customerPhone) lines.push(`*Contato:* ${customerPhone}`);
    if (deliveryMode) lines.push(`*Modalidade:* ${deliveryMode}`);
    if (deliveryMode === 'Entrega' && address) lines.push(`*Endereco:* ${address}`);

    lines.push('', '*Itens:*');
    (items || []).forEach((item, idx) => {
      const extrasSum = Array.isArray(item.selectedExtras)
        ? item.selectedExtras.reduce((s, ex) => s + Number(ex.price || 0), 0)
        : 0;
      const unitTotal = Number(item.price || 0) + extrasSum;
      const lineTotal = Number(item.qty || 0) * unitTotal;
      lines.push(`${idx + 1}. ${item.qty}x ${item.name} — ${formatBrl(lineTotal)}`);
      if (extrasSum > 0 && Array.isArray(item.selectedExtras)) {
        lines.push(`   + Adicionais: ${item.selectedExtras.map(e => e.name).join(', ')}`);
      }
      if (item.itemNote) {
        lines.push(`   Obs. item: ${item.itemNote}`);
      }
    });

    lines.push('');
    if (deliveryMode === 'Entrega') {
      lines.push(totals.deliveryFee > 0 ? `Taxa de entrega: ${formatBrl(totals.deliveryFee)}` : 'Taxa de entrega: GRATIS');
    }
    if (totals.discount > 0) {
      lines.push(`Desconto${couponCode ? ` (${couponCode})` : ''}: -${formatBrl(totals.discount)}`);
    }
    lines.push(`*Total:* ${formatBrl(totals.total)}`);
    lines.push(`*Pagamento:* ${paymentMethod}`);
    if (paymentMethod === 'Dinheiro' && changeFor) {
      lines.push(`*Troco para:* ${changeFor}`);
    }
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
    generatePixBrCode,
    resolveCouponDiscount,
    calculateFreeDeliveryProgress,
    calculateCartTotals,
    formatBrl,
    normalizeBrPhone,
    isStoreOpenNow,
    buildWhatsAppOrderUrl,
  };
}));
