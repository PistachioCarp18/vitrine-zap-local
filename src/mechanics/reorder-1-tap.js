(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.VitrineMechanics = root.VitrineMechanics || {}; root.VitrineMechanics['reorder-1-tap'] = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function canQuickReorder(lastOrder) {
    return Boolean(lastOrder && Array.isArray(lastOrder.items) && lastOrder.items.length > 0);
  }

  return { id: 'reorder-1-tap', canQuickReorder };
}));
