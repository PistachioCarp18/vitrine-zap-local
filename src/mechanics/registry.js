(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrineMechanicsRegistry = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const CATEGORY_MECHANICS_MAP = {
    lanchonete: ['item-sheet-addons', 'free-shipping-progress', 'reorder-1-tap'],
    padaria: ['pickup-window', 'deposit-pix', 'reorder-1-tap'],
    petshop: ['autoship-reminder', 'reorder-1-tap'],
    oficina: ['inspection-checklist'],
    barbearia: ['slot-picker'],
    moda: ['variant-picker'],
    floricultura: ['occasion-card-message', 'pickup-window', 'deposit-pix'],
  };

  const MECHANIC_ALLOWED_CATEGORIES = {
    'item-sheet-addons': ['lanchonete', 'padaria', 'floricultura', 'custom'],
    'free-shipping-progress': ['lanchonete', 'moda'],
    'reorder-1-tap': ['lanchonete', 'padaria', 'petshop'],
    'pickup-window': ['padaria', 'floricultura'],
    'deposit-pix': ['padaria', 'floricultura'],
    'autoship-reminder': ['petshop'],
    'inspection-checklist': ['oficina'],
    'slot-picker': ['barbearia'],
    'variant-picker': ['moda'],
    'occasion-card-message': ['floricultura'],
  };

  const MECHANIC_LABELS = {
    'item-sheet-addons': 'Customização em Sheet (Adicionais)',
    'free-shipping-progress': 'Barra de Frete Grátis Progressiva',
    'reorder-1-tap': 'Recompra em 1 Toque',
    'pickup-window': 'Janela de Retirada / Entrega Agendada',
    'deposit-pix': 'Sinal 50% no Pix (Switch Acessível)',
    'autoship-reminder': 'Calculadora de Ração + Lembrete Recorrente',
    'inspection-checklist': 'Inspeção Semáforo + Aprovação por Item OS',
    'slot-picker': 'Reserva Expressa por Profissional & Horário',
    'variant-picker': 'Grade Tamanho/Cor + Guia de Medidas',
    'occasion-card-message': 'Filtro por Ocasião + Cartão Dedicatória',
  };

  function getAllowedMechanicsForCategory(category) {
    const cat = String(category || 'lanchonete').toLowerCase();
    return Object.entries(MECHANIC_ALLOWED_CATEGORIES)
      .filter(([, cats]) => cats.includes(cat))
      .map(([id]) => id);
  }

  function resolveActiveMechanics(state = {}) {
    const cat = String(state.vertical || state.id || 'lanchonete').toLowerCase();
    const defaults = CATEGORY_MECHANICS_MAP[cat] || [];
    const allowed = new Set(getAllowedMechanicsForCategory(cat));
    if (Array.isArray(state.enabledMechanics)) {
      return state.enabledMechanics.filter(id => allowed.has(id));
    }
    return defaults.filter(id => allowed.has(id));
  }

  const loadedScripts = new Set();
  function loadMechanicsOnDemand(ids = []) {
    if (typeof document === 'undefined') return Promise.resolve([]);
    const list = Array.isArray(ids) ? ids : [];
    const promises = list.map((id) => {
      if (loadedScripts.has(id)) return Promise.resolve(id);
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = `./src/mechanics/${id}.js`;
        script.async = false;
        script.onload = () => { loadedScripts.add(id); resolve(id); };
        script.onerror = () => resolve(id);
        document.head.appendChild(script);
      });
    });
    return Promise.all(promises);
  }

  return {
    CATEGORY_MECHANICS_MAP,
    MECHANIC_ALLOWED_CATEGORIES,
    MECHANIC_LABELS,
    getAllowedMechanicsForCategory,
    resolveActiveMechanics,
    loadMechanicsOnDemand,
  };
}));
