(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.VitrineMechanics = root.VitrineMechanics || {}; root.VitrineMechanics['free-shipping-progress'] = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function renderFreeBarHtml({ enabled, unlocked, remainingFormatted, percent }) {
    if (!enabled) return '';
    const barTxt = unlocked ? 'Entrega Grátis desbloqueada!' : `Faltam ${remainingFormatted} para Entrega Grátis`;
    return `<div id="free-delivery-box" class="free-bar-card" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso de entrega grátis">
      <div class="free-bar-top"><span>${barTxt}</span><span class="mono">${percent}%</span></div>
      <div class="free-progress-track"><div class="free-progress-fill" style="width:${percent}%"></div></div>
    </div>`;
  }

  return { id: 'free-shipping-progress', renderFreeBarHtml };
}));
