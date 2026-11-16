(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.VitrineMechanics = root.VitrineMechanics || {}; root.VitrineMechanics['occasion-card-message'] = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const OCCASIONS = ['Todas', 'Romântico', 'Aniversário', 'Agradecimento'];
  const CARD_TEMPLATES = [
    { occasion: 'Aniversário', text: 'Feliz aniversário! Que o seu dia seja tão especial quanto você.' },
    { occasion: 'Romântico', text: 'Para iluminar o seu dia com carinho e boas lembranças.' },
    { occasion: 'Agradecimento', text: 'Muito obrigado por todo o apoio e parceria!' },
  ];
  const MAX_CARD_CHARS = 160;

  function formatCardSummary(rawMessage, isSurprise = false) {
    const text = String(rawMessage || '').trim().slice(0, MAX_CARD_CHARS);
    if (!text && !isSurprise) return '';
    return isSurprise ? `[Presente Surpresa - Sem remetente] ${text}`.trim() : text;
  }

  return { id: 'occasion-card-message', OCCASIONS, CARD_TEMPLATES, MAX_CARD_CHARS, formatCardSummary };
}));
