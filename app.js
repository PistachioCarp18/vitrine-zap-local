(function () {
  'use strict';

  const {
    computeAccessibleBrandTokens,
    generatePixBrCode,
    resolveCouponDiscount,
    calculateFreeDeliveryProgress,
    calculateDepositAmount,
    calculateCartTotals,
    formatBrl,
    isStoreOpenNow,
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
  let modalState = { item: null, qty: 1, selectedExtras: [], selectedVariant: '' };

  const NICHE_EMBLEMS = {
    lanchonete: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11h18"/><path d="M5 11a7 7 0 0 1 14 0"/><path d="M4 15h16a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a1 1 0 0 1 1-1z"/></svg>',
    padaria: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>',
    petshop: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>',
    oficina: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
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
    document.body.classList.toggle('sheet-lock', drawerOpen || modalOpen);
  }

  function openCartDrawer() {
    document.getElementById('cart-aside').classList.add('drawer-open');
    document.getElementById('cart-backdrop').classList.remove('hidden');
    syncBodyScrollLock();
  }

  function closeCartDrawer() {
    document.getElementById('cart-aside').classList.remove('drawer-open');
    document.getElementById('cart-backdrop').classList.add('hidden');
    syncBodyScrollLock();
  }

  function getItemUnitPrice(item) {
    const extrasSum = Array.isArray(item.selectedExtras)
      ? item.selectedExtras.reduce((s, ex) => s + Number(ex.price || 0), 0)
      : 0;
    return Number(item.price || 0) + extrasSum;
  }

  function getCartKey(item, extras = [], itemNote = '', variant = '') {
    const exKey = (extras || []).map(e => e.id).sort().join(',');
    return `${item.id}::${variant}::${exKey}::${itemNote.trim()}`;
  }

  function addItemToCart(item, qty = 1, selectedExtras = [], itemNote = '', selectedVariant = '') {
    const cartKey = getCartKey(item, selectedExtras, itemNote, selectedVariant);
    const existing = cart.find(c => c.cartKey === cartKey);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        ...item,
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
    modalState = { item, qty: 1, selectedExtras: [], selectedVariant: variants[0] || '' };
    document.getElementById('modal-item-cat').textContent = item.kind ? `${item.category} • ${item.kind}` : item.category;
    document.getElementById('modal-item-title').textContent = item.name;
    document.getElementById('modal-item-desc').textContent = item.description || '';
    document.getElementById('modal-item-note').value = '';
    document.getElementById('modal-qty-val').textContent = '1';

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
      varList.innerHTML = '';
    }

    const extrasWrap = document.getElementById('modal-extras-wrap');
    const extrasList = document.getElementById('modal-extras-list');
    const extras = Array.isArray(item.extras) ? item.extras : [];
    if (extras.length) {
      extrasWrap.classList.remove('hidden');
      extrasList.innerHTML = extras.map(ex => `
        <label class="extra-option">
          <span class="extra-option-left">
            <input type="checkbox" class="extra-check" value="${ex.id}" />
            <span>${ex.name}</span>
          </span>
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
      extrasList.innerHTML = '';
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
    const extrasTotal = modalState.selectedExtras.reduce((s, e) => s + Number(e.price || 0), 0);
    const total = (Number(modalState.item.price || 0) + extrasTotal) * modalState.qty;
    document.getElementById('modal-qty-val').textContent = String(modalState.qty);
    document.getElementById('modal-add-btn').textContent = `Adicionar • ${formatBrl(total)}`;
  }

  function applyPolymorphicDomainUi() {
    const dm = state.domainMode || 'food-delivery';
    const vocab = state.vocab || {};
    document.getElementById('cart-title').textContent = vocab.cartTitle || (dm === 'service-quote' ? 'Pré-Orçamento / OS' : 'Sua Sacola');
    document.getElementById('send-wa-label').textContent = vocab.ctaBtn || 'Enviar no WhatsApp';
    document.getElementById('print-pdf-btn').textContent = vocab.pdfBtn || 'Recibo PDF';

    document.getElementById('delivery-mode-wrap').classList.toggle('hidden', dm === 'service-quote');
    document.getElementById('domain-scheduled-fields').classList.toggle('hidden', dm !== 'scheduled-order');
    document.getElementById('domain-pet-fields').classList.toggle('hidden', dm !== 'recurring-pet');
    document.getElementById('domain-quote-fields').classList.toggle('hidden', dm !== 'service-quote');

    if (dm === 'scheduled-order') {
      const dateInput = document.getElementById('sched-date');
      if (!dateInput.value) {
        const tmr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        dateInput.value = tmr;
      }
      const winSel = document.getElementById('sched-window');
      const wins = state.scheduleWindows || ['09:00 - 11:00', '14:00 - 17:00'];
      winSel.innerHTML = wins.map(w => `<option value="${w}">${w}</option>`).join('');
    }

    if (dm === 'service-quote') {
      const sympWrap = document.getElementById('symptom-pills');
      const symptoms = state.symptoms || ['Barulho ao frear', 'Revisão preventiva', 'Luz de injeção acesa'];
      sympWrap.innerHTML = symptoms.map(s => `<button type="button" class="quick-tag-btn symp-btn" data-symp="${s}">${s}</button>`).join('');
      sympWrap.querySelectorAll('.symp-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById('veh-symptom').value = btn.dataset.symp;
        });
      });
    }

    const heroRepeatBtn = document.getElementById('hero-repeat-last-btn');
    const last = store.getLastOrder();
    heroRepeatBtn.classList.toggle('hidden', !(dm === 'recurring-pet' && last.items && last.items.length));
  }

  function applyTheme() {
    const root = document.documentElement;
    const archetype = state.brandArchetype || 'high-energy-food';
    root.setAttribute('data-archetype', archetype);

    const tokens = computeAccessibleBrandTokens(state.primaryColor || '#EA1D2C', state.canvasColor || '#FFFFFF');
    root.style.setProperty('--brand-primary', tokens.primary);
    root.style.setProperty('--brand-on-primary', tokens.onPrimary);
    root.style.setProperty('--brand-surface-tint', tokens.surfaceTint);
    root.style.setProperty('--brand-border-tint', tokens.borderTint);

    const wcagBadge = document.getElementById('wcag-badge');
    if (wcagBadge) {
      wcagBadge.textContent = `${tokens.wcagAA ? 'WCAG AA' : 'Contraste'} ${tokens.contrastRatio}:1`;
    }

    const emblem = NICHE_EMBLEMS[state.id] || NICHE_EMBLEMS.lanchonete;
    document.getElementById('brand-mark-icon').innerHTML = state.logoInitials
      ? `<span>${state.logoInitials.slice(0, 2).toUpperCase()}</span>`
      : emblem;
    document.getElementById('hero-emblem').innerHTML = emblem;

    document.getElementById('art-direction-tag').textContent = `${state.artDirection || archetype} • Zero Taxa`;
    document.getElementById('store-title').textContent = state.storeName;
    document.getElementById('topbar-store-name').textContent = state.storeName;
    document.getElementById('store-tagline').textContent = state.tagline || '';
    document.getElementById('store-neighborhood').textContent = state.neighborhood || 'Sorocaba-SP';
    document.getElementById('hero-eta').textContent = state.etaLabel || '30 min';
    document.getElementById('hero-archetype-label').textContent = archetype.split('-')[0].toUpperCase();

    const dm = state.domainMode || 'food-delivery';
    document.getElementById('hero-right-label').textContent = dm === 'service-quote' ? 'Validade OS' : 'Entrega';
    document.getElementById('hero-delivery-fee').textContent = dm === 'service-quote'
      ? `${state.quoteValidityDays || 7} dias`
      : (Number(state.deliveryFee || 0) > 0 ? formatBrl(state.deliveryFee) : 'Grátis');

    const openHour = state.openHour || '08:00';
    const closeHour = state.closeHour || '22:00';
    document.getElementById('hero-hours').textContent = `${openHour} - ${closeHour}`;
    const isOpen = isStoreOpenNow(openHour, closeHour);
    const statusPill = document.getElementById('store-status-pill');
    statusPill.classList.toggle('closed', !isOpen);
    document.getElementById('store-status-text').textContent = isOpen ? 'Aberto' : 'Agendamento';

    const activeItems = (state.items || []).filter(i => !i.paused);
    document.getElementById('hero-item-count').textContent = String(activeItems.length);

    const promo = (state.coupons || [])[0];
    const heroCouponBtn = document.getElementById('hero-coupon-pill');
    if (promo) {
      const label = promo.type === 'percent' ? `${promo.value}% OFF` : `${formatBrl(promo.value)} OFF`;
      document.getElementById('hero-coupon-text').textContent = `${promo.code} (${label})`;
      heroCouponBtn.classList.remove('hidden');
      heroCouponBtn.dataset.code = promo.code;
    } else {
      heroCouponBtn.classList.add('hidden');
    }

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

    const banner = document.getElementById('pitch-banner');
    const bannerText = document.getElementById('pitch-banner-text');
    if (state.pitchTip) {
      bannerText.textContent = state.pitchTip;
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }

    applyPolymorphicDomainUi();
  }

  function hydrateCustomerProfile() {
    const profile = store.loadCustomerProfile();
    if (profile.name) document.getElementById('cust-name').value = profile.name;
    if (profile.phone) document.getElementById('cust-phone').value = profile.phone;
    if (profile.address) document.getElementById('cust-address').value = profile.address;
    if (profile.petName) document.getElementById('pet-name').value = profile.petName;
    if (profile.petSize) document.getElementById('pet-size').value = profile.petSize;
  }

  function persistCustomerProfile() {
    store.saveCustomerProfile({
      name: document.getElementById('cust-name').value.trim(),
      phone: document.getElementById('cust-phone').value.trim(),
      address: document.getElementById('cust-address').value.trim(),
      petName: document.getElementById('pet-name').value.trim(),
      petSize: document.getElementById('pet-size').value,
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
      document.getElementById('coupon-input').value = '';
      store.saveState(state);
      renderAll();
      showToast(`Modo: ${preset.label}`);
    });
  }

  function renderCategories() {
    const activeItems = (state.items || []).filter(i => !i.paused);
    const counts = activeItems.reduce((acc, i) => {
      acc[i.category] = (acc[i.category] || 0) + 1;
      return acc;
    }, {});
    const cats = ['Todos', ...Object.keys(counts)];
    const wrap = document.getElementById('category-pills');
    wrap.innerHTML = cats.map(c => {
      const n = c === 'Todos' ? activeItems.length : counts[c];
      return `<button type="button" class="pill-btn ${c === activeCategory ? 'active' : ''}" data-cat="${c}">${c} (${n})</button>`;
    }).join('');
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

  function updateSimpleQty(itemId, delta) {
    const simpleKey = getCartKey({ id: itemId }, [], '', '');
    const existing = cart.find(c => c.cartKey === simpleKey || c.id === itemId);
    if (!existing && delta > 0) {
      const item = (state.items || []).find(i => i.id === itemId && !i.paused);
      if (item) addItemToCart(item, 1, [], '', '');
      return;
    }
    if (existing) {
      existing.qty += delta;
      if (existing.qty <= 0) cart = cart.filter(c => c.cartKey !== existing.cartKey);
    }
    renderCatalog();
    renderCart();
  }

  function renderCatalog() {
    const q = (document.getElementById('search-input').value || '').toLowerCase();
    let list = (state.items || []).filter(item => {
      if (item.paused) return false;
      const matchCat = activeCategory === 'Todos' || item.category === activeCategory;
      const matchText = !q || item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      return matchCat && matchText;
    });

    if (sortMode === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sortMode === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    if (sortMode === 'az') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    const grid = document.getElementById('catalog-grid');
    if (!list.length) {
      grid.innerHTML = '<div class="card">Nenhum item encontrado no catálogo.</div>';
      return;
    }

    const emblem = NICHE_EMBLEMS[state.id] || NICHE_EMBLEMS.lanchonete;
    const addLabel = (state.vocab && state.vocab.addBtn) || '+ Add';
    grid.innerHTML = list.map((item, idx) => {
      const qtyInCart = cart.filter(c => c.id === item.id).reduce((s, c) => s + c.qty, 0);
      const isFeatured = idx === 0 && activeCategory === 'Todos' && !q && sortMode === 'featured';
      const numLabel = String(idx + 1).padStart(2, '0');
      const cycleHtml = item.cycleLabel ? `<span class="item-cycle-pill">${item.cycleLabel}</span>` : '';
      const actionHtml = qtyInCart > 0
        ? `<div class="qty-inline">
             <button type="button" class="card-dec-btn" data-id="${item.id}" aria-label="Remover 1">-</button>
             <span>${qtyInCart}</span>
             <button type="button" class="card-inc-btn" data-id="${item.id}" aria-label="Adicionar 1">+</button>
           </div>`
        : `<button type="button" class="btn btn-primary btn-sm add-btn" data-id="${item.id}">${addLabel}</button>`;

      return `
        <article class="item-card ${isFeatured ? 'item-card--featured' : ''}" data-open-id="${item.id}">
          <div class="item-visual">
            <span class="item-cat-tag"><span class="item-index">${numLabel}</span><span>${item.category}</span></span>
            <div class="inline-actions">${cycleHtml}${item.badge ? `<span class="item-badge">${item.badge}</span>` : ''}</div>
          </div>
          <div class="item-body">
            <div class="item-mobile-meta">
              <span class="item-index">${numLabel}</span>
              <span class="item-cat-label">${item.category}</span>
              ${cycleHtml}
              ${item.badge ? `<span class="item-badge">${item.badge}</span>` : ''}
            </div>
            <h3>${item.name}</h3>
            <p class="item-desc">${item.description || ''}</p>
            <div class="item-price-row">
              <span class="item-price mono">${formatBrl(item.price)}</span>
              ${item.prepTime ? `<span class="item-prep">${item.prepTime}</span>` : ''}
            </div>
          </div>
          <div class="item-footer">
            <div class="item-thumb-box" aria-hidden="true">${emblem}</div>
            <span class="item-price mono">${formatBrl(item.price)}</span>
            ${actionHtml}
          </div>
        </article>`;
    }).join('');

    grid.querySelectorAll('.item-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const item = (state.items || []).find(i => i.id === card.dataset.openId);
        if (item) openItemModal(item);
      });
    });

    grid.querySelectorAll('.add-btn, .card-inc-btn').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); updateSimpleQty(btn.dataset.id, 1); });
    });
    grid.querySelectorAll('.card-dec-btn').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); updateSimpleQty(btn.dataset.id, -1); });
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
    return { totals, applied, freeProg, payDeposit50, depositInfo };
  }

  function renderCart() {
    const wrap = document.getElementById('cart-items');
    const dm = state.domainMode || 'food-delivery';
    const { totals, applied, freeProg, payDeposit50, depositInfo } = getTotalsWithPromos();

    const freeWrap = document.getElementById('free-delivery-banner');
    const cartFreeNote = document.getElementById('cart-free-note');
    if (freeProg.enabled && dm !== 'service-quote') {
      freeWrap.classList.remove('hidden');
      const msg = freeProg.unlocked
        ? 'Entrega Grátis desbloqueada para o bairro!'
        : `Faltam ${formatBrl(freeProg.remaining)} para ganhar Entrega Grátis`;
      document.getElementById('free-bar-text').textContent = msg;
      document.getElementById('free-bar-pct').textContent = `${freeProg.percent}%`;
      document.getElementById('free-progress-fill').style.width = `${freeProg.percent}%`;
      cartFreeNote.textContent = msg;
      cartFreeNote.classList.remove('hidden');
    } else {
      freeWrap.classList.add('hidden');
      cartFreeNote.classList.add('hidden');
    }

    document.getElementById('cart-badge-count').textContent = String(totals.itemCount);
    document.getElementById('subtotal-val').textContent = formatBrl(totals.subtotal);
    document.getElementById('delivery-val').textContent = freeProg.unlocked && deliveryMode === 'Entrega' ? 'GRÁTIS' : formatBrl(totals.deliveryFee);
    document.getElementById('total-val').textContent = formatBrl(totals.total);
    document.getElementById('delivery-row').classList.toggle('hidden', dm === 'service-quote' || (deliveryMode !== 'Entrega' && totals.deliveryFee === 0));

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
    const hasLast = store.loadLastCart().length > 0 && cart.length === 0;
    document.getElementById('repeat-order-btn').classList.toggle('hidden', !hasLast);

    const mobileBar = document.getElementById('mobile-cart-bar');
    if (totals.itemCount > 0) {
      mobileBar.classList.remove('hidden');
      const barVerb = dm === 'service-quote' ? 'Ver Pré-Orçamento' : 'Ver sacola';
      document.getElementById('mobile-cart-label').textContent = `${barVerb} (${totals.itemCount})`;
      document.getElementById('mobile-cart-total').textContent = formatBrl(totals.total);
    } else {
      mobileBar.classList.add('hidden');
    }

    if (!cart.length) {
      wrap.innerHTML = '<div class="cart-empty">Toque em qualquer item da vitrine para adicionar.</div>';
      document.getElementById('pix-box').classList.add('hidden');
      return;
    }

    wrap.innerHTML = cart.map(c => {
      const varHtml = c.selectedVariant ? `<div class="cart-row-sub">Opção: ${c.selectedVariant}</div>` : '';
      const extrasNames = Array.isArray(c.selectedExtras) && c.selectedExtras.length
        ? `<div class="cart-row-sub">+ ${c.selectedExtras.map(e => e.name).join(', ')}</div>` : '';
      const noteHtml = c.itemNote ? `<div class="cart-row-sub">Obs: ${c.itemNote}</div>` : '';
      return `
        <div class="cart-row">
          <div>
            <div class="cart-row-name">${c.name}</div>
            ${varHtml}${extrasNames}${noteHtml}
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
    return {
      storeName: state.storeName,
      storeWhatsapp: state.whatsapp,
      customerName: document.getElementById('cust-name').value.trim(),
      customerPhone: document.getElementById('cust-phone').value.trim(),
      deliveryMode,
      address: document.getElementById('cust-address').value.trim(),
      paymentMethod,
      changeFor: document.getElementById('cust-change').value.trim(),
      notes: document.getElementById('cust-notes').value.trim(),
      deliveryFee: deliveryMode === 'Entrega' ? freeProg.effectiveDeliveryFee : 0,
      discount: totals.discount,
      couponCode: applied ? applied.code : '',
      items: cart,
      mode: state.mode,
      domainMode: dm,
      scheduleDate: document.getElementById('sched-date').value,
      scheduleWindow: document.getElementById('sched-window').value,
      cakeMessage: document.getElementById('cake-message').value.trim(),
      payDeposit50,
      petName: document.getElementById('pet-name').value.trim(),
      petSize: document.getElementById('pet-size').value,
      petRemindDays: document.getElementById('pet-remind-days').value,
      vehicleModel: document.getElementById('veh-model').value.trim(),
      vehiclePlate: document.getElementById('veh-plate').value.trim(),
      vehicleSymptom: document.getElementById('veh-symptom').value.trim(),
    };
  }

  function validateOrder() {
    if (!cart.length) {
      showToast('Adicione pelo menos 1 item antes de continuar.');
      return false;
    }
    const custName = document.getElementById('cust-name').value.trim();
    if (!custName) {
      showToast('Informe seu nome para identificar.');
      document.getElementById('cust-name').focus();
      return false;
    }
    persistCustomerProfile();
    return true;
  }

  function handleSendWhatsApp() {
    if (!validateOrder()) return;
    const payload = getCheckoutPayload();
    const { url, totals } = buildWhatsAppOrderUrl(payload);
    store.saveLastCart(cart);
    store.recordOrder({
      customerName: payload.customerName,
      channel: 'WhatsApp',
      paymentMethod: payload.paymentMethod,
      itemCount: totals.itemCount,
      total: totals.total,
    });
    renderAdminPanel();
    window.open(url, '_blank', 'noopener');
    showToast('Aberto no WhatsApp!');
  }

  function handleGeneratePix() {
    if (!cart.length) {
      showToast('Adicione itens antes de gerar o Pix.');
      return;
    }
    if (!state.pixKey) {
      showToast('Configure a Chave Pix no Painel da Marca.');
      return;
    }
    const { totals, payDeposit50, depositInfo } = getTotalsWithPromos();
    const pixValue = payDeposit50 ? depositInfo.deposit : totals.total;
    const code = generatePixBrCode({
      pixKey: state.pixKey,
      merchantName: state.storeName,
      merchantCity: 'Sorocaba',
      amount: pixValue,
    });
    document.getElementById('pix-box-title').textContent = payDeposit50 ? 'Sinal Pix 50% (Encomenda)' : 'Pagamento via Pix (Offline)';
    document.getElementById('pix-amount-badge').textContent = formatBrl(pixValue);
    document.getElementById('pix-qr-svg').innerHTML = renderQrSvg(code, 176);
    document.getElementById('pix-code-output').value = code;
    document.getElementById('pix-box').classList.remove('hidden');
    showToast('QR Code Pix gerado offline.');
  }

  function handlePrintPdf() {
    if (!validateOrder()) return;
    const payload = getCheckoutPayload();
    const { totals, payDeposit50, depositInfo } = getTotalsWithPromos();
    store.saveLastCart(cart);
    store.recordOrder({
      customerName: payload.customerName,
      channel: 'PDF',
      paymentMethod: payload.paymentMethod,
      itemCount: totals.itemCount,
      total: totals.total,
    });
    renderAdminPanel();

    let pixQrHtml = '';
    if (state.pixKey) {
      const amt = payDeposit50 ? depositInfo.deposit : totals.total;
      const brCode = generatePixBrCode({ pixKey: state.pixKey, merchantName: state.storeName, merchantCity: 'Sorocaba', amount: amt });
      pixQrHtml = `<div class="print-pix-qr"><p><strong>Pague via Pix (${formatBrl(amt)}):</strong></p>${renderQrSvg(brCode, 140)}</div>`;
    }

    const dm = payload.domainMode;
    const docTitle = dm === 'service-quote' ? 'ORDEM DE SERVIÇO PRELIMINAR (VÁLIDA POR 7 DIAS)' : 'COMPROVANTE DE PEDIDO';
    const domainMeta = dm === 'service-quote'
      ? `<p><strong>Veículo:</strong> ${payload.vehicleModel || '-'} | <strong>Placa/KM:</strong> ${payload.vehiclePlate || '-'}</p><p><strong>Sintoma:</strong> ${payload.vehicleSymptom || '-'}</p>`
      : dm === 'scheduled-order'
        ? `<p><strong>Agendamento:</strong> ${payload.scheduleDate} (${payload.scheduleWindow})</p>${payload.cakeMessage ? `<p><strong>Topo/Cartão:</strong> ${payload.cakeMessage}</p>` : ''}`
        : dm === 'recurring-pet'
          ? `<p><strong>Pet:</strong> ${payload.petName || '-'} (${payload.petSize})</p>`
          : `<p><strong>Modalidade:</strong> ${payload.deliveryMode} ${payload.address ? `— ${payload.address}` : ''}</p>`;

    document.getElementById('print-summary').innerHTML = `
      <hr />
      <h3>${state.storeName} — ${docTitle}</h3>
      <p><strong>Cliente:</strong> ${payload.customerName} ${payload.customerPhone ? `(${payload.customerPhone})` : ''}</p>
      ${domainMeta}
      <p><strong>Pagamento:</strong> ${payload.paymentMethod}</p>
      ${payload.notes ? `<p><strong>Obs.:</strong> ${payload.notes}</p>` : ''}
      <p><strong>Emitido em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      ${pixQrHtml}`;
    window.print();
  }

  function renderAdminPanel() {
    const today = new Date().toISOString().slice(0, 10);
    const summary = store.getDailySummary(today);
    document.getElementById('stat-today-count').textContent = String(summary.count);
    document.getElementById('stat-today-total').textContent = formatBrl(summary.totalRevenue);
    document.getElementById('stat-today-avg').textContent = formatBrl(summary.avgTicket);

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
    document.getElementById('store-counter-qr').innerHTML = renderQrSvg(shareUrl, 132);

    const listEl = document.getElementById('admin-items-list');
    listEl.innerHTML = (state.items || []).map(item => `
      <div class="admin-item-row">
        <div><strong>${item.name}</strong> <span class="cart-row-sub">(${item.category}${item.paused ? ' • Pausado' : ''})</span></div>
        <div class="inline-actions">
          <input type="number" step="0.01" min="0" class="inline-price-input mono" data-id="${item.id}" value="${Number(item.price).toFixed(2)}" aria-label="Preço de ${item.name}" />
          <button type="button" class="btn btn-secondary btn-xs toggle-pause-btn" data-id="${item.id}">${item.paused ? 'Ativar' : 'Pausar'}</button>
          <button type="button" class="btn btn-secondary btn-xs remove-item-btn" data-id="${item.id}">Remover</button>
        </div>
      </div>`).join('');

    listEl.querySelectorAll('.inline-price-input').forEach(inp => {
      inp.addEventListener('change', () => {
        const val = Math.max(0, Number(inp.value || 0));
        state.items = (state.items || []).map(i => i.id === inp.dataset.id ? { ...i, price: val } : i);
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
          <div>
            <strong>${o.customerName}</strong> <span class="cart-row-sub">(${o.channel} • ${o.paymentMethod || 'Pix'})</span>
            <div class="cart-row-sub">${new Date(o.createdAt).toLocaleString('pt-BR')}</div>
          </div>
          <strong class="mono">${formatBrl(o.total)}</strong>
        </div>`).join('')
      : '<div class="cart-empty">Nenhum registro local ainda.</div>';
  }

  function renderAll() {
    applyTheme();
    renderCategories();
    renderCatalog();
    renderCart();
    renderAdminPanel();
  }

  function applyCouponCode(code) {
    const clean = String(code || '').trim().toUpperCase();
    if (!clean) {
      activeCouponCode = '';
      renderCart();
      return;
    }
    const rawSubtotal = cart.reduce((acc, i) => acc + Number(i.qty || 0) * getItemUnitPrice(i), 0);
    const { applied } = resolveCouponDiscount(rawSubtotal || 100, clean, state.coupons || []);
    if (!applied) {
      showToast('Cupom não encontrado.');
      return;
    }
    activeCouponCode = applied.code;
    document.getElementById('coupon-input').value = applied.code;
    renderCart();
    showToast(`Cupom ${applied.code} aplicado!`);
  }

  function repeatLastOrder() {
    const last = store.getLastOrder();
    if (!last.items || !last.items.length) return;
    cart = JSON.parse(JSON.stringify(last.items));
    renderCatalog();
    renderCart();
    showToast('Último pedido carregado na sacola!');
  }

  function bindVisualViewportFix() {
    if (!window.visualViewport) return;
    window.visualViewport.addEventListener('resize', () => {
      const keyboardOffset = Math.max(0, window.innerHeight - window.visualViewport.height);
      const aside = document.getElementById('cart-aside');
      if (aside.classList.contains('drawer-open')) {
        aside.style.paddingBottom = `${24 + keyboardOffset}px`;
      }
    });
  }

  function bindEvents() {
    bindVisualViewportFix();
    document.getElementById('search-input').addEventListener('input', renderCatalog);
    document.getElementById('sort-select').addEventListener('change', (e) => { sortMode = e.target.value; renderCatalog(); });
    document.getElementById('hero-coupon-pill').addEventListener('click', (e) => applyCouponCode(e.currentTarget.dataset.code));

    document.getElementById('theme-toggle-btn').addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      window.localStorage.setItem('vitrine_theme', next);
    });

    document.getElementById('apply-coupon-btn').addEventListener('click', () => applyCouponCode(document.getElementById('coupon-input').value));
    document.getElementById('clear-cart-btn').addEventListener('click', () => { cart = []; renderCatalog(); renderCart(); });
    document.getElementById('repeat-order-btn').addEventListener('click', repeatLastOrder);
    document.getElementById('hero-repeat-last-btn').addEventListener('click', () => { repeatLastOrder(); openCartDrawer(); });
    document.getElementById('pay-deposit-50').addEventListener('change', renderCart);

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
      const note = document.getElementById('modal-item-note').value;
      addItemToCart(modalState.item, modalState.qty, modalState.selectedExtras, note, modalState.selectedVariant);
      closeItemModal();
      showToast(`${modalState.item.name} incluído!`);
    });

    document.getElementById('send-wa-btn').addEventListener('click', handleSendWhatsApp);
    document.getElementById('gen-pix-btn').addEventListener('click', handleGeneratePix);
    document.getElementById('print-pdf-btn').addEventListener('click', handlePrintPdf);

    document.getElementById('copy-pix-btn').addEventListener('click', async () => {
      const text = document.getElementById('pix-code-output').value;
      if (navigator.clipboard) await navigator.clipboard.writeText(text);
      showToast('Código Pix copiado.');
    });

    document.getElementById('copy-store-link-btn').addEventListener('click', async () => {
      const shareUrl = buildShareableBrandUrl(window.location.href, state);
      if (navigator.clipboard) await navigator.clipboard.writeText(shareUrl);
      showToast('Magic Brand Link copiado!');
    });

    document.getElementById('print-counter-qr-btn').addEventListener('click', () => window.print());

    const adminSec = document.getElementById('admin-section');
    const catSec = document.getElementById('catalog-section');
    document.getElementById('toggle-admin-btn').addEventListener('click', () => {
      const showAdmin = adminSec.classList.contains('hidden');
      adminSec.classList.toggle('hidden', !showAdmin);
      catSec.classList.toggle('hidden', showAdmin);
      renderAdminPanel();
    });
    document.getElementById('close-admin-btn').addEventListener('click', () => {
      adminSec.classList.add('hidden');
      catSec.classList.remove('hidden');
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
      showToast('Identidade Camaleão atualizada!');
    });

    document.getElementById('add-item-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const newItem = {
        id: 'item-' + Date.now(),
        category: document.getElementById('item-category').value.trim(),
        name: document.getElementById('item-name').value.trim(),
        price: Number(document.getElementById('item-price').value || 0),
        prepTime: document.getElementById('item-prep').value.trim(),
        badge: document.getElementById('item-badge').value.trim(),
        description: document.getElementById('item-desc').value.trim(),
        paused: false,
      };
      state.items = [...(state.items || []), newItem];
      store.saveState(state);
      e.target.reset();
      renderAll();
      showToast('Item adicionado.');
    });

    document.getElementById('export-csv-btn').addEventListener('click', () => {
      const csv = exportOrdersCsv(store.loadHistory());
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `pedidos-${state.id || 'vitrinezap'}.csv`;
      a.click();
    });

    document.getElementById('clear-history-btn').addEventListener('click', () => { store.clearHistory(); renderAdminPanel(); });

    document.getElementById('export-json-btn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vitrine-zap-${state.id || 'loja'}.json`;
      a.click();
    });

    document.getElementById('import-json-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          state = JSON.parse(reader.result);
          store.saveState(state);
          renderAll();
          showToast('Backup importado.');
        } catch { showToast('JSON inválido.'); }
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
})();
