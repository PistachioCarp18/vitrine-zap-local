(function () {
  'use strict';

  const {
    computeAccessibleBrandTokens,
    generatePixBrCode,
    resolveCouponDiscount,
    calculateFreeDeliveryProgress,
    calculateDepositAmount,
    calculateSplitBill,
    calculateCartTotals,
    formatBrl,
    evaluateStoreOpenStatus,
    buildShareableBrandUrl,
    buildWhatsAppOrderUrl,
  } = window.VitrineIntegrations;
  const { renderQrSvg } = window.VitrineQrCode;
  const { createStore, decodeStoreConfig, parseBrandUrlParams, exportOrdersCsv } = window.VitrineStore;
  const { NICHE_PRESETS } = window.VitrinePresets;

  const store = createStore(window.localStorage);
  let state = loadInitialState();
  let cart = [];
  let activeCategory = 'Todos';
  let sortMode = 'featured';
  let deliveryMode = 'Retirada';
  let paymentMethod = 'Pix';
  let activeCouponCode = '';
  let splitPeople = 1;
  let wizardStep = 1;
  let pendingPhotoDataUrl = '';
  const selectedPackIdxMap = {};
  let modalState = { item: null, qty: 1, selectedExtras: [], selectedVariant: '' };

  const NICHE_EMBLEMS = {
    lanchonete: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11h18"/><path d="M5 11a7 7 0 0 1 14 0"/><path d="M4 15h16a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a1 1 0 0 1 1-1z"/></svg>',
    padaria: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>',
    petshop: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>',
    oficina: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  };

  function loadInitialState() {
    const search = window.location.search;
    const brandOverrides = parseBrandUrlParams(search);
    if (brandOverrides) {
      const basePreset = NICHE_PRESETS[brandOverrides.id] || NICHE_PRESETS.lanchonete;
      const merged = { ...JSON.parse(JSON.stringify(basePreset)), ...brandOverrides };
      store.saveState(merged);
      return merged;
    }
    const params = new URLSearchParams(search);
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
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  function initTheme() {
    const saved = window.localStorage.getItem('vitrine_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));
  }

  function syncBodyScrollLock() {
    const drawerOpen = document.getElementById('cart-aside').classList.contains('drawer-open');
    const modalOpen = !document.getElementById('item-modal').classList.contains('hidden');
    const studioOpen = !document.getElementById('merchant-studio-modal').classList.contains('hidden');
    document.body.classList.toggle('sheet-lock', drawerOpen || modalOpen || studioOpen);
  }

  function setWizardStep(step) {
    wizardStep = step;
    document.getElementById('checkout-step-1').classList.toggle('hidden', step !== 1);
    document.getElementById('checkout-step-2').classList.toggle('hidden', step !== 2);
    document.getElementById('wizard-step-label').textContent = `Etapa ${step}/2`;
  }

  function openCartDrawer() {
    setWizardStep(1);
    document.getElementById('cart-aside').classList.add('drawer-open');
    document.getElementById('cart-backdrop').classList.remove('hidden');
    syncBodyScrollLock();
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
  }

  function closeStudioModal() {
    document.getElementById('studio-backdrop').classList.add('hidden');
    document.getElementById('merchant-studio-modal').classList.add('hidden');
    syncBodyScrollLock();
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
          try {
            resolve(canvas.toDataURL('image/webp', 0.78));
          } catch {
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          }
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
    }
    renderCatalog();
    renderCart();
  }

  function openItemModal(item) {
    const variants = Array.isArray(item.variants) ? item.variants : [];
    const packIdx = selectedPackIdxMap[item.id] ?? item.defaultPackIdx ?? 0;
    const chosenPack = Array.isArray(item.packOptions) ? item.packOptions[packIdx] : null;
    modalState = { item, qty: 1, selectedExtras: [], selectedVariant: variants[0] || '', packOverride: chosenPack };

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
      document.getElementById('modal-variant-label').textContent = item.variantLabel || 'Selecione uma opção';
      varList.innerHTML = variants.map((v, i) =>
        `<button type="button" class="variant-pill ${i === 0 ? 'active' : ''}" data-var="${v}">${v}</button>`
      ).join('');
      varList.querySelectorAll('.variant-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          varList.querySelectorAll('.variant-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
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
  }

  function closeItemModal() {
    document.getElementById('item-modal-backdrop').classList.add('hidden');
    document.getElementById('item-modal').classList.add('hidden');
    syncBodyScrollLock();
  }

  function updateModalCta() {
    if (!modalState.item) return;
    const base = modalState.packOverride ? Number(modalState.packOverride.price) : Number(modalState.item.price || 0);
    const extrasTotal = modalState.selectedExtras.reduce((s, e) => s + Number(e.price || 0), 0);
    const total = (base + extrasTotal) * modalState.qty;
    document.getElementById('modal-qty-val').textContent = String(modalState.qty);
    document.getElementById('modal-add-btn').textContent = `Adicionar • ${formatBrl(total)}`;
  }

  function renderDynamicDomainFields() {
    const dm = state.domainMode || 'food-delivery';
    const box = document.getElementById('dynamic-domain-fields');
    document.getElementById('delivery-mode-wrap').classList.toggle('hidden', dm === 'service-quote');

    if (dm === 'food-delivery') {
      box.classList.add('hidden');
      box.innerHTML = '';
      return;
    }
    box.classList.remove('hidden');

    if (dm === 'scheduled-order') {
      const tmr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const wins = (state.scheduleWindows || ['09:00 - 11:00', '16:00 - 18:30'])
        .map(w => `<option value="${w}">${w}</option>`).join('');
      box.innerHTML = `
        <div class="domain-grid-2">
          <label class="field-label">Data Encomenda<input type="date" id="sched-date" class="text-input mono" value="${tmr}" /></label>
          <label class="field-label">Janela Horário<select id="sched-window" class="select-input">${wins}</select></label>
        </div>
        <label class="field-label">Dizeres do Topo de Bolo / Cartão
          <input type="text" id="cake-message" class="text-input" placeholder="Ex: Parabéns Júlia!" />
        </label>`;
      return;
    }

    if (dm === 'recurring-pet') {
      const profile = store.loadCustomerProfile();
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
        <label class="field-label">Lembrete de recompra
          <select id="pet-remind-days" class="select-input">
            <option value="30">Avisar daqui a 30 dias</option>
            <option value="15">Avisar daqui a 15 dias</option>
            <option value="">Sem lembrete</option>
          </select>
        </label>`;
      return;
    }

    if (dm === 'service-quote') {
      const qModel = document.getElementById('quick-veh-model').value;
      const qPlate = document.getElementById('quick-veh-plate').value;
      const sympBtns = (state.symptoms || ['Barulho ao frear', 'Revisão preventiva'])
        .map(s => `<button type="button" class="quick-tag-btn symp-btn" data-symp="${s}">${s}</button>`).join('');
      box.innerHTML = `
        <div class="domain-grid-2">
          <label class="field-label">Veículo / Modelo *<input type="text" id="veh-model" class="text-input" value="${qModel}" placeholder="Ex: Onix 1.0" /></label>
          <label class="field-label">Placa / KM<input type="text" id="veh-plate" class="text-input mono" value="${qPlate}" placeholder="ABC-1D23" /></label>
        </div>
        <div class="field-label">Sintoma Relatado
          <div class="quick-tags">${sympBtns}</div>
          <input type="text" id="veh-symptom" class="text-input" placeholder="Descreva o barulho ou revisão" />
        </div>`;
      box.querySelectorAll('.symp-btn').forEach(btn => {
        btn.addEventListener('click', () => { document.getElementById('veh-symptom').value = btn.dataset.symp; });
      });
    }
  }

  function applyTheme() {
    const root = document.documentElement;
    const archetype = state.brandArchetype || 'high-energy-food';
    const layoutMode = state.layoutMode || 'food-list';
    root.setAttribute('data-archetype', archetype);
    document.body.setAttribute('data-layout', layoutMode);

    const tokens = computeAccessibleBrandTokens(state.primaryColor || '#EA1D2C', state.canvasColor || '#FFFFFF');
    root.style.setProperty('--brand-primary', tokens.primary);
    root.style.setProperty('--brand-on-primary', tokens.onPrimary);
    root.style.setProperty('--brand-surface-tint', tokens.surfaceTint);
    root.style.setProperty('--brand-border-tint', tokens.borderTint);

    const wcagBadge = document.getElementById('wcag-badge');
    if (wcagBadge) wcagBadge.textContent = `${tokens.wcagAA ? 'AA' : 'Contraste'} ${tokens.contrastRatio}:1`;

    document.getElementById('brand-mark-icon').textContent = (state.logoInitials || state.storeName.slice(0, 2)).toUpperCase();
    document.getElementById('topbar-store-name').textContent = state.storeName;

    const hoursStr = `${state.openHour || '08:00'} - ${state.closeHour || '22:00'}`;
    const openEval = evaluateStoreOpenStatus(hoursStr);
    const statusPill = document.getElementById('store-status-pill');
    statusPill.classList.toggle('closed', !openEval.isOpen);
    document.getElementById('store-status-text').textContent = openEval.statusLabel;

    // Store Meta Strip única e limpa (Zero vazamento de metadados internos)
    const freeTxt = Number(state.freeDeliveryThreshold || 0) > 0 ? ` (Grátis > ${formatBrl(state.freeDeliveryThreshold)})` : '';
    const delivTxt = state.domainMode === 'service-quote'
      ? `🛡️ Orçamento válido ${state.quoteValidityDays || 7} dias`
      : (Number(state.deliveryFee || 0) > 0 ? `🛵 ${formatBrl(state.deliveryFee)}${freeTxt}` : '🛍️ Retirada no local');
    document.getElementById('store-meta-text').textContent = `⭐ ${state.rating || '4.9 (100+)'} • 🕒 ${state.etaLabel || '30 min'} • ${delivTxt}`;

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

    document.getElementById('auto-vehicle-bar').classList.toggle('hidden', layoutMode !== 'auto-blueprint');
    document.getElementById('pet-reorder-strip').classList.toggle('hidden', layoutMode !== 'pet-recurring');

    const vocab = state.vocab || {};
    document.getElementById('cart-title').textContent = vocab.cartTitle || 'Sua Sacola';
    document.getElementById('send-wa-label').textContent = vocab.ctaBtn || 'Enviar no WhatsApp';
    document.getElementById('print-pdf-btn').textContent = vocab.pdfBtn || 'Imprimir PDF';

    const tagsWrap = document.getElementById('quick-tags-wrap');
    const tags = state.quickTags || ['Sem cebola', 'Nota Fiscal'];
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
      .map(p => `<option value="${p.id}" ${p.id === state.id ? 'selected' : ''}>${p.label}</option>`)
      .join('');
    sel.addEventListener('change', (e) => {
      const preset = NICHE_PRESETS[e.target.value];
      if (!preset) return;
      state = JSON.parse(JSON.stringify(preset));
      cart = [];
      activeCategory = 'Todos';
      activeCouponCode = '';
      splitPeople = 1;
      document.getElementById('coupon-input').value = '';
      store.saveState(state);
      renderAll();
      showToast(`Modo: ${preset.label}`);
    });
  }

  function renderCategories() {
    const activeItems = (state.items || []).filter(i => !i.paused);
    const cats = ['Todos', ...new Set(activeItems.map(i => i.category))];
    const wrap = document.getElementById('category-pills');
    wrap.innerHTML = cats.map(c =>
      `<button type="button" class="pill-btn ${c === activeCategory ? 'active' : ''}" data-cat="${c}">${c}</button>`
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
    if (qtyInCart > 0) {
      return `<div class="qty-inline">
        <button type="button" class="card-dec-btn" data-id="${item.id}" aria-label="Remover 1">-</button>
        <span>${qtyInCart}</span>
        <button type="button" class="card-inc-btn" data-id="${item.id}" aria-label="Adicionar 1">+</button>
      </div>`;
    }
    if (isMini) return `<button type="button" class="mini-add-btn add-btn" data-id="${item.id}" aria-label="Adicionar">+</button>`;
    return `<button type="button" class="btn btn-primary btn-sm add-btn" data-id="${item.id}">${customLabel}</button>`;
  }

  function renderCatalog() {
    const q = (document.getElementById('search-input').value || '').toLowerCase();
    let list = (state.items || []).filter(item => {
      if (item.paused) return false;
      const matchCat = activeCategory === 'Todos' || item.category === activeCategory;
      const matchText = !q || item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q) || (item.sku || '').toLowerCase().includes(q);
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

    const layoutMode = state.layoutMode || 'food-list';
    const emblem = NICHE_EMBLEMS[state.id] || NICHE_EMBLEMS.lanchonete;

    grid.innerHTML = list.map(item => {
      const visualContent = item.photoDataUrl ? `<img src="${item.photoDataUrl}" alt="${item.name}" />` : emblem;

      if (layoutMode === 'bakery-editorial') {
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

      if (layoutMode === 'pet-recurring') {
        const packs = Array.isArray(item.packOptions) ? item.packOptions : [];
        const pIdx = selectedPackIdxMap[item.id] ?? item.defaultPackIdx ?? 0;
        const activePack = packs[pIdx] || null;
        const dispPrice = activePack ? activePack.price : item.price;
        const chipsHtml = packs.length
          ? `<div class="pet-pack-chips">${packs.map((pk, idx) =>
              `<button type="button" class="pack-chip ${idx === pIdx ? 'active' : ''}" data-item="${item.id}" data-idx="${idx}">${pk.label}</button>`
            ).join('')}</div>`
          : '';
        return `<article class="pet-card" data-open-id="${item.id}">
          <div class="pet-card-head">
            <div>
              <h3>${item.name}</h3>
              <p class="food-desc">${item.description || ''}</p>
            </div>
            ${item.cycleLabel ? `<span class="pet-cycle-badge">${item.cycleLabel}</span>` : ''}
          </div>
          ${chipsHtml}
          <div class="pet-card-foot">
            <strong class="food-price mono">${formatBrl(dispPrice)}</strong>
            ${renderItemStepperOrBtn(item, '+ Selecionar', false)}
          </div>
        </article>`;
      }

      if (layoutMode === 'auto-blueprint') {
        return `<article class="auto-card" data-open-id="${item.id}">
          <div class="auto-card-top">
            <span class="auto-sku">[${item.sku || 'OS-SRV'}]</span>
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
            ${renderItemStepperOrBtn(item, '[+ Incluir no Orçamento]', false)}
          </div>
        </article>`;
      }

      // Default: lanchonete food-list (iFood Horizontal)
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

    grid.querySelectorAll('.add-btn, .card-inc-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = (state.items || []).find(i => i.id === btn.dataset.id && !i.paused);
        if (!item) return;
        const packs = Array.isArray(item.packOptions) ? item.packOptions : [];
        const pIdx = selectedPackIdxMap[item.id] ?? item.defaultPackIdx ?? 0;
        const pack = packs[pIdx] || null;
        addItemToCart(item, 1, [], '', '', pack);
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

  function getTotalsWithPromos() {
    const dm = state.domainMode || 'food-delivery';
    const rawSubtotal = cart.reduce((acc, item) => acc + Number(item.qty || 0) * getItemUnitPrice(item), 0);
    const freeProg = calculateFreeDeliveryProgress(rawSubtotal, state.freeDeliveryThreshold || 0, state.deliveryFee || 0);
    const fee = (deliveryMode === 'Entrega' && dm !== 'service-quote') ? freeProg.effectiveDeliveryFee : 0;
    const { applied, discountAmount } = resolveCouponDiscount(rawSubtotal, activeCouponCode, state.coupons || []);
    const totals = calculateCartTotals(cart, fee, discountAmount);
    const payDeposit50 = dm === 'scheduled-order' && document.getElementById('pay-deposit-50').checked;
    const depositInfo = calculateDepositAmount(totals.total, 0.5);
    const split = calculateSplitBill(totals.total, splitPeople);
    return { totals, applied, freeProg, payDeposit50, depositInfo, split };
  }

  function renderCart() {
    const wrap = document.getElementById('cart-items');
    const dm = state.domainMode || 'food-delivery';
    const { totals, applied, freeProg, payDeposit50, depositInfo, split } = getTotalsWithPromos();

    const freeBox = document.getElementById('free-delivery-box');
    if (dm === 'food-delivery' && freeProg.enabled) {
      freeBox.classList.remove('hidden');
      document.getElementById('free-bar-text').textContent = freeProg.unlocked
        ? 'Entrega Grátis desbloqueada!'
        : `Faltam ${formatBrl(freeProg.remaining)} para Entrega Grátis`;
      document.getElementById('free-bar-pct').textContent = `${freeProg.percent}%`;
      document.getElementById('free-progress-fill').style.width = `${freeProg.percent}%`;
    } else {
      freeBox.classList.add('hidden');
    }

    document.getElementById('padaria-deposit-wrap').classList.toggle('hidden', dm !== 'scheduled-order');
    document.getElementById('cart-badge-count').textContent = String(totals.itemCount);
    document.getElementById('subtotal-val').textContent = formatBrl(totals.subtotal);
    document.getElementById('delivery-val').textContent = freeProg.unlocked && deliveryMode === 'Entrega' ? 'GRÁTIS' : formatBrl(totals.deliveryFee);
    document.getElementById('total-val').textContent = formatBrl(totals.total);
    document.getElementById('delivery-row').classList.toggle('hidden', dm === 'service-quote' || (deliveryMode !== 'Entrega' && totals.deliveryFee === 0));

    document.getElementById('split-people-val').textContent = String(split.peopleCount);
    document.getElementById('split-per-person-val').textContent = `${split.perPersonFormatted}/pessoa`;

    document.getElementById('deposit-summary-row').classList.toggle('hidden', !payDeposit50 || totals.total <= 0);
    document.getElementById('deposit-val').textContent = formatBrl(depositInfo.deposit);

    const discRow = document.getElementById('discount-row');
    if (totals.discount > 0 && applied) {
      discRow.classList.remove('hidden');
      document.getElementById('discount-code-label').textContent = applied.code;
      document.getElementById('discount-val').textContent = `-${formatBrl(totals.discount)}`;
    } else {
      discRow.classList.add('hidden');
    }

    document.getElementById('clear-cart-btn').classList.toggle('hidden', cart.length === 0);

    const barCta = (state.vocab && state.vocab.barCta) || 'Ver Sacola';
    document.getElementById('mobile-bar-badge').textContent = String(totals.itemCount);
    document.getElementById('mobile-cart-label').textContent = barCta;
    document.getElementById('mobile-cart-total').textContent = formatBrl(totals.total);

    if (!cart.length) {
      wrap.innerHTML = '<div class="cart-empty">Seu carrinho está vazio. Toque em um item para começar.</div>';
      document.getElementById('pix-box').classList.add('hidden');
      return;
    }

    wrap.innerHTML = cart.map(c => {
      const packHtml = c.selectedPack ? `<div class="cart-row-sub">Opção: ${c.selectedPack}</div>` : '';
      const varHtml = c.selectedVariant ? `<div class="cart-row-sub">${c.selectedVariant}</div>` : '';
      const extrasNames = Array.isArray(c.selectedExtras) && c.selectedExtras.length
        ? `<div class="cart-row-sub">+ ${c.selectedExtras.map(e => e.name).join(', ')}</div>` : '';
      return `
        <div class="cart-row">
          <div>
            <div class="cart-row-name">${c.name}</div>
            ${packHtml}${varHtml}${extrasNames}
            <div class="cart-row-sub mono">${formatBrl(getItemUnitPrice(c))} un.</div>
          </div>
          <div class="qty-controls">
            <button type="button" class="qty-btn dec" data-key="${c.cartKey}" aria-label="Diminuir">-</button>
            <strong class="mono">${c.qty}</strong>
            <button type="button" class="qty-btn inc" data-key="${c.cartKey}" aria-label="Aumentar">+</button>
          </div>
        </div>`;
    }).join('');

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
    const { totals, applied, freeProg, payDeposit50 } = getTotalsWithPromos();
    const dm = state.domainMode || 'food-delivery';
    const valOf = (id) => {
      const el = document.getElementById(id);
      return el ? String(el.value || '').trim() : '';
    };
    return {
      storeName: state.storeName,
      storeWhatsapp: state.whatsapp,
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
      items: cart,
      mode: state.mode,
      domainMode: dm,
      scheduleDate: valOf('sched-date'),
      scheduleWindow: valOf('sched-window'),
      cakeMessage: valOf('cake-message'),
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
    if (!cart.length) { showToast('Adicione pelo menos 1 item.'); return false; }
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
    if (!cart.length) { showToast('Adicione itens à sacola.'); return; }
    if (!state.pixKey) { showToast('Configure a Chave Pix no Estúdio.'); return; }
    const { totals, payDeposit50, depositInfo } = getTotalsWithPromos();
    const pixValue = payDeposit50 ? depositInfo.deposit : totals.total;
    const code = generatePixBrCode({ pixKey: state.pixKey, merchantName: state.storeName, merchantCity: 'Sorocaba', amount: pixValue });
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

    let pixQrHtml = '';
    if (state.pixKey) {
      const amt = payDeposit50 ? depositInfo.deposit : totals.total;
      pixQrHtml = `<div class="print-pix-qr"><p><strong>Pix (${formatBrl(amt)}):</strong></p>${renderQrSvg(generatePixBrCode({ pixKey: state.pixKey, merchantName: state.storeName, merchantCity: 'Sorocaba', amount: amt }), 140)}</div>`;
    }
    const docTitle = payload.domainMode === 'service-quote' ? 'ORÇAMENTO PRELIMINAR OS (VÁLIDO 7 DIAS)' : 'COMPROVANTE DE PEDIDO';
    document.getElementById('print-summary').innerHTML = `
      <hr />
      <h3>${state.storeName} — ${docTitle}</h3>
      <p><strong>Cliente:</strong> ${payload.customerName} ${payload.customerPhone ? `(${payload.customerPhone})` : ''}</p>
      ${payload.vehicleModel ? `<p><strong>Veículo:</strong> ${payload.vehicleModel} | ${payload.vehiclePlate}</p>` : ''}
      <p><strong>Pagamento:</strong> ${payload.paymentMethod}</p>
      <p><strong>Total:</strong> ${formatBrl(totals.total)}</p>
      ${pixQrHtml}`;
    document.body.classList.remove('printing-tent');
    window.print();
  }

  function renderStudioPanel() {
    const today = new Date().toISOString().slice(0, 10);
    const summary = store.getDailySummary(today);
    document.getElementById('stat-today-count').textContent = String(summary.count);
    document.getElementById('stat-today-total').textContent = formatBrl(summary.totalRevenue);
    document.getElementById('stat-today-avg').textContent = formatBrl(summary.avgTicket);
    document.getElementById('studio-pitch-callout').textContent = state.pitchTip || '';

    document.getElementById('cfg-name').value = state.storeName || '';
    document.getElementById('cfg-neighborhood').value = state.neighborhood || '';
    document.getElementById('cfg-tagline').value = state.tagline || '';
    document.getElementById('cfg-archetype').value = state.brandArchetype || 'high-energy-food';
    document.getElementById('cfg-whatsapp').value = state.whatsapp || '';
    document.getElementById('cfg-pix').value = state.pixKey || '';
    document.getElementById('cfg-delivery').value = Number(state.deliveryFee || 0);
    document.getElementById('cfg-free-threshold').value = Number(state.freeDeliveryThreshold || 0);
    document.getElementById('cfg-open').value = state.openHour || '08:00';
    document.getElementById('cfg-close').value = state.closeHour || '22:00';
    document.getElementById('cfg-color').value = state.primaryColor || '#EA1D2C';

    const shareUrl = buildShareableBrandUrl(window.location.href, state);
    const qrSvg = renderQrSvg(shareUrl, 132);
    document.getElementById('store-counter-qr').innerHTML = qrSvg;
    document.getElementById('tent-store-name').textContent = state.storeName;
    document.getElementById('tent-qr-wrap').innerHTML = renderQrSvg(shareUrl, 210);
    document.getElementById('tent-store-phone').textContent = `WhatsApp: ${state.whatsapp || ''}`;

    const listEl = document.getElementById('admin-items-list');
    listEl.innerHTML = (state.items || []).map(item => `
      <div class="admin-item-row">
        <div><strong>${item.name}</strong> <span class="cart-row-sub">(${item.category}${item.paused ? ' • Pausado' : ''})</span></div>
        <div class="inline-actions">
          <input type="number" step="0.01" min="0" class="inline-price-input mono" data-id="${item.id}" value="${Number(item.price).toFixed(2)}" />
          <button type="button" class="btn btn-secondary btn-xs toggle-pause-btn" data-id="${item.id}">${item.paused ? 'Ativar' : 'Pausar'}</button>
          <button type="button" class="btn btn-secondary btn-xs remove-item-btn" data-id="${item.id}">Remover</button>
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

  function bindEvents() {
    bindVisualViewportFix();
    setupVoiceDictation();

    document.getElementById('search-input').addEventListener('input', renderCatalog);
    document.getElementById('sort-select').addEventListener('change', (e) => { sortMode = e.target.value; renderCatalog(); });
    document.getElementById('hero-coupon-pill').addEventListener('click', (e) => applyCouponCode(e.currentTarget.dataset.code));

    document.getElementById('open-studio-btn').addEventListener('click', openStudioModal);
    document.getElementById('close-studio-btn').addEventListener('click', closeStudioModal);
    document.getElementById('studio-backdrop').addEventListener('click', closeStudioModal);

    document.getElementById('theme-toggle-btn').addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      window.localStorage.setItem('vitrine_theme', next);
    });

    document.getElementById('wizard-next-btn').addEventListener('click', () => {
      if (!cart.length) { showToast('Adicione pelo menos 1 item antes de continuar.'); return; }
      renderDynamicDomainFields();
      setWizardStep(2);
    });
    document.getElementById('wizard-back-btn').addEventListener('click', () => setWizardStep(1));

    document.getElementById('split-dec-btn').addEventListener('click', () => { if (splitPeople > 1) { splitPeople -= 1; renderCart(); } });
    document.getElementById('split-inc-btn').addEventListener('click', () => { splitPeople += 1; renderCart(); });

    document.getElementById('apply-coupon-btn').addEventListener('click', () => applyCouponCode(document.getElementById('coupon-input').value));
    document.getElementById('clear-cart-btn').addEventListener('click', () => { cart = []; renderCatalog(); renderCart(); });
    document.getElementById('pay-deposit-50').addEventListener('change', renderCart);

    document.getElementById('pet-quick-repeat-btn').addEventListener('click', () => {
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

    document.querySelectorAll('.pet-size-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pet-size-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const prev = store.loadCustomerProfile();
        store.saveCustomerProfile({ ...prev, petSize: btn.dataset.petsize });
        showToast(`Porte selecionado: ${btn.dataset.petsize}`);
      });
    });

    document.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        deliveryMode = btn.dataset.delivery;
        document.getElementById('address-wrap').classList.toggle('hidden', deliveryMode !== 'Entrega');
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
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.querySelector(`.tab-pane[data-pane="${btn.dataset.tab}"]`).classList.add('active');
      });
    });

    document.getElementById('mobile-cart-bar').addEventListener('click', openCartDrawer);
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
      showToast(`${modalState.item.name} adicionado!`);
    });

    document.getElementById('send-wa-btn').addEventListener('click', handleSendWhatsApp);
    document.getElementById('gen-pix-btn').addEventListener('click', handleGeneratePix);
    document.getElementById('print-pdf-btn').addEventListener('click', handlePrintPdf);

    document.getElementById('copy-pix-btn').addEventListener('click', async () => {
      if (navigator.clipboard) await navigator.clipboard.writeText(document.getElementById('pix-code-output').value);
      showToast('Código Pix copiado.');
    });

    document.getElementById('copy-store-link-btn').addEventListener('click', async () => {
      if (navigator.clipboard) await navigator.clipboard.writeText(buildShareableBrandUrl(window.location.href, state));
      showToast('Magic Link copiado!');
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
      state.brandArchetype = document.getElementById('cfg-archetype').value;
      state.whatsapp = document.getElementById('cfg-whatsapp').value.trim();
      state.pixKey = document.getElementById('cfg-pix').value.trim();
      state.deliveryFee = Number(document.getElementById('cfg-delivery').value || 0);
      state.freeDeliveryThreshold = Number(document.getElementById('cfg-free-threshold').value || 0);
      state.openHour = document.getElementById('cfg-open').value || '08:00';
      state.closeHour = document.getElementById('cfg-close').value || '22:00';
      state.primaryColor = document.getElementById('cfg-color').value;
      store.saveState(state);
      renderAll();
      showToast('Marca salva!');
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
        try { state = JSON.parse(reader.result); store.saveState(state); renderAll(); showToast('Backup importado.'); }
        catch { showToast('JSON inválido.'); }
      };
      reader.readAsText(file);
    });
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  initTheme();
  hydrateCustomerProfile();
  initSwitcher();
  bindEvents();
  renderAll();
  if (new URLSearchParams(window.location.search).get('studio') === '1') {
    openStudioModal();
  }
})();
