(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.VitrineMechanics = root.VitrineMechanics || {}; root.VitrineMechanics['inspection-checklist'] = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SEVERITY_MAP = {
    critico: { label: 'Urgente', badgeClass: 'sev-crit' },
    atencao: { label: 'Monitorar', badgeClass: 'sev-warn' },
    rotina: { label: 'Rotina', badgeClass: 'sev-ok' },
  };

  function getItemSeverity(item) {
    const raw = String(item?.severity || '').toLowerCase();
    if (SEVERITY_MAP[raw]) return raw;
    if (/freio|injet|scanner/i.test(String(item?.category || item?.name || ''))) return 'critico';
    if (/suspens|alinhamento/i.test(String(item?.category || item?.name || ''))) return 'atencao';
    return 'rotina';
  }

  function computeItemizedQuoteTotals(items = [], approvedIdsSet = null) {
    const safe = Array.isArray(items) ? items : [];
    let approvedTotal = 0;
    let partsTotal = 0;
    let laborTotal = 0;
    let approvedCount = 0;
    for (const it of safe) {
      const key = it.cartKey || it.id;
      const isApproved = !approvedIdsSet
        ? true
        : (approvedIdsSet instanceof Set
          ? approvedIdsSet.has(key)
          : (approvedIdsSet instanceof Map
            ? approvedIdsSet.get(key) !== false
            : approvedIdsSet[key] !== false));
      if (isApproved) {
        approvedCount += 1;
        const qty = Math.max(1, Number(it.qty || 1));
        approvedTotal += qty * Number(it.price || 0);
        partsTotal += qty * Number(it.partsPrice || 0);
        laborTotal += qty * Number(it.laborPrice ?? it.price ?? 0);
      }
    }
    return {
      approvedCount,
      totalCount: safe.length,
      approvedTotal: Number(approvedTotal.toFixed(2)),
      partsTotal: Number(partsTotal.toFixed(2)),
      laborTotal: Number(laborTotal.toFixed(2)),
    };
  }

  return { id: 'inspection-checklist', SEVERITY_MAP, getItemSeverity, computeItemizedQuoteTotals };
}));
