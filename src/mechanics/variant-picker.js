(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.VitrineMechanics = root.VitrineMechanics || {}; root.VitrineMechanics['variant-picker'] = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SIZE_GUIDE_CM = [
    { size: 'P', chest: '92–96', waist: '76–80', length: '68' },
    { size: 'M', chest: '98–104', waist: '82–88', length: '71' },
    { size: 'G', chest: '106–112', waist: '90–96', length: '74' },
    { size: 'GG', chest: '114–120', waist: '98–104', length: '76' },
  ];

  function isSizeAvailable(item, size) {
    if (!item || !Array.isArray(item.outOfStockSizes)) return true;
    return !item.outOfStockSizes.includes(size);
  }

  function renderSizeGuideTableHtml() {
    const rows = SIZE_GUIDE_CM.map(r => `<tr><td class="mono"><strong>${r.size}</strong></td><td class="mono">${r.chest}</td><td class="mono">${r.waist}</td><td class="mono">${r.length}</td></tr>`).join('');
    return `<table class="size-guide-table"><thead><tr><th>Tam.</th><th>Tórax (cm)</th><th>Cintura (cm)</th><th>Compr. (cm)</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  return { id: 'variant-picker', SIZE_GUIDE_CM, isSizeAvailable, renderSizeGuideTableHtml };
}));
