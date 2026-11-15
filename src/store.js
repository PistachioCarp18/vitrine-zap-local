(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrineStore = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Camada de Persistencia Zero-Custo (backend-squad)
   * Gerencia configuracao White-Label, catalogo e historico diario de pedidos/orcamentos.
   */
  function createStore(storageAdapter, keys = {}) {
    const stateKey = keys.stateKey || 'vitrine_zap_local_state_v2';
    const historyKey = keys.historyKey || 'vitrine_zap_order_history_v1';

    function loadState(fallbackPreset) {
      try {
        const raw = storageAdapter.getItem(stateKey);
        if (raw) return JSON.parse(raw);
      } catch { /* fallback */ }
      return JSON.parse(JSON.stringify(fallbackPreset));
    }

    function saveState(state) {
      storageAdapter.setItem(stateKey, JSON.stringify(state));
    }

    function loadHistory() {
      try {
        const raw = storageAdapter.getItem(historyKey);
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    }

    function recordOrder(entry) {
      const list = loadHistory();
      const record = {
        id: 'ORD-' + Date.now().toString().slice(-6),
        createdAt: new Date().toISOString(),
        ...entry,
      };
      const updated = [record, ...list].slice(0, 100);
      storageAdapter.setItem(historyKey, JSON.stringify(updated));
      return record;
    }

    function clearHistory() {
      storageAdapter.setItem(historyKey, JSON.stringify([]));
    }

    function getDailySummary(isoDatePrefix) {
      const prefix = isoDatePrefix || new Date().toISOString().slice(0, 10);
      const todays = loadHistory().filter(o => String(o.createdAt || '').startsWith(prefix));
      const totalRevenue = todays.reduce((acc, o) => acc + Number(o.total || 0), 0);
      return {
        count: todays.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        orders: todays,
      };
    }

    return { loadState, saveState, loadHistory, recordOrder, clearHistory, getDailySummary };
  }

  return { createStore };
}));
