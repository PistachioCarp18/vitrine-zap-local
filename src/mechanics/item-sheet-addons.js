(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.VitrineMechanics = root.VitrineMechanics || {}; root.VitrineMechanics['item-sheet-addons'] = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function calculateModalUnitTotal(basePrice, selectedExtras = []) {
    const base = Math.max(0, Number(basePrice || 0));
    const extras = (selectedExtras || []).reduce((s, e) => s + Math.max(0, Number(e.price || 0)), 0);
    return Number((base + extras).toFixed(2));
  }

  return { id: 'item-sheet-addons', calculateModalUnitTotal };
}));
