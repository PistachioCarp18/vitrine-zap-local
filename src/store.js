(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrineStore = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function encodeStoreConfig(state) {
    const compact = {
      id: state.id || 'custom',
      storeName: state.storeName || '',
      neighborhood: state.neighborhood || '',
      tagline: state.tagline || '',
      whatsapp: state.whatsapp || '',
      pixKey: state.pixKey || '',
      deliveryFee: Number(state.deliveryFee || 0),
      primaryColor: state.primaryColor || '#0F766E',
      openHour: state.openHour || '08:00',
      closeHour: state.closeHour || '22:00',
      mode: state.mode || 'pedido',
      coupons: (state.coupons || []).slice(0, 5),
      items: (state.items || []).slice(0, 30).map(i => ({
        id: i.id,
        category: i.category,
        name: i.name,
        description: i.description || '',
        price: Number(i.price || 0),
        badge: i.badge || '',
        prepTime: i.prepTime || '',
        paused: Boolean(i.paused),
      })),
    };
    const json = JSON.stringify(compact);
    let b64;
    if (typeof Buffer !== 'undefined') {
      b64 = Buffer.from(json, 'utf8').toString('base64');
    } else {
      const bytes = new TextEncoder().encode(json);
      let bin = '';
      bytes.forEach(b => { bin += String.fromCharCode(b); });
      b64 = btoa(bin);
    }
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decodeStoreConfig(token) {
    if (!token || typeof token !== 'string') return null;
    try {
      let b64 = token.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      let json;
      if (typeof Buffer !== 'undefined') {
        json = Buffer.from(b64, 'base64').toString('utf8');
      } else {
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
        json = new TextDecoder().decode(bytes);
      }
      const parsed = JSON.parse(json);
      if (!parsed || !parsed.storeName || !Array.isArray(parsed.items)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function exportOrdersCsv(orders) {
    const header = 'ID,Data,Cliente,Canal,Pagamento,Itens,Total';
    const rows = (orders || []).map(o => [
      o.id || '',
      o.createdAt || '',
      `"${String(o.customerName || '').replace(/"/g, '""')}"`,
      o.channel || '',
      o.paymentMethod || '',
      Number(o.itemCount || 0),
      Number(o.total || 0).toFixed(2),
    ].join(','));
    return [header, ...rows].join('\n');
  }

  function createStore(storageAdapter, keys = {}) {
    const stateKey = keys.stateKey || 'vitrine_zap_local_state_v4';
    const historyKey = keys.historyKey || 'vitrine_zap_order_history_v1';
    const customerKey = keys.customerKey || 'vitrine_zap_customer_profile_v1';
    const lastOrderKey = keys.lastOrderKey || 'vitrine_zap_last_cart_v1';

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

    function loadCustomerProfile() {
      try {
        const raw = storageAdapter.getItem(customerKey);
        return raw ? JSON.parse(raw) : { name: '', phone: '', address: '' };
      } catch {
        return { name: '', phone: '', address: '' };
      }
    }

    function saveCustomerProfile(profile) {
      storageAdapter.setItem(customerKey, JSON.stringify(profile));
    }

    function saveLastCart(items) {
      storageAdapter.setItem(lastOrderKey, JSON.stringify(items || []));
    }

    function loadLastCart() {
      try {
        const raw = storageAdapter.getItem(lastOrderKey);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
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
        id: 'VZ-' + Date.now().toString().slice(-6),
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
      const avgTicket = todays.length ? totalRevenue / todays.length : 0;
      return {
        count: todays.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        avgTicket: Number(avgTicket.toFixed(2)),
        orders: todays,
      };
    }

    return {
      loadState,
      saveState,
      loadCustomerProfile,
      saveCustomerProfile,
      saveLastCart,
      loadLastCart,
      loadHistory,
      recordOrder,
      clearHistory,
      getDailySummary,
    };
  }

  return { createStore, encodeStoreConfig, decodeStoreConfig, exportOrdersCsv };
}));
