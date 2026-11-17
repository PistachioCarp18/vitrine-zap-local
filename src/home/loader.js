(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrineHomeLoader = factory(root);
  }
}(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  const REGISTERED_HOMES = ['oficina', 'barbearia'];
  const scriptPromises = {};

  function hasCustomHome(vertical) {
    return REGISTERED_HOMES.includes(String(vertical || '').toLowerCase());
  }

  function ensureCategoryStylesheet(vertical) {
    if (typeof document === 'undefined') return Promise.resolve();
    const vKey = String(vertical || '').toLowerCase();
    document.querySelectorAll('link[data-home-css]').forEach((link) => {
      if (link.dataset.homeCss !== vKey) link.disabled = true;
      else link.disabled = false;
    });
    if (!hasCustomHome(vKey)) return Promise.resolve();
    const existing = document.querySelector(`link[data-home-css="${vKey}"]`);
    if (existing) {
      existing.disabled = false;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `./styles/home-${vKey}.css`;
      link.dataset.homeCss = vKey;
      link.onload = () => resolve();
      link.onerror = () => resolve();
      document.head.appendChild(link);
    });
  }

  function loadCategoryHome(vertical) {
    const vKey = String(vertical || '').toLowerCase();
    if (!hasCustomHome(vKey)) {
      return ensureCategoryStylesheet(vKey).then(() => null);
    }
    root.VitrineHomes = root.VitrineHomes || {};
    const cssPromise = ensureCategoryStylesheet(vKey);
    if (root.VitrineHomes[vKey]) {
      return cssPromise.then(() => root.VitrineHomes[vKey]);
    }
    if (!scriptPromises[vKey]) {
      scriptPromises[vKey] = new Promise((resolve) => {
        const s = document.createElement('script');
        s.src = `./src/home/${vKey}.js`;
        s.async = true;
        s.onload = () => resolve(root.VitrineHomes[vKey] || null);
        s.onerror = () => resolve(null);
        document.head.appendChild(s);
      });
    }
    return Promise.all([cssPromise, scriptPromises[vKey]]).then(([, mod]) => mod);
  }

  return {
    REGISTERED_HOMES,
    hasCustomHome,
    loadCategoryHome,
  };
}));
