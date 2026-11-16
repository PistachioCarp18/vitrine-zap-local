(function () {
  'use strict';

  const {
    generatePixBrCode,
    resolveCouponDiscount,
    calculateFreeDeliveryProgress,
    calculateDepositAmount,
    calculateSplitBill,
    calculateCartTotals,
    formatBrl,
    evaluateStoreOpenStatus,
    buildWhatsAppOrderUrl,
  } = window.VitrineIntegrations;
  const { renderQrSvg } = window.VitrineQrCode;
  const {
    SOROCABA_STORES_COORDS,
    lookupBrazilianCep,
    calculateRouteAndDeliveryFee,
    fetchSorocabaWeather,
    searchFipeVehicles,
  } = window.VitrineGeoApis;
  const {
    generateBrandTokens,
    validateBrandConfig,
    encodeMagicHash,
    decodeMagicHash,
  } = window.VitrineBrandEngine;
  const {
    MECHANIC_LABELS,
    getAllowedMechanicsForCategory,
    resolveActiveMechanics,
    loadMechanicsOnDemand,
  } = window.VitrineMechanicsRegistry;
  const { createStore, decodeStoreConfig, parseBrandUrlParams, exportOrdersCsv } = window.VitrineStore;
  const { NICHE_PRESETS } = window.VitrinePresets;

  window.VitrineMechanics = window.VitrineMechanics || {};

  const store = createStore(window.localStorage);
  let state = loadInitialState();
  let activeMechanics = resolveActiveMechanics(state);
  let cart = [];
  let activeCategory = 'Todos';
  let activeOccasion = 'Todas';
  let activeSeverityFilter = 'todos';
  let sortMode = 'featured';
  let deliveryMode = 'Retirada';
  let paymentMethod = 'Pix';
  let activeCouponCode = '';
  let splitPeople = 1;
  let payDeposit50Flag = false;
  let surpriseGiftFlag = false;
  let selectedBookingDayIso = new Date().toISOString().slice(0, 10);
  let selectedBarberFilter = 'Todos';
  let pendingPhotoDataUrl = '';
  let routeInfo = null;
  let weatherInfo = null;
  const selectedPackIdxMap = {};
  const selectedSlotMap = {};
  const selectedSizeMap = {};
  const osApprovedMap = {};
  let modalState = { item: null, qty: 1, selectedExtras: [], selectedVariant: '', packOverride: null };

  const NICHE_EMBLEMS = {
    lanchonete: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 11h18"/><path d="M5 11a7 7 0 0 1 14 0"/><path d="M4 15h16a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a1 1 0 0 1 1-1z"/></svg>',
    padaria: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>',
    petshop: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>',
    oficina: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    barbearia: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>',
    moda: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>',
    floricultura: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V9m-4.5 3a4.5 4.5 0 1 0 4.5 4.5M7.5 12H9m3 4.5a4.5 4.5 0 1 0 4.5-4.5M12 16.5V15m4.5-3H15"/><circle cx="12" cy="12" r="2"/></svg>',
  };

  function hasMech(id) {
    return activeMechanics.includes(id);
  }

  function mergePresetWithBrand(basePreset, brandPatch) {
    const merged = JSON.parse(JSON.stringify(basePreset));
    if (brandPatch.name) {
      merged.identity = { ...(merged.identity || {}), name: brandPatch.name };
      merged.storeName = brandPatch.name;
      merged.logoInitials = brandPatch.name.slice(0, 2).toUpperCase();
    }
    if (brandPatch.identity) {
      merged.identity = { ...(merged.identity || {}), ...brandPatch.identity };
      merged.storeName = merged.identity.name || merged.storeName;
      merged.tagline = merged.identity.tagline || merged.tagline;
      merged.logoInitials = merged.identity.logo?.initials || merged.logoInitials;
    }
    if (typeof brandPatch.color === 'string') {
      merged.color = { ...(merged.color || {}), seed: brandPatch.color };
      merged.primaryColor = brandPatch.color;
    } else if (brandPatch.color && typeof brandPatch.color === 'object') {
      merged.color = { ...(merged.color || {}), ...brandPatch.color };
      merged.primaryColor = merged.color.seed || merged.primaryColor;
    }
    if (brandPatch.font) merged.type = { ...(merged.type || {}), stack: brandPatch.font };
    else if (brandPatch.type) merged.type = { ...(merged.type || {}), ...brandPatch.type };
    if (brandPatch.radius) merged.shape = { ...(merged.shape || {}), radius: brandPatch.radius };
    else if (brandPatch.shape) merged.shape = { ...(merged.shape || {}), ...brandPatch.shape };
    if (typeof brandPatch.layout === 'string') {
      merged.layout = { ...(merged.layout || {}), catalog: brandPatch.layout };
      merged.layoutMode = brandPatch.layout;
    } else if (brandPatch.layout && typeof brandPatch.layout === 'object') {
      merged.layout = { ...(merged.layout || {}), ...brandPatch.layout };
      merged.layoutMode = merged.layout.catalog || merged.layoutMode;
    }
    if (brandPatch.whatsapp) {
      merged.contact = { ...(merged.contact || {}), whatsapp: brandPatch.whatsapp };
      merged.whatsapp = brandPatch.whatsapp;
    }
    if (brandPatch.vocabulary) merged.vocabulary = { ...(merged.vocabulary || {}), ...brandPatch.vocabulary };
    if (brandPatch.modules) merged.modules = { ...(merged.modules || {}), ...brandPatch.modules };
    if (brandPatch.geo) {
      merged.geo = { ...(merged.geo || {}), ...brandPatch.geo };
      merged.neighborhood = [merged.geo.neighborhood, merged.geo.city].filter(Boolean).join(' • ') || merged.neighborhood;
    }
    if (brandPatch.contact) {
      merged.contact = { ...(merged.contact || {}), ...brandPatch.contact };
      if (merged.contact.whatsapp) merged.whatsapp = merged.contact.whatsapp;
    }
    return merged;
  }

  function loadInitialState() {
    if (window.location.hash && window.location.hash.includes('brand=')) {
      const decodedHash = decodeMagicHash(window.location.hash);
      if (decodedHash) {
        const base = NICHE_PRESETS[decodedHash.vertical] || NICHE_PRESETS.lanchonete;
        const merged = mergePresetWithBrand(base, decodedHash);
        store.saveState(merged);
        return merged;
      }
    }

    const search = window.location.search;
    const params = new URLSearchParams(search);
    const verticalParam = params.get('vertical');
    if (verticalParam && NICHE_PRESETS[verticalParam]) {
      const fresh = JSON.parse(JSON.stringify(NICHE_PRESETS[verticalParam]));
      store.saveState(fresh);
      return fresh;
    }

    const brandOverrides = parseBrandUrlParams(search);
    if (brandOverrides) {
      const basePreset = NICHE_PRESETS[brandOverrides.id] || NICHE_PRESETS.lanchonete;
      const merged = { ...JSON.parse(JSON.stringify(basePreset)), ...brandOverrides };
      if (brandOverrides.storeName && merged.identity) merged.identity.name = brandOverrides.storeName;
      if (brandOverrides.primaryColor && merged.color) merged.color.seed = brandOverrides.primaryColor;
      store.saveState(merged);
      return merged;
    }

    const shared = params.get('loja');
    if (shared) {
      const decoded = decodeStoreConfig(shared);
      if (decoded) {
        store.saveState(decoded);
        return decoded;
      }
    }
    return store.loadState(NICHE_PRESETS.lanchonete);
  }

  function showToast(msg) {
    const wrap = document.getElementById('toast-container');
    wrap.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 2500);
  }

  function initTheme() {
    const saved = window.localStorage.getItem('vitrine_theme');
    document.documentElement.setAttribute('data-theme', saved || 'light');
  }

  function syncBodyScrollLock() {
    const drawerOpen = document.getElementById('cart-aside').classList.contains('drawer-open');
    const modalOpen = !document.getElementById('item-modal').classList.contains('hidden');
    const studioOpen = !document.getElementById('merchant-studio-modal').classList.contains('hidden');
    const guideOpen = !document.getElementById('size-guide-modal').classList.contains('hidden');
    document.body.classList.toggle('sheet-lock', drawerOpen || modalOpen || studioOpen || guideOpen);
  }

  function setWizardStep(step) {
    const isExpressBooking = hasMech('slot-picker');
    document.getElementById('checkout-step-1').classList.toggle('hidden', step !== 1);
    document.getElementById('checkout-step-2').classList.toggle('hidden', step !== 2);
    document.getElementById('wizard-back-btn').classList.toggle('hidden', isExpressBooking && cart.length <= 1 && step === 2);
    document.getElementById('wizard-step-label').textContent = isExpressBooking && step === 2
      ? 'Reserva Expressa'
      : `Etapa ${step}/2`;
  }

  function pushOverlayHistory(tag) {
    try { window.history.pushState({ overlay: tag }, ''); } catch { /* ignore */ }
  }

  function openCartDrawer(initialStep = 1) {
    setWizardStep(initialStep);
    document.getElementById('cart-aside').classList.add('drawer-open');
    document.getElementById('cart-backdrop').classList.remove('hidden');
    syncBodyScrollLock();
    pushOverlayHistory('cart');
  }

  function closeCartDrawer() {
    document.getElementById('cart-aside').classList.remove('drawer-open');
    document.getElementById('cart-backdrop').classList.add('hidden');
    syncBodyScrollLock();
  }

  function openStudioModal() {
    renderStudioPanel();
    document.getElementById('studio-backdrop').classList.remove('hidden');
    document.getElementById('merchant-studio-modal').classList.remove('hidden');
    syncBodyScrollLock();
    pushOverlayHistory('studio');
  }

  function closeStudioModal() {
    document.getElementById('studio-backdrop').classList.add('hidden');
    document.getElementById('merchant-studio-modal').classList.add('hidden');
    syncBodyScrollLock();
  }

  function openSizeGuideModal() {
    const mod = window.VitrineMechanics['variant-picker'];
    const html = mod ? mod.renderSizeGuideTableHtml() : '<p>Medidas P (92-96cm) a GG (114-120cm).</p>';
    document.getElementById('size-guide-body').innerHTML = html;
    document.getElementById('size-guide-backdrop').classList.remove('hidden');
    document.getElementById('size-guide-modal').classList.remove('hidden');
    syncBodyScrollLock();
    pushOverlayHistory('size-guide');
  }

  function closeSizeGuideModal() {
    document.getElementById('size-guide-backdrop').classList.add('hidden');
    document.getElementById('size-guide-modal').classList.add('hidden');
    syncBodyScrollLock();
  }

  function downloadIcsFile(icsContent, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' }));
    a.download = filename;
    a.click();
  }

  function compressImageToWebp(file) {
    return new Promise((resolve) => {
      if (!file) { resolve(''); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 320;
          const ctx = canvas.getContext('2d');
          const scale = Math.max(320 / img.width, 320 / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(img, (320 - w) / 2, (320 - h) / 2, w, h);
          try { resolve(canvas.toDataURL('image/webp', 0.78)); }
          catch { resolve(canvas.toDataURL('image/jpeg', 0.8)); }
        };
        img.onerror = () => resolve('');
        img.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });
  }

  function getItemUnitPrice(item) {
    const extrasSum = Array.isArray(item.selectedExtras)
      ? item.selectedExtras.reduce((s, ex) => s + Number(ex.price || 0), 0)
      : 0;
    return Number(item.price || 0) + extrasSum;
  }

  function getCartKey(item, extras = [], itemNote = '', variant = '', packLabel = '') {
    const exKey = (extras || []).map(e => e.id).sort().join(',');
    return `${item.id}::${packLabel}::${variant}::${exKey}::${itemNote.trim()}`;
  }

  function addItemToCart(item, qty = 1, selectedExtras = [], itemNote = '', selectedVariant = '', packOverride = null) {
    const chosenPrice = packOverride ? Number(packOverride.price) : Number(item.price || 0);
    const chosenPack = packOverride ? packOverride.label : '';
    const cartKey = getCartKey(item, selectedExtras, itemNote, selectedVariant, chosenPack);
    const existing = cart.find(c => c.cartKey === cartKey);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        ...item,
        price: chosenPrice,
        selectedPack: chosenPack,
        cartKey,
        selectedExtras,
        selectedVariant,
        itemNote: itemNote.trim(),
        qty,
      });
      osApprovedMap[cartKey] = true;
    }
    renderCatalog();
    renderCart();
  }

  function openItemModal(item) {
    let variants = Array.isArray(item.variants) ? [...item.variants] : [];
    let variantLabel = item.variantLabel || 'Selecione uma opção';
    let defaultVariant = variants[0] || '';
    if (!variants.length && Array.isArray(item.slots) && item.slots.length) {
      variants = item.slots.map(s => `Horário ${s}`);
      variantLabel = 'Horário livre';
      defaultVariant = `Horário ${selectedSlotMap[item.id] || item.slots[0]}`;
    } else if (!variants.length && Array.isArray(item.sizes) && item.sizes.length) {
      variants = item.sizes.map(sz => `Tamanho ${sz}`);
      variantLabel = 'Tamanho';
      defaultVariant = `Tamanho ${selectedSizeMap[item.id] || item.sizes[0]}`;
    }

    const packIdx = selectedPackIdxMap[item.id] ?? item.defaultPackIdx ?? 0;
    const chosenPack = Array.isArray(item.packOptions) ? item.packOptions[packIdx] : null;
    modalState = { item, qty: 1, selectedExtras: [], selectedVariant: defaultVariant, packOverride: chosenPack };

    document.getElementById('modal-item-cat').textContent = item.sku ? `${item.sku} • ${item.category}` : item.category;
    document.getElementById('modal-item-title').textContent = item.name;
    document.getElementById('modal-item-desc').textContent = item.description || '';
    document.getElementById('modal-item-note').value = '';
    document.getElementById('modal-qty-val').textContent = '1';

    const photoWrap = document.getElementById('modal-item-photo');
    if (item.photoDataUrl) {
      photoWrap.innerHTML = `<img src="${item.photoDataUrl}" alt="${item.name}" />`;
      photoWrap.classList.remove('hidden');
    } else {
      photoWrap.classList.add('hidden');
      photoWrap.innerHTML = '';
    }

    const varWrap = document.getElementById('modal-variants-wrap');
    const varList = document.getElementById('modal-variants-list');
    if (variants.length) {
      varWrap.classList.remove('hidden');
      document.getElementById('modal-variant-label').textContent = variantLabel;
      varList.setAttribute('role', 'radiogroup');
      varList.innerHTML = variants.map(v =>
        `<button type="button" role="radio" aria-checked="${v === defaultVariant ? 'true' : 'false'}" class="variant-pill ${v === defaultVariant ? 'active' : ''}" data-var="${v}">${v}</button>`
      ).join('');
      varList.querySelectorAll('.variant-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          varList.querySelectorAll('.variant-pill').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-checked', 'false'); });
          btn.classList.add('active');
          btn.setAttribute('aria-checked', 'true');
          modalState.selectedVariant = btn.dataset.var;
        });
      });
    } else {
      varWrap.classList.add('hidden');
    }

    const extrasWrap = document.getElementById('modal-extras-wrap');
    const extrasList = document.getElementById('modal-extras-list');
    const extras = Array.isArray(item.extras) ? item.extras : [];
    if (extras.length) {
      extrasWrap.classList.remove('hidden');
      extrasList.innerHTML = extras.map(ex => `
        <label class="extra-option">
          <span class="extra-option-left"><input type="checkbox" class="extra-check" value="${ex.id}" /><span>${ex.name}</span></span>
          <strong class="mono">+${formatBrl(ex.price)}</strong>
        </label>`).join('');
      extrasList.querySelectorAll('.extra-check').forEach(chk => {
        chk.addEventListener('change', () => {
          const checkedIds = [...extrasList.querySelectorAll('.extra-check:checked')].map(c => c.value);
          modalState.selectedExtras = extras.filter(e => checkedIds.includes(e.id));
          updateModalCta();
        });
      });
    } else {
      extrasWrap.classList.add('hidden');
    }

    updateModalCta();
    document.getElementById('item-modal-backdrop').classList.remove('hidden');
    document.getElementById('item-modal').classList.remove('hidden');
    syncBodyScrollLock();
    pushOverlayHistory('item');
  }

  function closeItemModal() {
    document.getElementById('item-modal-backdrop').classList.add('hidden');
    document.getElementById('item-modal').classList.add('hidden');
    syncBodyScrollLock();
  }

  function updateModalCta() {
    if (!modalState.item) return;
    const base = modalState.packOverride ? Number(modalState.packOverride.price) : Number(modalState.item.price || 0);
    const sheetMod = window.VitrineMechanics['item-sheet-addons'];
    const unit = sheetMod
      ? sheetMod.calculateModalUnitTotal(base, modalState.selectedExtras)
      : (base + modalState.selectedExtras.reduce((s, e) => s + Number(e.price || 0), 0));
    const total = unit * modalState.qty;
    document.getElementById('modal-qty-val').textContent = String(modalState.qty);
    document.getElementById('modal-add-btn').textContent = `Adicionar • ${formatBrl(total)}`;
  }

  function renderVerticalContextSlot() {
    const slot = document.getElementById('vertical-context-slot');

    if (hasMech('inspection-checklist')) {
      slot.classList.remove('hidden');
      slot.innerHTML = `
        <div class="auto-vehicle-bar">
          <div class="container auto-vehicle-grid">
            <input type="text" id="quick-veh-model" list="fipe-vehicles-list" class="text-input compact-input" placeholder="Veículo (Ex: Onix 1.0)" aria-label="Modelo do veículo" />
            <input type="text" id="quick-veh-plate" class="text-input compact-input mono" placeholder="Placa / KM" aria-label="Placa ou quilometragem" />
          </div>
          <datalist id="fipe-vehicles-list"></datalist>
        </div>`;
      return;
    }

    if (hasMech('autoship-reminder')) {
      const profile = store.loadCustomerProfile();
      const currSize = profile.petSize || 'Médio';
      slot.classList.remove('hidden');
      slot.innerHTML = `
        <div class="container pet-reorder-strip">
          <div class="pet-reorder-card">
            <button type="button" id="pet-quick-repeat-btn" class="btn-pet-repeat">Repetir ${profile.petName ? 'de ' + profile.petName : 'último pedido'}</button>
            <div class="pet-size-pills" role="radiogroup" aria-label="Porte do Pet">
              <button type="button" role="radio" aria-checked="${currSize === 'Pequeno' ? 'true' : 'false'}" class="pet-size-chip ${currSize === 'Pequeno' ? 'active' : ''}" data-petsize="Pequeno" aria-label="Porte Pequeno">P</button>
              <button type="button" role="radio" aria-checked="${currSize === 'Médio' ? 'true' : 'false'}" class="pet-size-chip ${currSize === 'Médio' ? 'active' : ''}" data-petsize="Médio" aria-label="Porte Médio">M</button>
              <button type="button" role="radio" aria-checked="${currSize === 'Grande' ? 'true' : 'false'}" class="pet-size-chip ${currSize === 'Grande' ? 'active' : ''}" data-petsize="Grande" aria-label="Porte Grande">G</button>
            </div>
          </div>
        </div>`;
      slot.querySelector('#pet-quick-repeat-btn').addEventListener('click', () => {
        const last = store.getLastOrder();
        if (!last.items || !last.items.length) {
          const defaultItem = state.items[0];
          if (defaultItem) addItemToCart(defaultItem, 1, [], '', '', (defaultItem.packOptions || [])[2]);
          showToast('Combo padrão do Pet adicionado!');
        } else {
          cart = JSON.parse(JSON.stringify(last.items));
          renderCatalog();
          renderCart();
          showToast('Último pedido do seu Pet carregado!');
        }
        openCartDrawer();
      });
      slot.querySelectorAll('.pet-size-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          slot.querySelectorAll('.pet-size-chip').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-checked', 'false'); });
          btn.classList.add('active');
          btn.setAttribute('aria-checked', 'true');
          const prev = store.loadCustomerProfile();
          store.saveCustomerProfile({ ...prev, petSize: btn.dataset.petsize });
          renderCatalog();
          showToast(`Cálculo ajustado para Porte ${btn.dataset.petsize}`);
        });
      });
      return;
    }

    if (hasMech('variant-picker')) {
      slot.classList.remove('hidden');
      slot.innerHTML = `<div class="container context-compact-row" style="justify-content:flex-end; padding-top:4px;">
        <button type="button" id="open-size-guide-btn" class="pill-btn">Guia de Medidas (cm)</button>
      </div>`;
      slot.querySelector('#open-size-guide-btn').addEventListener('click', openSizeGuideModal);
      return;
    }

    if (hasMech('occasion-card-message')) {
      const occMod = window.VitrineMechanics['occasion-card-message'];
      const occasions = occMod ? occMod.OCCASIONS : ['Todas', 'Romântico', 'Aniversário', 'Agradecimento'];
      slot.classList.remove('hidden');
      slot.innerHTML = `<div class="context-compact-row container" role="radiogroup" aria-label="Ocasião do presente">
        ${occasions.map(o => `<button type="button" role="radio" aria-checked="${o === activeOccasion ? 'true' : 'false'}" class="pill-btn ${o === activeOccasion ? 'active' : ''}" data-occ="${o}">${o}</button>`).join('')}
      </div>`;
      slot.querySelectorAll('[data-occ]').forEach(btn => {
        btn.addEventListener('click', () => {
          activeOccasion = btn.dataset.occ;
          renderVerticalContextSlot();
          renderCatalog();
        });
      });
      return;
    }

    slot.classList.add('hidden');
    slot.innerHTML = '';
  }

  function renderDynamicDomainFields() {
    const dm = state.domainMode || 'food-delivery';
    const modules = state.modules || {};
    const box = document.getElementById('dynamic-domain-fields');
    const isBookingOrQuote = dm === 'service-quote' || dm === 'service-booking' || hasMech('slot-picker');
    document.getElementById('delivery-mode-wrap').classList.toggle('hidden', isBookingOrQuote || !modules.freteKm);
    if (!modules.freteKm || isBookingOrQuote) {
      document.getElementById('address-wrap').classList.add('hidden');
    }

    if (hasMech('slot-picker')) {
      const spMod = window.VitrineMechanics['slot-picker'];
      const days = spMod ? spMod.getUpcomingDays(4) : [{ iso: selectedBookingDayIso, label: 'Hoje' }];
      const profs = ['Qualquer profissional', ...new Set((state.items || []).flatMap(i => String(i.barber || '').split('/').map(s => s.trim())).filter(Boolean))];
      box.classList.remove('hidden');
      box.innerHTML = `
        <div class="domain-grid-2">
          <label class="field-label">Dia da Reserva
            <select id="sched-date" class="select-input">
              ${days.map(d => `<option value="${d.iso}" ${d.iso === selectedBookingDayIso ? 'selected' : ''}>${d.label} (${d.iso.slice(5).split('-').reverse().join('/')})</option>`).join('')}
            </select>
          </label>
          <label class="field-label">Profissional
            <select id="sched-window" class="select-input">
              ${profs.map(p => `<option value="${p}">${p}</option>`).join('')}
            </select>
          </label>
        </div>
        <button type="button" id="download-booking-ics-btn" class="btn btn-secondary btn-sm full-width">Salvar Lembrete na Agenda (.ics)</button>`;
      box.querySelector('#sched-date').addEventListener('change', (e) => { selectedBookingDayIso = e.target.value; });
      box.querySelector('#download-booking-ics-btn').addEventListener('click', () => {
        if (!spMod || !cart.length) { showToast('Selecione um serviço antes.'); return; }
        const first = cart[0];
        const slot = String(first.selectedVariant || '').replace('Horário ', '') || '10:00';
        const ics = spMod.buildBookingIcsEvent({
          storeName: state.storeName,
          serviceName: first.name,
          professional: document.getElementById('sched-window').value,
          dateIso: document.getElementById('sched-date').value,
          timeSlot: slot,
        });
        downloadIcsFile(ics, `agendamento-${state.id || 'barbearia'}.ics`);
        showToast('Arquivo .ics gerado offline!');
      });
      return;
    }

    if (hasMech('occasion-card-message')) {
      const occMod = window.VitrineMechanics['occasion-card-message'];
      const pkMod = window.VitrineMechanics['pickup-window'];
      const tmr = pkMod ? pkMod.getTomorrowIso() : new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const wins = pkMod ? pkMod.resolveAvailableWindows(state.scheduleWindows) : ['08:30 - 11:30', '13:30 - 16:30'];
      const templates = occMod ? occMod.CARD_TEMPLATES : [];
      box.classList.remove('hidden');
      box.innerHTML = `
        <div class="domain-grid-2">
          <label class="field-label">Data Entrega<input type="date" id="sched-date" class="text-input mono" value="${tmr}" /></label>
          <label class="field-label">Período<select id="sched-window" class="select-input">${wins.map(w => `<option value="${w}">${w}</option>`).join('')}</select></label>
        </div>
        <div class="field-label">
          <label for="cake-message" class="field-label-text">Cartão Dedicatória</label>
          <div class="quick-tags">${templates.map(t => `<button type="button" class="quick-tag-btn card-tpl-btn" data-txt="${t.text}">+ ${t.occasion}</button>`).join('')}</div>
          <input type="text" id="cake-message" maxlength="160" class="text-input" placeholder="Escreva sua mensagem..." />
          <div class="char-counter-row"><span>Opcional</span><span id="card-char-count" class="mono" aria-live="polite">0/160</span></div>
        </div>
        <button type="button" id="surprise-gift-switch" role="switch" aria-checked="${surpriseGiftFlag ? 'true' : 'false'}" class="deposit-switch-btn surprise-switch-btn ${surpriseGiftFlag ? 'active' : ''}">
          <span>Presente surpresa (não revelar meu nome)</span>
          <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
        </button>`;
      const msgEl = box.querySelector('#cake-message');
      const cntEl = box.querySelector('#card-char-count');
      msgEl.addEventListener('input', () => { cntEl.textContent = `${msgEl.value.length}/160`; });
      box.querySelectorAll('.card-tpl-btn').forEach(b => b.addEventListener('click', () => {
        msgEl.value = b.dataset.txt;
        cntEl.textContent = `${msgEl.value.length}/160`;
      }));
      const surBtn = box.querySelector('#surprise-gift-switch');
      surBtn.addEventListener('click', () => {
        surpriseGiftFlag = !surpriseGiftFlag;
        surBtn.classList.toggle('active', surpriseGiftFlag);
        surBtn.setAttribute('aria-checked', surpriseGiftFlag ? 'true' : 'false');
      });
      return;
    }

    if (hasMech('pickup-window') || dm === 'scheduled-order') {
      const pkMod = window.VitrineMechanics['pickup-window'];
      const tmr = pkMod ? pkMod.getTomorrowIso() : new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const wins = pkMod ? pkMod.resolveAvailableWindows(state.scheduleWindows) : (state.scheduleWindows || ['08:00 - 10:00', '16:00 - 18:30']);
      box.classList.remove('hidden');
      box.innerHTML = `
        <div class="domain-grid-2">
          <label class="field-label">Data Encomenda<input type="date" id="sched-date" class="text-input mono" value="${tmr}" /></label>
          <label class="field-label">Janela Horário<select id="sched-window" class="select-input">${wins.map(w => `<option value="${w}">${w}</option>`).join('')}</select></label>
        </div>
        <label class="field-label">Dizeres do Topo de Bolo / Cartão
          <input type="text" id="cake-message" class="text-input" placeholder="Ex: Parabéns Júlia!" />
        </label>`;
      return;
    }

    if (hasMech('autoship-reminder')) {
      const profile = store.loadCustomerProfile();
      box.classList.remove('hidden');
      box.innerHTML = `
        <div class="domain-grid-2">
          <label class="field-label">Nome do Pet<input type="text" id="pet-name" class="text-input" value="${profile.petName || ''}" placeholder="Ex: Thor" /></label>
          <label class="field-label">Porte
            <select id="pet-size" class="select-input">
              <option value="Pequeno" ${profile.petSize === 'Pequeno' ? 'selected' : ''}>Pequeno</option>
              <option value="Médio" ${profile.petSize === 'Médio' ? 'selected' : ''}>Médio</option>
              <option value="Grande" ${profile.petSize === 'Grande' ? 'selected' : ''}>Grande</option>
            </select>
          </label>
        </div>
        <div class="domain-grid-2">
          <label class="field-label">Lembrete recompra
            <select id="pet-remind-days" class="select-input">
              <option value="30">Em 30 dias</option>
              <option value="15">Em 15 dias</option>
              <option value="45">Em 45 dias</option>
              <option value="">Sem lembrete</option>
            </select>
          </label>
          <div class="field-label" style="justify-content:flex-end;">
            <button type="button" id="download-pet-ics-btn" class="btn btn-secondary btn-sm">Lembrete (.ics)</button>
          </div>
        </div>`;
      box.querySelector('#download-pet-ics-btn').addEventListener('click', () => {
        const autoMod = window.VitrineMechanics['autoship-reminder'];
        const days = Number(document.getElementById('pet-remind-days').value || 30);
        if (autoMod) {
          downloadIcsFile(autoMod.buildPetReminderIcs(state.storeName, document.getElementById('pet-name').value, days), 'recompra-pet.ics');
          showToast('Lembrete .ics gerado offline!');
        }
      });
      return;
    }

    if (hasMech('inspection-checklist')) {
      const qModelEl = document.getElementById('quick-veh-model');
      const qPlateEl = document.getElementById('quick-veh-plate');
      const qModel = qModelEl ? qModelEl.value : '';
      const qPlate = qPlateEl ? qPlateEl.value : '';
      const sympBtns = (state.symptoms || ['Barulho ao frear', 'Revisão preventiva'])
        .map(s => `<button type="button" class="quick-tag-btn symp-btn" data-symp="${s}">${s}</button>`).join('');
      box.classList.remove('hidden');
      box.innerHTML = `
        <div class="domain-grid-2">
          <label class="field-label">Veículo / Modelo *<input type="text" id="veh-model" list="fipe-vehicles-list" class="text-input" value="${qModel}" placeholder="Ex: Onix 1.0" /></label>
          <label class="field-label">Placa / KM<input type="text" id="veh-plate" class="text-input mono" value="${qPlate}" placeholder="ABC-1D23" /></label>
        </div>
        <div class="field-label">
          <label for="veh-symptom" class="field-label-text">Sintoma Relatado</label>
          <div class="quick-tags">${sympBtns}</div>
          <input type="text" id="veh-symptom" class="text-input" placeholder="Descreva o barulho ou revisão" />
        </div>`;
      box.querySelectorAll('.symp-btn').forEach(btn => {
        btn.addEventListener('click', () => { document.getElementById('veh-symptom').value = btn.dataset.symp; });
      });
      return;
    }

    box.classList.add('hidden');
    box.innerHTML = '';
  }

  function applyTheme() {
    const root = document.documentElement;
    const archetype = state.brandArchetype || 'high-energy-food';
    const layoutMode = state.layout?.catalog || state.layoutMode || 'food-list';
    root.setAttribute('data-archetype', archetype);
    document.body.setAttribute('data-layout', layoutMode);

    const brandInput = {
      color: { seed: state.color?.seed || state.primaryColor || '#B42318' },
      type: state.type || { stack: 'geometric' },
      shape: state.shape || { radius: 'soft', density: 'regular' },
    };
    const tokens = generateBrandTokens(brandInput);
    const isDark = root.getAttribute('data-theme') === 'dark';

    root.style.setProperty('--brand-primary', tokens.semantics.primary);
    root.style.setProperty('--brand-on-primary', tokens.semantics.onPrimary);
    if (!isDark) {
      root.style.setProperty('--brand-ink-accent', tokens.semantics.inkAccent);
      root.style.setProperty('--brand-surface-tint', tokens.semantics.surfaceTint);
      root.style.setProperty('--brand-border-tint', tokens.semantics.borderTint);
    }
    root.style.setProperty('--font-heading', tokens.vertical.fontHeading);
    root.style.setProperty('--font-body', tokens.vertical.fontBody);
    root.style.setProperty('--radius-sm', `${Math.max(4, Math.min(10, tokens.vertical.radii.sm))}px`);
    root.style.setProperty('--radius-md', `${tokens.vertical.radii.md}px`);
    root.style.setProperty('--radius-lg', `${tokens.vertical.radii.lg}px`);

    const wcagBadge = document.getElementById('wcag-badge');
    if (wcagBadge) {
      wcagBadge.textContent = `${tokens.semantics.wcagAA ? 'WCAG AA' : 'Contraste'} ${tokens.semantics.contrastWithSurface}:1`;
    }

    const name = state.identity?.name || state.storeName || 'VitrineZap';
    const initials = state.identity?.logo?.initials || state.logoInitials || name.slice(0, 2);
    document.getElementById('brand-mark-icon').textContent = initials.toUpperCase();
    document.getElementById('topbar-store-name').textContent = name;

    const geo = state.geo || {};
    const cityLabel = [geo.neighborhood, geo.city].filter(Boolean).join(' • ') || state.neighborhood || 'Atendimento Local';
    document.getElementById('topbar-city-badge').textContent = geo.city ? `${geo.city}${geo.state ? '-' + geo.state : ''}` : 'Local';
    document.getElementById('footer-store-info').textContent = `${name} • ${cityLabel}`;

    const hoursStr = `${state.openHour || '08:00'} - ${state.closeHour || '22:00'}`;
    const openEval = evaluateStoreOpenStatus(hoursStr);
    const statusPill = document.getElementById('store-status-pill');
    statusPill.classList.toggle('closed', !openEval.isOpen);
    document.getElementById('store-status-text').textContent = openEval.statusLabel;

    const modules = state.modules || {};
    const freeTxt = Number(state.freeDeliveryThreshold || 0) > 0 ? ` (Grátis > ${formatBrl(state.freeDeliveryThreshold)})` : '';
    const delivTxt = modules.osTecnica
      ? `Orçamento válido ${state.quoteValidityDays || 7} dias`
      : (modules.agendamento && !modules.freteKm
        ? 'Agendamento direto pelo WhatsApp'
        : (Number(state.deliveryFee || 0) > 0 ? `Entrega ${formatBrl(state.deliveryFee)}${freeTxt}` : 'Retirada no local'));
    document.getElementById('store-meta-text').textContent = `${state.rating || '4.9'} • ${state.etaLabel || 'Hoje'} • ${delivTxt}`;

    const promo = (state.coupons || [])[0];
    const heroCouponBtn = document.getElementById('hero-coupon-pill');
    if (promo) {
      const label = promo.type === 'percent' ? `${promo.value}% OFF` : `${formatBrl(promo.value)} OFF`;
      heroCouponBtn.textContent = `${promo.code} (${label})`;
      heroCouponBtn.dataset.code = promo.code;
      heroCouponBtn.classList.remove('hidden');
    } else {
      heroCouponBtn.classList.add('hidden');
    }

    renderVerticalContextSlot();

    const vocab = state.vocab || {};
    document.getElementById('cart-title').textContent = vocab.cartTitle || state.vocabulary?.cart || 'Sua Sacola';
    document.getElementById('send-wa-label').textContent = vocab.ctaBtn || state.vocabulary?.cta || 'Enviar no WhatsApp';
    document.getElementById('print-pdf-btn').textContent = vocab.pdfBtn || 'Resumo PDF';

    const tagsWrap = document.getElementById('quick-tags-wrap');
    const tags = state.quickTags || ['Nota Fiscal'];
    tagsWrap.innerHTML = tags.map(t => `<button type="button" class="quick-tag-btn" data-tag="${t}">+ ${t}</button>`).join('');
    tagsWrap.querySelectorAll('.quick-tag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('cust-notes');
        const curr = input.value.trim();
        input.value = curr ? `${curr}, ${btn.dataset.tag}` : btn.dataset.tag;
      });
    });

    renderDynamicDomainFields();
  }

  function hydrateCustomerProfile() {
    const profile = store.loadCustomerProfile();
    if (profile.name) document.getElementById('cust-name').value = profile.name;
    if (profile.phone) document.getElementById('cust-phone').value = profile.phone;
    if (profile.address) document.getElementById('cust-address').value = profile.address;
  }

  function persistCustomerProfile() {
    const petNameEl = document.getElementById('pet-name');
    const petSizeEl = document.getElementById('pet-size');
    const prev = store.loadCustomerProfile();
    store.saveCustomerProfile({
      name: document.getElementById('cust-name').value.trim(),
      phone: document.getElementById('cust-phone').value.trim(),
      address: document.getElementById('cust-address').value.trim(),
      petName: petNameEl ? petNameEl.value.trim() : prev.petName,
      petSize: petSizeEl ? petSizeEl.value : prev.petSize,
    });
  }

  function initSwitcher() {
    const sel = document.getElementById('niche-switcher');
    sel.innerHTML = Object.values(NICHE_PRESETS)
      .map(p => `<option value="${p.id}" ${p.id === state.id ? 'selected' : ''}>${p.label} — ${p.storeName}</option>`)
      .join('');
    sel.addEventListener('change', async (e) => {
      const preset = NICHE_PRESETS[e.target.value];
      if (!preset) return;
      state = JSON.parse(JSON.stringify(preset));
      activeMechanics = resolveActiveMechanics(state);
      cart = [];
      activeCategory = 'Todos';
      activeOccasion = 'Todas';
      activeSeverityFilter = 'todos';
      activeCouponCode = '';
      splitPeople = 1;
      payDeposit50Flag = false;
      surpriseGiftFlag = false;
      routeInfo = null;
      document.getElementById('coupon-input').value = '';
      store.saveState(state);
      await loadMechanicsOnDemand(activeMechanics);
      renderAll();
      window.scrollTo({ top: 0 });
      showToast(`Vertical carregada: ${preset.storeName}`);
    });
  }

  function renderCategories() {
    const activeItems = (state.items || []).filter(i => !i.paused);
    const cats = ['Todos', ...new Set(activeItems.map(i => i.category))];
    const wrap = document.getElementById('category-pills');
    wrap.innerHTML = cats.map(c =>
      `<button type="button" role="tab" aria-selected="${c === activeCategory ? 'true' : 'false'}" class="pill-btn ${c === activeCategory ? 'active' : ''}" data-cat="${c}">${c}</button>`
    ).join('');
    wrap.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        renderCategories();
        renderCatalog();
        const freshBtn = wrap.querySelector(`.pill-btn[data-cat="${CSS.escape(activeCategory)}"]`);
        if (freshBtn && freshBtn.scrollIntoView) {
          freshBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
    });
  }

  function renderItemStepperOrBtn(item, customLabel, isMini = false) {
    const qtyInCart = cart.filter(c => c.id === item.id).reduce((s, c) => s + c.qty, 0);
    if (qtyInCart > 0 && !hasMech('slot-picker')) {
      return `<div class="qty-inline">
        <button type="button" class="card-dec-btn" data-id="${item.id}" aria-label="Remover 1 ${item.name}">-</button>
        <span>${qtyInCart}</span>
        <button type="button" class="card-inc-btn" data-id="${item.id}" aria-label="Adicionar 1 ${item.name}">+</button>
      </div>`;
    }
    if (isMini) return `<button type="button" class="mini-add-btn add-btn" data-id="${item.id}" aria-label="Adicionar ${item.name}">+</button>`;
    return `<button type="button" class="btn btn-primary btn-sm add-btn" data-id="${item.id}">${customLabel}</button>`;
  }

  function renderCatalog() {
    const q = (document.getElementById('search-input').value || '').toLowerCase();
    let list = (state.items || []).filter(item => {
      if (item.paused) return false;
      const matchCat = activeCategory === 'Todos' || item.category === activeCategory;
      const matchText = !q || item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q) || (item.sku || '').toLowerCase().includes(q);
      if (hasMech('occasion-card-message') && activeOccasion !== 'Todas') {
        const occHay = `${item.name} ${item.description} ${item.category} ${item.yieldLabel || ''}`.toLowerCase();
        if (activeOccasion === 'Romântico' && !/rosa|orqu[ií]dea|buqu[eê]/i.test(occHay)) return matchCat && matchText;
      }
      return matchCat && matchText;
    });

    if (sortMode === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sortMode === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    if (sortMode === 'az') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    const grid = document.getElementById('catalog-grid');
    if (!list.length) {
      grid.innerHTML = '<div class="cart-empty">Nenhum item encontrado.</div>';
      return;
    }

    const layoutMode = state.layout?.catalog || state.layoutMode || 'list-thumb';
    const emblem = NICHE_EMBLEMS[state.vertical || state.id] || NICHE_EMBLEMS.lanchonete;
    const petMod = window.VitrineMechanics['autoship-reminder'];
    const inspMod = window.VitrineMechanics['inspection-checklist'];
    const petProfile = store.loadCustomerProfile();

    grid.innerHTML = list.map(item => {
      const visualContent = item.photoDataUrl ? `<img src="${item.photoDataUrl}" alt="${item.name}" />` : emblem;

      if (layoutMode === 'agenda-slots') {
        const slots = Array.isArray(item.slots) && item.slots.length ? item.slots : (state.scheduleWindows || ['09:30', '14:00']);
        const currSlot = selectedSlotMap[item.id] || slots[0];
        selectedSlotMap[item.id] = currSlot;
        return `<article class="agenda-card" data-open-id="${item.id}">
          <div class="agenda-card-head">
            <div>
              <h3>${item.name}</h3>
              <p class="food-desc">${item.description || ''}</p>
            </div>
            <div class="agenda-meta-col">
              <span class="agenda-duration mono">${item.prepTime || '40 min'}</span>
              ${item.barber ? `<div class="cart-row-sub" style="margin-top:4px;">${item.barber}</div>` : ''}
            </div>
          </div>
          <div class="agenda-slots-row" role="radiogroup" aria-label="Horários para ${item.name}">
            ${slots.map(sl => `<button type="button" role="radio" aria-checked="${sl === currSlot ? 'true' : 'false'}" class="slot-chip ${sl === currSlot ? 'active' : ''}" data-item="${item.id}" data-slot="${sl}">${sl}</button>`).join('')}
          </div>
          <div class="agenda-card-foot">
            <strong class="food-price mono">${formatBrl(item.price)}</strong>
            ${renderItemStepperOrBtn(item, `Agendar ${currSlot}`, false)}
          </div>
        </article>`;
      }

      if (layoutMode === 'variant-grid') {
        const sizes = Array.isArray(item.sizes) && item.sizes.length ? item.sizes : ['P', 'M', 'G'];
        const currSize = selectedSizeMap[item.id] || sizes[0];
        selectedSizeMap[item.id] = currSize;
        return `<article class="fashion-card" data-open-id="${item.id}">
          <div class="fashion-visual">${visualContent}</div>
          <div class="fashion-body">
            ${item.colorTag ? `<span class="fashion-color-tag">${item.colorTag}</span>` : ''}
            <h3>${item.name}</h3>
            <div class="size-chips-row" role="radiogroup" aria-label="Tamanhos de ${item.name}">
              ${sizes.map(sz => `<button type="button" role="radio" aria-checked="${sz === currSize ? 'true' : 'false'}" class="size-chip ${sz === currSize ? 'active' : ''}" data-item="${item.id}" data-size="${sz}">${sz}</button>`).join('')}
            </div>
            <strong class="bakery-price mono">${formatBrl(item.price)}</strong>
            <button type="button" class="bakery-cta add-btn" data-id="${item.id}">Adicionar (${currSize})</button>
          </div>
        </article>`;
      }

      if (layoutMode === 'bakery-editorial' || layoutMode === 'editorial-grid' || layoutMode === 'botanical-editorial') {
        return `<article class="bakery-card" data-open-id="${item.id}">
          <div class="bakery-top-art">${visualContent}</div>
          <div class="bakery-body">
            ${item.yieldLabel ? `<span class="bakery-yield">${item.yieldLabel}</span>` : ''}
            <h3>${item.name}</h3>
            <span class="bakery-price mono">${formatBrl(item.price)}</span>
            <button type="button" class="bakery-cta add-btn" data-id="${item.id}">${(state.vocab && state.vocab.addBtn) || 'Encomendar'}</button>
          </div>
        </article>`;
      }

      if (layoutMode === 'pet-recurring' || layoutMode === 'pet-packs') {
        const packs = Array.isArray(item.packOptions) ? item.packOptions : [];
        const pIdx = selectedPackIdxMap[item.id] ?? item.defaultPackIdx ?? 0;
        const activePack = packs[pIdx] || null;
        const dispPrice = activePack ? activePack.price : item.price;
        let durationBadge = item.cycleLabel || '';
        if (hasMech('autoship-reminder') && petMod && activePack) {
          const kg = petMod.extractKgFromLabel(activePack.label);
          if (kg) {
            const days = petMod.calculateFoodDurationDays(kg, petProfile.petSize || 'Médio');
            durationBadge = `Dura ~${days} dias (${petProfile.petSize || 'Médio'})`;
          }
        }
        const chipsHtml = packs.length
          ? `<div class="pet-pack-chips" role="radiogroup" aria-label="Opções de ${item.name}">${packs.map((pk, idx) =>
              `<button type="button" role="radio" aria-checked="${idx === pIdx ? 'true' : 'false'}" class="pack-chip ${idx === pIdx ? 'active' : ''}" data-item="${item.id}" data-idx="${idx}">${pk.label}</button>`
            ).join('')}</div>`
          : '';
        return `<article class="pet-card" data-open-id="${item.id}">
          <div class="pet-card-head">
            <div>
              <h3>${item.name}</h3>
              <p class="food-desc">${item.description || ''}</p>
            </div>
            ${durationBadge ? `<span class="pet-cycle-badge">${durationBadge}</span>` : ''}
          </div>
          ${chipsHtml}
          <div class="pet-card-foot">
            <strong class="food-price mono">${formatBrl(dispPrice)}</strong>
            ${renderItemStepperOrBtn(item, '+ Selecionar', false)}
          </div>
        </article>`;
      }

      if (layoutMode === 'auto-blueprint' || layoutMode === 'checklist-table') {
        const sevKey = inspMod ? inspMod.getItemSeverity(item) : 'rotina';
        const sevMeta = inspMod ? inspMod.SEVERITY_MAP[sevKey] : { label: 'Rotina', badgeClass: 'sev-ok' };
        return `<article class="auto-card" data-open-id="${item.id}">
          <div class="auto-card-top">
            <div style="display:flex;gap:6px;align-items:center;">
              <span class="auto-sku">[${item.sku || 'OS-SRV'}]</span>
              ${hasMech('inspection-checklist') ? `<span class="sev-badge ${sevMeta.badgeClass}">${sevMeta.label}</span>` : ''}
            </div>
            <span class="auto-warranty">${item.warranty || 'Garantia 90 dias'}</span>
          </div>
          <h3>${item.name}</h3>
          <p class="food-desc">${item.description || ''}</p>
          <div class="auto-breakdown mono">
            <span>Peça: ${formatBrl(item.partsPrice || 0)}</span>
            <span>Mão de Obra: ${formatBrl(item.laborPrice ?? item.price)}</span>
            <span>${item.prepTime || '45 min'}</span>
          </div>
          <div class="auto-card-foot">
            <strong class="food-price mono">${formatBrl(item.price)}</strong>
            ${renderItemStepperOrBtn(item, '+ Incluir na OS', false)}
          </div>
        </article>`;
      }

      return `<article class="food-card" data-open-id="${item.id}">
        <div class="food-card-info">
          ${item.badge ? `<span class="food-badge">${item.badge}</span>` : ''}
          <h3>${item.name}</h3>
          <p class="food-desc">${item.description || ''}</p>
          <strong class="food-price mono">${formatBrl(item.price)}</strong>
        </div>
        <div class="food-thumb-wrap">
          ${visualContent}
          <div class="food-add-overlay">${renderItemStepperOrBtn(item, '+', true)}</div>
        </div>
      </article>`;
    }).join('');

    grid.querySelectorAll('[data-open-id]').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const item = (state.items || []).find(i => i.id === card.dataset.openId);
        if (item) openItemModal(item);
      });
    });

    grid.querySelectorAll('.pack-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedPackIdxMap[btn.dataset.item] = Number(btn.dataset.idx);
        renderCatalog();
      });
    });

    grid.querySelectorAll('.slot-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedSlotMap[btn.dataset.item] = btn.dataset.slot;
        renderCatalog();
      });
    });

    grid.querySelectorAll('.size-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedSizeMap[btn.dataset.item] = btn.dataset.size;
        renderCatalog();
      });
    });

    grid.querySelectorAll('.add-btn, .card-inc-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = (state.items || []).find(i => i.id === btn.dataset.id && !i.paused);
        if (!item) return;
        const packs = Array.isArray(item.packOptions) ? item.packOptions : [];
        const pIdx = selectedPackIdxMap[item.id] ?? item.defaultPackIdx ?? 0;
        const pack = packs[pIdx] || null;
        let variant = '';
        if (selectedSlotMap[item.id]) variant = `Horário ${selectedSlotMap[item.id]}`;
        else if (selectedSizeMap[item.id]) variant = `Tam. ${selectedSizeMap[item.id]}`;

        addItemToCart(item, 1, [], '', variant, pack);
        // Fluxo expresso (3-4 toques) na Barbearia via slot-picker
        if (hasMech('slot-picker')) {
          openCartDrawer(2);
        }
      });
    });

    grid.querySelectorAll('.card-dec-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const existing = cart.find(c => c.id === btn.dataset.id);
        if (existing) {
          existing.qty -= 1;
          if (existing.qty <= 0) cart = cart.filter(c => c.cartKey !== existing.cartKey);
          renderCatalog();
          renderCart();
        }
      });
    });
  }

  function getApprovedCartItems() {
    if (!hasMech('inspection-checklist')) return cart;
    return cart.filter(c => osApprovedMap[c.cartKey] !== false);
  }

  function getTotalsWithPromos() {
    const modules = state.modules || {};
    const activeItems = getApprovedCartItems();
    const rawSubtotal = activeItems.reduce((acc, item) => acc + Number(item.qty || 0) * getItemUnitPrice(item), 0);
    const dynamicBaseFee = routeInfo ? Number(routeInfo.deliveryFee) : Number(state.deliveryFee || 0);
    const freeProg = calculateFreeDeliveryProgress(rawSubtotal, state.freeDeliveryThreshold || 0, dynamicBaseFee);
    const fee = (deliveryMode === 'Entrega' && modules.freteKm) ? freeProg.effectiveDeliveryFee : 0;
    const { applied, discountAmount } = resolveCouponDiscount(rawSubtotal, activeCouponCode, state.coupons || []);
    const totals = calculateCartTotals(activeItems, fee, discountAmount);
    const payDeposit50 = Boolean((hasMech('deposit-pix') || modules.sinalPix) && payDeposit50Flag);
    const depositInfo = calculateDepositAmount(totals.total, 0.5);
    const split = calculateSplitBill(totals.total, splitPeople);
    return { totals, applied, freeProg, payDeposit50, depositInfo, split, activeItems };
  }

  function renderCart() {
    const wrap = document.getElementById('cart-items');
    const modules = state.modules || {};
    const { totals, applied, freeProg, payDeposit50, depositInfo, split } = getTotalsWithPromos();

    const topSlot = document.getElementById('cart-modules-top');
    let topHtml = '';
    if (hasMech('free-shipping-progress') && freeProg.enabled) {
      const fMod = window.VitrineMechanics['free-shipping-progress'];
      if (fMod) {
        topHtml += fMod.renderFreeBarHtml({
          enabled: freeProg.enabled,
          unlocked: freeProg.unlocked,
          remainingFormatted: formatBrl(freeProg.remaining),
          percent: freeProg.percent,
        });
      }
    }
    if (hasMech('deposit-pix')) {
      const dMod = window.VitrineMechanics['deposit-pix'];
      topHtml += dMod
        ? dMod.renderDepositSwitchHtml(payDeposit50Flag)
        : `<button type="button" id="pay-deposit-50" role="switch" aria-checked="${payDeposit50Flag ? 'true' : 'false'}" class="deposit-switch-btn ${payDeposit50Flag ? 'active' : ''}"><span>Pagar sinal de 50% via Pix agora</span><span class="switch-track"><span class="switch-thumb"></span></span></button>`;
    }
    topSlot.innerHTML = topHtml;

    const depBtn = document.getElementById('pay-deposit-50');
    if (depBtn) {
      depBtn.addEventListener('click', () => {
        payDeposit50Flag = !payDeposit50Flag;
        renderCart();
      });
    }

    const splitSlot = document.getElementById('cart-split-slot');
    if (modules.splitBill) {
      splitSlot.innerHTML = `<div id="split-bill-box" class="split-bill-box">
        <span class="split-label">Dividir entre:</span>
        <div class="split-controls">
          <button type="button" id="split-dec-btn" class="qty-btn" aria-label="Menos pessoas">-</button>
          <strong id="split-people-val" class="mono">${split.peopleCount}</strong>
          <span class="split-unit">pessoa(s)</span>
          <button type="button" id="split-inc-btn" class="qty-btn" aria-label="Mais pessoas">+</button>
        </div>
        <strong id="split-per-person-val" class="mono split-amount">${split.perPersonFormatted}/pessoa</strong>
      </div>`;
      splitSlot.querySelector('#split-dec-btn').addEventListener('click', () => { if (splitPeople > 1) { splitPeople -= 1; renderCart(); } });
      splitSlot.querySelector('#split-inc-btn').addEventListener('click', () => { splitPeople += 1; renderCart(); });
    } else {
      splitSlot.innerHTML = '';
    }

    document.getElementById('cart-badge-count').textContent = String(totals.itemCount);
    document.getElementById('subtotal-val').textContent = formatBrl(totals.subtotal);
    document.getElementById('delivery-val').textContent = freeProg.unlocked && deliveryMode === 'Entrega' ? 'GRÁTIS' : formatBrl(totals.deliveryFee);
    document.getElementById('total-val').textContent = formatBrl(totals.total);
    document.getElementById('delivery-row').classList.toggle('hidden', !modules.freteKm || (deliveryMode !== 'Entrega' && totals.deliveryFee === 0));

    document.getElementById('deposit-summary-row').classList.toggle('hidden', !payDeposit50 || totals.total <= 0);
    document.getElementById('deposit-val').textContent = formatBrl(depositInfo.deposit);

    const discRow = document.getElementById('discount-row');
    if (totals.discount > 0 && applied) {
      discRow.classList.remove('hidden');
      document.getElementById('discount-code-label').textContent = `(${applied.code})`;
      document.getElementById('discount-val').textContent = `-${formatBrl(totals.discount)}`;
    } else {
      discRow.classList.add('hidden');
      document.getElementById('discount-code-label').textContent = '';
    }

    document.getElementById('clear-cart-btn').classList.toggle('hidden', cart.length === 0);

    const barCta = (state.vocab && state.vocab.barCta) || `Ver ${state.vocabulary?.cart || 'Sacola'}`;
    document.getElementById('mobile-bar-badge').textContent = String(totals.itemCount);
    document.getElementById('mobile-cart-label').textContent = barCta;
    document.getElementById('mobile-cart-total').textContent = formatBrl(totals.total);

    if (!cart.length) {
      wrap.innerHTML = '<div class="cart-empty">Seu carrinho está vazio. Toque em um item para começar.</div>';
      document.getElementById('pix-box').classList.add('hidden');
      return;
    }

    const isOsApproval = hasMech('inspection-checklist');
    wrap.innerHTML = cart.map(c => {
      const packHtml = c.selectedPack ? `<div class="cart-row-sub">Opção: ${c.selectedPack}</div>` : '';
      const varHtml = c.selectedVariant ? `<div class="cart-row-sub">${c.selectedVariant}</div>` : '';
      const extrasNames = Array.isArray(c.selectedExtras) && c.selectedExtras.length
        ? `<div class="cart-row-sub">+ ${c.selectedExtras.map(e => e.name).join(', ')}</div>` : '';
      const osApproved = osApprovedMap[c.cartKey] !== false;
      const rightControl = isOsApproval
        ? `<button type="button" class="os-approve-btn" role="switch" aria-checked="${osApproved ? 'true' : 'false'}" data-key="${c.cartKey}">${osApproved ? 'Aprovado' : 'Adiado'}</button>`
        : `<div class="qty-controls">
            <button type="button" class="qty-btn dec" data-key="${c.cartKey}" aria-label="Diminuir ${c.name}">-</button>
            <strong class="mono">${c.qty}</strong>
            <button type="button" class="qty-btn inc" data-key="${c.cartKey}" aria-label="Aumentar ${c.name}">+</button>
          </div>`;
      return `
        <div class="cart-row">
          <div>
            <div class="cart-row-name">${c.name}</div>
            ${packHtml}${varHtml}${extrasNames}
            <div class="cart-row-sub mono">${formatBrl(getItemUnitPrice(c))} un.</div>
          </div>
          ${rightControl}
        </div>`;
    }).join('');

    wrap.querySelectorAll('.os-approve-btn').forEach(b => b.addEventListener('click', () => {
      const curr = osApprovedMap[b.dataset.key] !== false;
      osApprovedMap[b.dataset.key] = !curr;
      renderCart();
    }));

    wrap.querySelectorAll('.inc').forEach(b => b.addEventListener('click', () => {
      const found = cart.find(c => c.cartKey === b.dataset.key);
      if (found) { found.qty += 1; renderCatalog(); renderCart(); }
    }));
    wrap.querySelectorAll('.dec').forEach(b => b.addEventListener('click', () => {
      const found = cart.find(c => c.cartKey === b.dataset.key);
      if (found) {
        found.qty -= 1;
        if (found.qty <= 0) cart = cart.filter(c => c.cartKey !== b.dataset.key);
        renderCatalog(); renderCart();
      }
    }));
  }

  function getCheckoutPayload() {
    const { totals, applied, freeProg, payDeposit50, activeItems } = getTotalsWithPromos();
    const dm = state.domainMode || 'food-delivery';
    const valOf = (id) => {
      const el = document.getElementById(id);
      return el ? String(el.value || '').trim() : '';
    };
    let cakeMessage = valOf('cake-message');
    if (hasMech('occasion-card-message')) {
      const occMod = window.VitrineMechanics['occasion-card-message'];
      cakeMessage = occMod ? occMod.formatCardSummary(cakeMessage, surpriseGiftFlag) : cakeMessage;
    }
    return {
      storeName: state.identity?.name || state.storeName,
      storeWhatsapp: state.contact?.whatsapp || state.whatsapp,
      customerName: valOf('cust-name'),
      customerPhone: valOf('cust-phone'),
      deliveryMode,
      address: valOf('cust-address'),
      paymentMethod,
      changeFor: valOf('cust-change'),
      splitPeople,
      notes: valOf('cust-notes'),
      deliveryFee: deliveryMode === 'Entrega' ? freeProg.effectiveDeliveryFee : 0,
      discount: totals.discount,
      couponCode: applied ? applied.code : '',
      items: activeItems,
      routeInfo,
      mode: state.mode,
      domainMode: dm,
      scheduleDate: valOf('sched-date'),
      scheduleWindow: valOf('sched-window'),
      cakeMessage,
      payDeposit50,
      petName: valOf('pet-name'),
      petSize: valOf('pet-size'),
      petRemindDays: valOf('pet-remind-days'),
      vehicleModel: valOf('veh-model') || valOf('quick-veh-model'),
      vehiclePlate: valOf('veh-plate') || valOf('quick-veh-plate'),
      vehicleSymptom: valOf('veh-symptom'),
    };
  }

  function validateOrder() {
    const { activeItems } = getTotalsWithPromos();
    if (!activeItems.length) { showToast('Selecione/aprove pelo menos 1 item.'); return false; }
    const custName = document.getElementById('cust-name').value.trim();
    if (!custName) { showToast('Informe seu nome.'); document.getElementById('cust-name').focus(); return false; }
    persistCustomerProfile();
    return true;
  }

  function handleSendWhatsApp() {
    if (!validateOrder()) return;
    const payload = getCheckoutPayload();
    const { url, totals } = buildWhatsAppOrderUrl(payload);
    store.saveLastCart(cart);
    store.recordOrder({ customerName: payload.customerName, channel: 'WhatsApp', paymentMethod: payload.paymentMethod, itemCount: totals.itemCount, total: totals.total });
    renderStudioPanel();
    window.open(url, '_blank', 'noopener');
    showToast('Aberto no WhatsApp!');
  }

  function handleGeneratePix() {
    const { totals, payDeposit50, depositInfo, activeItems } = getTotalsWithPromos();
    if (!activeItems.length) { showToast('Adicione itens à sacola.'); return; }
    const pixKey = state.pixKey || state.contact?.pixKey;
    if (!pixKey) { showToast('Configure a Chave Pix no Estúdio.'); return; }
    const pixValue = payDeposit50 ? depositInfo.deposit : totals.total;
    const merchantCity = state.geo?.city || 'Sorocaba';
    const merchantName = state.identity?.name || state.storeName;
    const code = generatePixBrCode({ pixKey, merchantName, merchantCity, amount: pixValue });
    document.getElementById('pix-box-title').textContent = payDeposit50 ? 'Sinal Pix 50%' : 'Pix Offline';
    document.getElementById('pix-amount-badge').textContent = formatBrl(pixValue);
    document.getElementById('pix-qr-svg').innerHTML = renderQrSvg(code, 176);
    document.getElementById('pix-code-output').value = code;
    document.getElementById('pix-box').classList.remove('hidden');
  }

  function handlePrintPdf() {
    if (!validateOrder()) return;
    const payload = getCheckoutPayload();
    const { totals, payDeposit50, depositInfo } = getTotalsWithPromos();
    store.saveLastCart(cart);
    store.recordOrder({ customerName: payload.customerName, channel: 'PDF', paymentMethod: payload.paymentMethod, itemCount: totals.itemCount, total: totals.total });
    renderStudioPanel();

    const pixKey = state.pixKey || state.contact?.pixKey;
    const merchantName = state.identity?.name || state.storeName;
    const merchantCity = state.geo?.city || 'Sorocaba';
    let pixQrHtml = '';
    if (pixKey) {
      const amt = payDeposit50 ? depositInfo.deposit : totals.total;
      pixQrHtml = `<div class="print-pix-qr"><p><strong>Pix (${formatBrl(amt)}):</strong></p>${renderQrSvg(generatePixBrCode({ pixKey, merchantName, merchantCity, amount: amt }), 140)}</div>`;
    }
    const docTitle = payload.domainMode === 'service-quote' ? 'ORÇAMENTO PRELIMINAR OS (VÁLIDO 7 DIAS)' : 'COMPROVANTE DE PEDIDO';
    document.getElementById('print-summary').innerHTML = `
      <hr />
      <h3>${merchantName} — ${docTitle}</h3>
      <p><strong>Cliente:</strong> ${payload.customerName} ${payload.customerPhone ? `(${payload.customerPhone})` : ''}</p>
      ${payload.vehicleModel ? `<p><strong>Veículo:</strong> ${payload.vehicleModel} | ${payload.vehiclePlate}</p>` : ''}
      <p><strong>Pagamento:</strong> ${payload.paymentMethod}</p>
      <p><strong>Total:</strong> ${formatBrl(totals.total)}</p>
      ${pixQrHtml}`;
    document.body.classList.remove('printing-tent');
    window.print();
  }

  function renderStudioMechanicsComposer() {
    const wrap = document.getElementById('studio-mechanics-list');
    if (!wrap) return;
    const cat = state.vertical || state.id || 'lanchonete';
    const allowed = getAllowedMechanicsForCategory(cat);
    wrap.innerHTML = allowed.map(id => {
      const on = hasMech(id);
      return `<button type="button" class="mech-toggle-btn" data-mech="${id}" aria-pressed="${on ? 'true' : 'false'}">
        <span>${MECHANIC_LABELS[id] || id}</span>
        <strong class="mono">${on ? 'ATIVA' : 'OFF'}</strong>
      </button>`;
    }).join('');
    wrap.querySelectorAll('[data-mech]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.mech;
        const nextSet = new Set(activeMechanics);
        if (nextSet.has(id)) nextSet.delete(id);
        else nextSet.add(id);
        state.enabledMechanics = Array.from(nextSet);
        activeMechanics = resolveActiveMechanics(state);
        await loadMechanicsOnDemand(activeMechanics);
        store.saveState(state);
        renderAll();
      });
    });
  }

  function renderStudioPanel() {
    const today = new Date().toISOString().slice(0, 10);
    const summary = store.getDailySummary(today);
    document.getElementById('stat-today-count').textContent = String(summary.count);
    document.getElementById('stat-today-total').textContent = formatBrl(summary.totalRevenue);
    document.getElementById('stat-today-avg').textContent = formatBrl(summary.avgTicket);

    const city = state.geo?.city || 'Local';
    document.getElementById('studio-weather-badge').textContent = weatherInfo ? `${weatherInfo.label}` : `Clima ${city} (Open-Meteo)`;
    document.getElementById('studio-pitch-callout').textContent = state.pitchTip || '';

    document.getElementById('cfg-name').value = state.identity?.name || state.storeName || '';
    document.getElementById('cfg-neighborhood').value = state.geo?.neighborhood || state.neighborhood || '';
    document.getElementById('cfg-tagline').value = state.identity?.tagline || state.tagline || '';
    document.getElementById('cfg-layout').value = state.layout?.catalog || state.layoutMode || 'list-thumb';
    document.getElementById('cfg-typestack').value = state.type?.stack || 'geometric';
    document.getElementById('cfg-radius').value = state.shape?.radius || 'soft';
    document.getElementById('cfg-whatsapp').value = state.contact?.whatsapp || state.whatsapp || '';
    document.getElementById('cfg-pix').value = state.pixKey || state.contact?.pixKey || '';
    document.getElementById('cfg-delivery').value = Number(state.deliveryFee || 0);
    document.getElementById('cfg-free-threshold').value = Number(state.freeDeliveryThreshold || 0);
    document.getElementById('cfg-open').value = state.openHour || '08:00';
    document.getElementById('cfg-close').value = state.closeHour || '22:00';
    document.getElementById('cfg-color').value = state.color?.seed || state.primaryColor || '#B42318';

    renderStudioMechanicsComposer();

    const shareUrl = encodeMagicHash(window.location.href, {
      vertical: state.vertical || state.id || 'lanchonete',
      identity: {
        name: state.identity?.name || state.storeName,
        tagline: state.identity?.tagline || state.tagline,
        logo: { initials: state.logoInitials || (state.storeName || 'VZ').slice(0, 2) },
      },
      color: { seed: state.color?.seed || state.primaryColor || '#B42318' },
      type: { stack: state.type?.stack || 'geometric' },
      shape: { radius: state.shape?.radius || 'soft' },
      layout: { catalog: state.layout?.catalog || state.layoutMode || 'list-thumb' },
      geo: state.geo || { city: 'Sorocaba', state: 'SP', neighborhood: state.neighborhood },
      contact: { whatsapp: state.whatsapp },
    });

    document.getElementById('store-counter-qr').innerHTML = renderQrSvg(shareUrl, 132);
    document.getElementById('tent-store-name').textContent = state.identity?.name || state.storeName;
    document.getElementById('tent-qr-wrap').innerHTML = renderQrSvg(shareUrl, 210);
    document.getElementById('tent-store-phone').textContent = `WhatsApp: ${state.whatsapp || ''}`;

    const listEl = document.getElementById('admin-items-list');
    listEl.innerHTML = (state.items || []).map(item => `
      <div class="admin-item-row">
        <div><strong>${item.name}</strong> <span class="cart-row-sub">(${item.category}${item.paused ? ' • Pausado' : ''})</span></div>
        <div class="inline-actions">
          <input type="number" step="0.01" min="0" class="inline-price-input mono" data-id="${item.id}" value="${Number(item.price).toFixed(2)}" aria-label="Preço de ${item.name}" />
          <button type="button" class="btn btn-secondary btn-sm toggle-pause-btn" data-id="${item.id}">${item.paused ? 'Ativar' : 'Pausar'}</button>
          <button type="button" class="btn btn-secondary btn-sm remove-item-btn" data-id="${item.id}">Remover</button>
        </div>
      </div>`).join('');

    listEl.querySelectorAll('.inline-price-input').forEach(inp => {
      inp.addEventListener('change', () => {
        state.items = (state.items || []).map(i => i.id === inp.dataset.id ? { ...i, price: Math.max(0, Number(inp.value || 0)) } : i);
        store.saveState(state);
        renderCatalog();
        showToast('Preço atualizado.');
      });
    });
    listEl.querySelectorAll('.toggle-pause-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.items = (state.items || []).map(i => i.id === btn.dataset.id ? { ...i, paused: !i.paused } : i);
        store.saveState(state);
        renderAll();
      });
    });
    listEl.querySelectorAll('.remove-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.items = (state.items || []).filter(i => i.id !== btn.dataset.id);
        store.saveState(state);
        renderAll();
      });
    });

    const histEl = document.getElementById('order-history-list');
    const history = store.loadHistory();
    histEl.innerHTML = history.length
      ? history.slice(0, 20).map(o => `
        <div class="admin-item-row">
          <div><strong>${o.customerName}</strong> <span class="cart-row-sub">(${o.channel} • ${o.paymentMethod || 'Pix'})</span></div>
          <strong class="mono">${formatBrl(o.total)}</strong>
        </div>`).join('')
      : '<div class="cart-empty">Nenhum pedido registrado ainda.</div>';
  }

  function renderAll() {
    activeMechanics = resolveActiveMechanics(state);
    applyTheme();
    renderCategories();
    renderCatalog();
    renderCart();
    renderStudioPanel();
  }

  function applyCouponCode(code) {
    const clean = String(code || '').trim().toUpperCase();
    if (!clean) { activeCouponCode = ''; renderCart(); return; }
    const rawSubtotal = cart.reduce((acc, i) => acc + Number(i.qty || 0) * getItemUnitPrice(i), 0);
    const { applied } = resolveCouponDiscount(rawSubtotal || 100, clean, state.coupons || []);
    if (!applied) { showToast('Cupom não encontrado.'); return; }
    activeCouponCode = applied.code;
    document.getElementById('coupon-input').value = applied.code;
    renderCart();
    showToast(`Cupom ${applied.code} aplicado!`);
  }

  function setupVoiceDictation() {
    const btn = document.getElementById('voice-dictate-btn');
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      btn.addEventListener('click', () => showToast('Ditado por voz não suportado neste navegador.'));
      return;
    }
    btn.addEventListener('click', () => {
      const rec = new SpeechRec();
      rec.lang = 'pt-BR';
      rec.interimResults = false;
      btn.classList.add('listening');
      rec.onresult = (evt) => {
        const transcript = evt.results[0][0].transcript;
        const target = document.getElementById('veh-symptom') || document.getElementById('cust-notes');
        target.value = target.value ? `${target.value}, ${transcript}` : transcript;
        showToast('Ditado capturado!');
      };
      rec.onend = () => btn.classList.remove('listening');
      rec.onerror = () => { btn.classList.remove('listening'); showToast('Não foi possível ouvir o áudio.'); };
      rec.start();
    });
  }

  function bindVisualViewportFix() {
    if (!window.visualViewport) return;
    window.visualViewport.addEventListener('resize', () => {
      const kb = Math.max(0, window.innerHeight - window.visualViewport.height);
      const aside = document.getElementById('cart-aside');
      if (aside.classList.contains('drawer-open')) aside.style.paddingBottom = `${22 + kb}px`;
    });
  }

  async function resolveGeoDelivery(customerCoords) {
    if (!customerCoords) return;
    const geo = state.geo || {};
    const storeCoords = (Number.isFinite(Number(geo.lat)) && Number.isFinite(Number(geo.lon)))
      ? { lat: Number(geo.lat), lng: Number(geo.lon) }
      : (SOROCABA_STORES_COORDS[state.id] || SOROCABA_STORES_COORDS.lanchonete);

    routeInfo = await calculateRouteAndDeliveryFee(storeCoords, customerCoords, {
      baseFee: Math.max(4, Number(state.deliveryFee || 4)),
      feeTable: geo.feeTable,
    });
    const card = document.getElementById('route-preview-card');
    card.classList.remove('hidden');
    document.getElementById('route-distance-label').textContent = `${routeInfo.distanceKm} km • ~${routeInfo.durationMinutes} min`;
    document.getElementById('route-fee-source').textContent = `Frete calculado: ${formatBrl(routeInfo.deliveryFee)} (${routeInfo.source})`;
    document.getElementById('route-svg-path').setAttribute('d', routeInfo.polylineSvgPath);
    document.getElementById('route-gmaps-link').href = routeInfo.googleMapsUrl;
    document.getElementById('route-waze-link').href = routeInfo.wazeUrl;
    renderCart();
  }

  async function initOpenApisBackground() {
    weatherInfo = await fetchSorocabaWeather(undefined, state.geo || {});
    const dl = document.getElementById('fipe-vehicles-list');
    if (dl) {
      const vehicles = await searchFipeVehicles('');
      dl.innerHTML = vehicles.map(v => `<option value="${v}"></option>`).join('');
    }
  }

  function bindEvents() {
    bindVisualViewportFix();
    setupVoiceDictation();
    initOpenApisBackground();

    window.addEventListener('popstate', () => {
      closeSizeGuideModal();
      closeItemModal();
      closeStudioModal();
      closeCartDrawer();
    });

    window.addEventListener('hashchange', async () => {
      if (window.location.hash && window.location.hash.includes('brand=')) {
        state = loadInitialState();
        activeMechanics = resolveActiveMechanics(state);
        await loadMechanicsOnDemand(activeMechanics);
        cart = [];
        activeCategory = 'Todos';
        renderAll();
      }
    });

    document.getElementById('lookup-cep-btn').addEventListener('click', async () => {
      try {
        const res = await lookupBrazilianCep(document.getElementById('cust-cep').value, undefined, state.geo || {});
        const addrEl = document.getElementById('cust-address');
        addrEl.value = `${res.street}${res.neighborhood ? ', ' + res.neighborhood : ''} — ${res.city}/${res.state}`;
        if (res.coords) {
          await resolveGeoDelivery(res.coords);
          showToast(`CEP encontrado (${res.source}): rota ${routeInfo.distanceKm} km`);
        } else {
          showToast(`Endereço preenchido (${res.source}).`);
        }
      } catch (err) {
        showToast(err.message || 'CEP inválido.');
      }
    });

    document.getElementById('use-gps-btn').addEventListener('click', () => {
      if (!navigator.geolocation) {
        showToast('GPS indisponível neste dispositivo.');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          document.getElementById('cust-address').value = `GPS (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`;
          await resolveGeoDelivery(coords);
          showToast(`Rota GPS calculada: ${routeInfo.distanceKm} km`);
        },
        () => showToast('Permita acesso à localização ou informe o CEP.')
      );
    });

    document.getElementById('search-input').addEventListener('input', renderCatalog);
    document.getElementById('sort-select').addEventListener('change', (e) => { sortMode = e.target.value; renderCatalog(); });
    document.getElementById('hero-coupon-pill').addEventListener('click', (e) => applyCouponCode(e.currentTarget.dataset.code));

    document.getElementById('open-studio-btn').addEventListener('click', openStudioModal);
    document.getElementById('close-studio-btn').addEventListener('click', closeStudioModal);
    document.getElementById('studio-backdrop').addEventListener('click', closeStudioModal);

    document.getElementById('close-size-guide-btn').addEventListener('click', closeSizeGuideModal);
    document.getElementById('size-guide-backdrop').addEventListener('click', closeSizeGuideModal);

    document.getElementById('theme-toggle-btn').addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      window.localStorage.setItem('vitrine_theme', next);
      applyTheme();
    });

    document.getElementById('wizard-next-btn').addEventListener('click', () => {
      const { activeItems } = getTotalsWithPromos();
      if (!activeItems.length) { showToast('Adicione pelo menos 1 item antes de continuar.'); return; }
      renderDynamicDomainFields();
      setWizardStep(2);
    });
    document.getElementById('wizard-back-btn').addEventListener('click', () => setWizardStep(1));

    document.getElementById('apply-coupon-btn').addEventListener('click', () => applyCouponCode(document.getElementById('coupon-input').value));
    document.getElementById('clear-cart-btn').addEventListener('click', () => { cart = []; renderCatalog(); renderCart(); });

    document.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        deliveryMode = btn.dataset.delivery;
        document.getElementById('address-wrap').classList.toggle('hidden', deliveryMode !== 'Entrega' || !state.modules?.freteKm);
        renderCart();
      });
    });

    document.querySelectorAll('.pay-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pay-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        paymentMethod = btn.dataset.pay;
        document.getElementById('change-wrap').classList.toggle('hidden', paymentMethod !== 'Dinheiro');
      });
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        document.querySelector(`.tab-pane[data-pane="${btn.dataset.tab}"]`).classList.add('active');
      });
    });

    document.getElementById('mobile-cart-bar').addEventListener('click', () => {
      openCartDrawer(hasMech('slot-picker') && cart.length > 0 ? 2 : 1);
    });
    document.getElementById('close-cart-drawer-btn').addEventListener('click', closeCartDrawer);
    document.getElementById('cart-backdrop').addEventListener('click', closeCartDrawer);

    document.getElementById('close-item-modal-btn').addEventListener('click', closeItemModal);
    document.getElementById('item-modal-backdrop').addEventListener('click', closeItemModal);
    document.getElementById('modal-dec-btn').addEventListener('click', () => { if (modalState.qty > 1) { modalState.qty -= 1; updateModalCta(); } });
    document.getElementById('modal-inc-btn').addEventListener('click', () => { modalState.qty += 1; updateModalCta(); });
    document.getElementById('modal-add-btn').addEventListener('click', () => {
      if (!modalState.item) return;
      addItemToCart(modalState.item, modalState.qty, modalState.selectedExtras, document.getElementById('modal-item-note').value, modalState.selectedVariant, modalState.packOverride);
      closeItemModal();
      if (hasMech('slot-picker')) openCartDrawer(2);
      else showToast(`${modalState.item.name} adicionado!`);
    });

    document.getElementById('send-wa-btn').addEventListener('click', handleSendWhatsApp);
    document.getElementById('gen-pix-btn').addEventListener('click', handleGeneratePix);
    document.getElementById('print-pdf-btn').addEventListener('click', handlePrintPdf);

    document.getElementById('copy-pix-btn').addEventListener('click', async () => {
      if (navigator.clipboard) await navigator.clipboard.writeText(document.getElementById('pix-code-output').value);
      showToast('Código Pix copiado.');
    });

    document.getElementById('copy-store-link-btn').addEventListener('click', async () => {
      const url = encodeMagicHash(window.location.href, {
        vertical: state.vertical || state.id || 'lanchonete',
        identity: state.identity || { name: state.storeName, tagline: state.tagline, logo: { initials: state.logoInitials } },
        color: state.color || { seed: state.primaryColor },
        type: state.type || { stack: 'geometric' },
        shape: state.shape || { radius: 'soft' },
        layout: state.layout || { catalog: state.layoutMode || 'list-thumb' },
        geo: state.geo,
        contact: { whatsapp: state.whatsapp },
      });
      if (navigator.clipboard) await navigator.clipboard.writeText(url);
      showToast('Magic Link seguro (#brand=...) copiado!');
    });

    document.getElementById('print-table-tent-btn').addEventListener('click', () => {
      document.body.classList.add('printing-tent');
      window.print();
      setTimeout(() => document.body.classList.remove('printing-tent'), 500);
    });

    document.getElementById('item-photo-input').addEventListener('change', async (e) => {
      pendingPhotoDataUrl = await compressImageToWebp(e.target.files[0]);
      if (pendingPhotoDataUrl) showToast('Foto otimizada (WebP 320x320) pronta para salvar.');
    });

    document.getElementById('store-config-form').addEventListener('submit', (e) => {
      e.preventDefault();
      state.storeName = document.getElementById('cfg-name').value.trim();
      state.neighborhood = document.getElementById('cfg-neighborhood').value.trim();
      state.tagline = document.getElementById('cfg-tagline').value.trim();
      state.layoutMode = document.getElementById('cfg-layout').value;
      state.whatsapp = document.getElementById('cfg-whatsapp').value.trim();
      state.pixKey = document.getElementById('cfg-pix').value.trim();
      state.deliveryFee = Number(document.getElementById('cfg-delivery').value || 0);
      state.freeDeliveryThreshold = Number(document.getElementById('cfg-free-threshold').value || 0);
      state.openHour = document.getElementById('cfg-open').value || '08:00';
      state.closeHour = document.getElementById('cfg-close').value || '22:00';
      state.primaryColor = document.getElementById('cfg-color').value;

      state.identity = {
        ...(state.identity || {}),
        name: state.storeName,
        tagline: state.tagline,
        logo: { ...(state.identity?.logo || {}), initials: state.storeName.slice(0, 2).toUpperCase() },
      };
      state.color = { ...(state.color || {}), seed: state.primaryColor };
      state.type = { ...(state.type || {}), stack: document.getElementById('cfg-typestack').value };
      state.shape = { ...(state.shape || {}), radius: document.getElementById('cfg-radius').value };
      state.layout = { ...(state.layout || {}), catalog: state.layoutMode };
      state.geo = { ...(state.geo || {}), neighborhood: state.neighborhood };

      store.saveState(state);
      renderAll();
      showToast('Identidade da marca salva!');
    });

    document.getElementById('add-item-form').addEventListener('submit', (e) => {
      e.preventDefault();
      state.items = [...(state.items || []), {
        id: 'item-' + Date.now(),
        sku: 'OS-' + Date.now().toString().slice(-3),
        category: document.getElementById('item-category').value.trim(),
        name: document.getElementById('item-name').value.trim(),
        price: Number(document.getElementById('item-price').value || 0),
        prepTime: document.getElementById('item-prep').value.trim(),
        description: document.getElementById('item-desc').value.trim(),
        photoDataUrl: pendingPhotoDataUrl,
        paused: false,
      }];
      pendingPhotoDataUrl = '';
      store.saveState(state);
      e.target.reset();
      renderAll();
      showToast('Produto adicionado!');
    });

    document.getElementById('export-csv-btn').addEventListener('click', () => {
      const csv = exportOrdersCsv(store.loadHistory());
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      a.download = `pedidos-${state.id || 'vitrinezap'}.csv`;
      a.click();
    });
    document.getElementById('clear-history-btn').addEventListener('click', () => { store.clearHistory(); renderStudioPanel(); });
    document.getElementById('export-json-btn').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
      a.download = `vitrine-zap-${state.id || 'loja'}.json`;
      a.click();
    });
    document.getElementById('import-json-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          const check = validateBrandConfig(parsed);
          if (!check.valid) {
            showToast(`Config inválida: ${check.errors[0]}`);
            return;
          }
          state = mergePresetWithBrand(state, parsed);
          if (Array.isArray(parsed.items)) state.items = parsed.items;
          store.saveState(state);
          renderAll();
          showToast('Backup validado e importado!');
        } catch {
          showToast('JSON inválido.');
        }
      };
      reader.readAsText(file);
    });
  }

  async function bootstrap() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
    initTheme();
    hydrateCustomerProfile();
    await loadMechanicsOnDemand(activeMechanics);
    initSwitcher();
    bindEvents();
    renderAll();
    if (new URLSearchParams(window.location.search).get('studio') === '1') {
      openStudioModal();
    }
  }

  bootstrap();
})();
