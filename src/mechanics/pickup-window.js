(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.VitrineMechanics = root.VitrineMechanics || {}; root.VitrineMechanics['pickup-window'] = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function getTomorrowIso(now = new Date()) {
    return new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
  }

  function resolveAvailableWindows(windows = [], isToday = false, nowHour = 10) {
    const list = Array.isArray(windows) && windows.length ? windows : ['08:30 - 11:30', '13:30 - 16:30'];
    if (!isToday) return list;
    const filtered = list.filter(w => {
      const m = /(\d{2}):(\d{2})/.exec(String(w));
      return !m || Number(m[1]) > nowHour;
    });
    return filtered.length ? filtered : ['Próxima janela disponível'];
  }

  return { id: 'pickup-window', getTomorrowIso, resolveAvailableWindows };
}));
