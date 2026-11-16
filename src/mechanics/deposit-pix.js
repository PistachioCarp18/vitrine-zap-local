(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.VitrineMechanics = root.VitrineMechanics || {}; root.VitrineMechanics['deposit-pix'] = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function calculateSplitDeposit(total, enabled = false, ratio = 0.5) {
    const safeTotal = Math.max(0, Number(total || 0));
    if (!enabled) return { payNow: safeTotal, payLater: 0, ratio: 1 };
    const now = Number((safeTotal * ratio).toFixed(2));
    return { payNow: now, payLater: Number((safeTotal - now).toFixed(2)), ratio };
  }

  function renderDepositSwitchHtml(checked) {
    return `<button type="button" id="pay-deposit-50" role="switch" aria-checked="${checked ? 'true' : 'false'}" class="deposit-switch-btn ${checked ? 'active' : ''}">
      <span class="deposit-switch-label">Pagar sinal de 50% via Pix agora (restante na entrega)</span>
      <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
    </button>`;
  }

  return { id: 'deposit-pix', calculateSplitDeposit, renderDepositSwitchHtml };
}));
