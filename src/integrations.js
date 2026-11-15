(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrineIntegrations = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Calcula CRC16-CCITT (polinomio 0x1021, inicial 0xFFFF) exigido pelo padrao EMV Pix do Banco Central.
   * @param {string} payload
   * @returns {string} 4 caracteres hexadecimais em maiusculo
   */
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

  /**
   * Gera codigo Pix Copia-e-Cola estatico (EMV BR Code) 100% offline sem API paga.
   * @param {Object} params
   * @param {string} params.pixKey - Chave Pix (CPF, CNPJ, email, telefone +55... ou aleatoria)
   * @param {string} params.merchantName - Nome do recebedor (ate 25 chars)
   * @param {string} [params.merchantCity='Sorocaba'] - Cidade (ate 15 chars)
   * @param {number} [params.amount=0] - Valor em reais (opcional)
   * @param {string} [params.txid='VITRINEZAP'] - Identificador da transacao
   * @returns {string} Payload EMV completo com CRC16
   */
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
    payload += emvField('00', '01');                  // Payload Format Indicator
    payload += merchantAccount;                       // Merchant Account Information (Pix)
    payload += emvField('52', '0000');                // Merchant Category Code
    payload += emvField('53', '986');                 // BRL (986)
    if (Number(amount) > 0) {
      payload += emvField('54', Number(amount).toFixed(2));
    }
    payload += emvField('58', 'BR');                  // Country Code
    payload += emvField('59', name);                  // Merchant Name
    payload += emvField('60', city);                  // Merchant City
    payload += emvField('62', emvField('05', safeTxid)); // Additional Data Field (TXID)
    payload += '6304';                                // CRC16 header

    return payload + crc16Ccitt(payload);
  }

  /**
   * Calcula totais do carrinho/orcamento de forma deterministica.
   */
  function calculateCartTotals(items, deliveryFee = 0, discount = 0) {
    const safeItems = Array.isArray(items) ? items : [];
    const subtotal = safeItems.reduce((acc, item) => {
      const qty = Math.max(0, Number(item.qty || 0));
      const price = Math.max(0, Number(item.price || 0));
      return acc + qty * price;
    }, 0);
    const fee = Math.max(0, Number(deliveryFee || 0));
    const disc = Math.max(0, Number(discount || 0));
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

  /**
   * Monta link wa.me com mensagem formatada para WhatsApp (custo zero, sem WhatsApp Business API).
   */
  function buildWhatsAppOrderUrl({ storeName, storeWhatsapp, customerName, customerPhone, deliveryMode, address, notes, items, deliveryFee = 0, paymentMethod = 'Pix', mode = 'pedido' }) {
    const targetPhone = normalizeBrPhone(storeWhatsapp);
    if (!targetPhone) throw new Error('WhatsApp da loja invalido.');

    const totals = calculateCartTotals(items, deliveryMode === 'Entrega' ? deliveryFee : 0);
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
      const lineTotal = Number(item.qty || 0) * Number(item.price || 0);
      lines.push(`${idx + 1}. ${item.qty}x ${item.name} — ${formatBrl(lineTotal)}`);
    });

    lines.push('');
    if (totals.deliveryFee > 0) lines.push(`Taxa de entrega: ${formatBrl(totals.deliveryFee)}`);
    lines.push(`*Total:* ${formatBrl(totals.total)}`);
    lines.push(`*Pagamento:* ${paymentMethod}`);
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
    calculateCartTotals,
    formatBrl,
    normalizeBrPhone,
    buildWhatsAppOrderUrl,
  };
}));
