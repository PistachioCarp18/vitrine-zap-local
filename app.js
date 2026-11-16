(function () {
  'use strict';

  const {
    generatePixBrCode,
    resolveCouponDiscount,
    calculateCartTotals,
    formatBrl,
    isStoreOpenNow,
    buildWhatsAppOrderUrl,
  } = window.VitrineIntegrations;
  const { renderQrSvg } = window.VitrineQrCode;
  const { createStore, encodeStoreConfig, decodeStoreConfig, exportOrdersCsv } = window.VitrineStore;
  const { NICHE_PRESETS } = window.VitrinePresets;

  const store = createStore(window.localStorage);
  let state = loadInitialState();
  let cart = [];
  let activeCategory = 'Todos';
  let sortMode = 'featured';
  let deliveryMode = 'Retirada';
  let paymentMethod = 'Pix';
  let activeCouponCode = '';

  const NICHE_EMBLEMS = {
    lanchonete: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11h18"/><path d="M5 11a7 7 0 0 1 14 0"/><path d="M4 15h16a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a1 1 0 0 1 1-1z"/></svg>',
    padaria: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>',
    petshop: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>',
    oficina: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  };

  function loadInitialState() {
    const params = new URLSearchParams(window.location.search);
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
    setTimeout(() => el.remove(), 3200);
  }

  function initTheme() {
    const saved = window.localStorage.getItem('vitrine_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }

  function applyTheme() {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', state.primaryColor || '#D9480F');
    if (state.canvasColor) root.style.setProperty('--canvas', state.canvasColor);
    if (state.inkColor) root.style.setProperty('--text-primary', state.inkColor);

    const emblem = NICHE_EMBLEMS[state.id] || NICHE_EMBLEMS.lanchonete;
    document.getElementById('brand-mark-icon').innerHTML = emblem;
    document.getElementById('hero-emblem').innerHTML = emblem;

    document.getElementById('art-direction-tag').textContent = `${state.artDirection || 'Vitrine Direta'} • Zero Taxa`;
    document.getElementById('store-title').textContent = state.storeName;
    document.getElementById('topbar-store-name').textContent = state.storeName;
    document.getElementById('store-tagline').textContent = state.tagline || '';
    document.getElementById('store-neighborhood').textContent = state.neighborhood || 'Sorocaba-SP';
    document.getElementById('cart-title').textContent = state.mode === 'orcamento' ? 'Orçamento / OS' : 'Seu Pedido';
    document.getElementById('hero-eta').textContent = state.etaLabel || '30 min';

    const openHour = state.openHour || '08:00';
    const closeHour = state.closeHour || '22:00';
    document.getElementById('hero-hours').textContent = `${openHour} - ${closeHour}`;
    const isOpen = isStoreOpenNow(openHour, closeHour);
    const statusPill = document.getElementById('store-status-pill');
    statusPill.classList.toggle('closed', !isOpen);
    document.getElementById('store-status-text').textContent = isOpen ? 'Aberto agora' : 'Fechado (Agendamento)';

    const activeItems = (state.items || []).filter(i => !i.paused);
    document.getElementById('hero-delivery-fee').textContent = Number(state.deliveryFee || 0) > 0 ? formatBrl(state.deliveryFee) : 'Grátis';
    document.getElementById('hero-item-count').textContent = String(activeItems.length);

    const promo = (state.coupons || [])[0];
    const heroCouponBtn = document.getElementById('hero-coupon-pill');
    if (promo) {
      const label = promo.type === 'percent' ? `${promo.value}% OFF` : `${formatBrl(promo.value)} OFF`;
      document.getElementById('hero-coupon-text').textContent = `Cupom ${promo.code} (${label}) — Aplicar`;
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
  }

  function hydrateCustomerProfile() {
    const profile = store.loadCustomerProfile();
    if (profile.name) document.getElementById('cust-name').value = profile.name;
    if (profile.phone) document.getElementById('cust-phone').value = profile.phone;
    if (profile.address) document.getElementById('cust-address').value = profile.address;
  }

  function persistCustomerProfile() {
    store.saveCustomerProfile({
      name: document.getElementById('cust-name').value.trim(),
      phone: document.getElementById('cust-phone').value.trim(),
      address: document.getElementById('cust-address').value.trim(),
    });
  }

  function initSwitcher() {
    const sel = document.getElementById('niche-switcher');
    sel.innerHTML = Object.values(NICHE_PRESETS)
      .map(p => `<option value="${p.id}" ${p.id === state.id ? 'selected' : ''}>Demo: ${p.label}</option>`)
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
      showToast(`Identidade visual alterada para ${preset.artDirection}`);
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
      });
    });
  }

  function updateQty(itemId, delta) {
    const existing = cart.find(c => c.id === itemId);
    if (!existing && delta > 0) {
      const item = (state.items || []).find(i => i.id === itemId && !i.paused);
      if (item) cart.push({ ...item, qty: 1 });
    } else if (existing) {
      existing.qty += delta;
      if (existing.qty <= 0) cart = cart.filter(c => c.id !== itemId);
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
      grid.innerHTML = '<div class="card">Nenhum produto ou serviço encontrado para essa busca.</div>';
      return;
    }

    grid.innerHTML = list.map((item, idx) => {
      const inCart = cart.find(c => c.id === item.id);
      const isFeatured = idx === 0 && activeCategory === 'Todos' && !q && sortMode === 'featured';
      const numLabel = String(idx + 1).padStart(2, '0');
      const actionHtml = inCart
        ? `<div class="qty-inline">
             <button type="button" class="card-dec-btn" data-id="${item.id}" aria-label="Remover 1">-</button>
             <span>${inCart.qty}</span>
             <button type="button" class="card-inc-btn" data-id="${item.id}" aria-label="Adicionar 1">+</button>
           </div>`
        : `<button type="button" class="btn btn-primary btn-sm add-btn" data-id="${item.id}">Adicionar</button>`;

      return `
        <article class="item-card ${isFeatured ? 'item-card--featured' : ''}">
          <div class="item-visual">
            <span class="item-cat-tag"><span class="item-index">${numLabel}</span><span>${item.category}</span></span>
            ${item.badge ? `<span class="item-badge">${item.badge}</span>` : ''}
          </div>
          <div class="item-body">
            <h3>${item.name}</h3>
            <p class="item-desc">${item.description || ''}</p>
            ${item.prepTime ? `<div class="item-prep"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>${item.prepTime}</span></div>` : ''}
          </div>
          <div class="item-footer">
            <span class="item-price mono">${formatBrl(item.price)}</span>
            ${actionHtml}
          </div>
        </article>`;
    }).join('');

    grid.querySelectorAll('.add-btn, .card-inc-btn').forEach(btn => {
      btn.addEventListener('click', () => updateQty(btn.dataset.id, 1));
    });
    grid.querySelectorAll('.card-dec-btn').forEach(btn => {
      btn.addEventListener('click', () => updateQty(btn.dataset.id, -1));
    });
  }

  function getTotalsWithCoupon() {
    const fee = deliveryMode === 'Entrega' ? Number(state.deliveryFee || 0) : 0;
    const rawSubtotal = cart.reduce((acc, i) => acc + Number(i.qty || 0) * Number(i.price || 0), 0);
    const { applied, discountAmount } = resolveCouponDiscount(rawSubtotal, activeCouponCode, state.coupons || []);
    const totals = calculateCartTotals(cart, fee, discountAmount);
    return { totals, applied };
  }

  function renderCart() {
    const wrap = document.getElementById('cart-items');
    const { totals, applied } = getTotalsWithCoupon();

    document.getElementById('cart-badge-count').textContent = String(totals.itemCount);
    document.getElementById('subtotal-val').textContent = formatBrl(totals.subtotal);
    document.getElementById('delivery-val').textContent = formatBrl(totals.deliveryFee);
    document.getElementById('total-val').textContent = formatBrl(totals.total);
    document.getElementById('delivery-row').classList.toggle('hidden', totals.deliveryFee === 0);

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
      document.getElementById('mobile-cart-label').textContent = `Ver Pedido (${totals.itemCount} ${totals.itemCount === 1 ? 'item' : 'itens'})`;
      document.getElementById('mobile-cart-total').textContent = formatBrl(totals.total);
    } else {
      mobileBar.classList.add('hidden');
    }

    if (!cart.length) {
      wrap.innerHTML = '<div class="cart-empty">Selecione itens na vitrine para montar seu pedido ou orçamento.</div>';
      document.getElementById('pix-box').classList.add('hidden');
      return;
    }

    wrap.innerHTML = cart.map(c => `
      <div class="cart-row">
        <div>
          <div class="cart-row-name">${c.name}</div>
          <div class="cart-row-sub mono">${formatBrl(c.price)} un.</div>
        </div>
        <div class="qty-controls">
          <button type="button" class="qty-btn dec" data-id="${c.id}" aria-label="Diminuir">-</button>
          <strong class="mono">${c.qty}</strong>
          <button type="button" class="qty-btn inc" data-id="${c.id}" aria-label="Aumentar">+</button>
        </div>
      </div>`).join('');

    wrap.querySelectorAll('.inc').forEach(b => b.addEventListener('click', () => updateQty(b.dataset.id, 1)));
    wrap.querySelectorAll('.dec').forEach(b => b.addEventListener('click', () => updateQty(b.dataset.id, -1)));
  }

  function getCheckoutPayload() {
    const { totals, applied } = getTotalsWithCoupon();
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
      deliveryFee: deliveryMode === 'Entrega' ? Number(state.deliveryFee || 0) : 0,
      discount: totals.discount,
      couponCode: applied ? applied.code : '',
      items: cart,
      mode: state.mode,
    };
  }

  function validateOrder() {
    if (!cart.length) {
      showToast('Adicione pelo menos 1 item antes de continuar.');
      return false;
    }
    const custName = document.getElementById('cust-name').value.trim();
    if (!custName) {
      showToast('Informe seu nome para identificar o pedido.');
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
    showToast('Pedido registrado e aberto no WhatsApp.');
  }

  function handleGeneratePix() {
    if (!cart.length) {
      showToast('Adicione itens ao pedido para gerar o QR Code Pix.');
      return;
    }
    if (!state.pixKey) {
      showToast('Configure a Chave Pix no Painel do Dono.');
      return;
    }
    const { totals } = getTotalsWithCoupon();
    const code = generatePixBrCode({
      pixKey: state.pixKey,
      merchantName: state.storeName,
      merchantCity: 'Sorocaba',
      amount: totals.total,
    });
    document.getElementById('pix-amount-badge').textContent = formatBrl(totals.total);
    document.getElementById('pix-qr-svg').innerHTML = renderQrSvg(code, 176);
    document.getElementById('pix-code-output').value = code;
    document.getElementById('pix-box').classList.remove('hidden');
    showToast('QR Code Pix gerado offline com sucesso.');
  }

  function handlePrintPdf() {
    if (!validateOrder()) return;
    const payload = getCheckoutPayload();
    const { totals } = buildWhatsAppOrderUrl(payload);
    store.saveLastCart(cart);
    store.recordOrder({
      customerName: payload.customerName,
      channel: 'PDF',
      paymentMethod: payload.paymentMethod,
      itemCount: totals.itemCount,
      total: totals.total,
    });
    renderAdminPanel();
    document.getElementById('print-summary').innerHTML = `
      <hr />
      <h3>${state.storeName}</h3>
      <p><strong>Cliente:</strong> ${payload.customerName} ${payload.customerPhone ? `(${payload.customerPhone})` : ''}</p>
      <p><strong>Modalidade:</strong> ${payload.deliveryMode} ${payload.address ? `— ${payload.address}` : ''}</p>
      <p><strong>Pagamento:</strong> ${payload.paymentMethod}</p>
      ${payload.notes ? `<p><strong>Obs.:</strong> ${payload.notes}</p>` : ''}
      <p><strong>Emitido em:</strong> ${new Date().toLocaleString('pt-BR')}</p>`;
    window.print();
  }

  function buildShareableUrl() {
    const token = encodeStoreConfig(state);
    const url = new URL(window.location.href);
    url.search = `?loja=${token}`;
    return url.toString();
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
    document.getElementById('cfg-whatsapp').value = state.whatsapp || '';
    document.getElementById('cfg-pix').value = state.pixKey || '';
    document.getElementById('cfg-delivery').value = Number(state.deliveryFee || 0);
    document.getElementById('cfg-open').value = state.openHour || '08:00';
    document.getElementById('cfg-close').value = state.closeHour || '22:00';
    document.getElementById('cfg-color').value = state.primaryColor || '#D9480F';

    const shareUrl = buildShareableUrl();
    document.getElementById('store-counter-qr').innerHTML = renderQrSvg(shareUrl, 132);

    const listEl = document.getElementById('admin-items-list');
    listEl.innerHTML = (state.items || []).map(item => `
      <div class="admin-item-row">
        <div>
          <strong>${item.name}</strong> <span class="cart-row-sub">(${item.category}${item.paused ? ' • Pausado' : ''})</span>
        </div>
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
        showToast('Preço atualizado na vitrine.');
      });
    });

    listEl.querySelectorAll('.toggle-pause-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.items = (state.items || []).map(i => i.id === btn.dataset.id ? { ...i, paused: !i.paused } : i);
        store.saveState(state);
        renderAll();
        showToast('Visibilidade do item atualizada.');
      });
    });

    listEl.querySelectorAll('.remove-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.items = (state.items || []).filter(i => i.id !== btn.dataset.id);
        store.saveState(state);
        renderAll();
        showToast('Item removido do catálogo.');
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
      : '<div class="cart-empty">Nenhum pedido ou orçamento registrado localmente ainda.</div>';
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
    const rawSubtotal = cart.reduce((acc, i) => acc + Number(i.qty || 0) * Number(i.price || 0), 0);
    const { applied } = resolveCouponDiscount(rawSubtotal || 100, clean, state.coupons || []);
    if (!applied) {
      showToast('Cupom não encontrado nesta loja.');
      return;
    }
    activeCouponCode = applied.code;
    document.getElementById('coupon-input').value = applied.code;
    renderCart();
    showToast(`Cupom ${applied.code} aplicado ao carrinho.`);
  }

  function bindEvents() {
    document.getElementById('search-input').addEventListener('input', renderCatalog);
    document.getElementById('sort-select').addEventListener('change', (e) => {
      sortMode = e.target.value;
      renderCatalog();
    });

    document.getElementById('hero-coupon-pill').addEventListener('click', (e) => {
      applyCouponCode(e.currentTarget.dataset.code);
    });

    document.getElementById('theme-toggle-btn').addEventListener('click', () => {
      const curr = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = curr === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      window.localStorage.setItem('vitrine_theme', next);
    });

    document.getElementById('apply-coupon-btn').addEventListener('click', () => {
      applyCouponCode(document.getElementById('coupon-input').value);
    });

    document.getElementById('clear-cart-btn').addEventListener('click', () => {
      cart = [];
      renderCatalog();
      renderCart();
      showToast('Carrinho limpo.');
    });

    document.getElementById('repeat-order-btn').addEventListener('click', () => {
      const last = store.loadLastCart();
      if (!last.length) return;
      cart = JSON.parse(JSON.stringify(last));
      renderCatalog();
      renderCart();
      showToast('Último pedido carregado no carrinho.');
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

    document.getElementById('send-wa-btn').addEventListener('click', handleSendWhatsApp);
    document.getElementById('gen-pix-btn').addEventListener('click', handleGeneratePix);
    document.getElementById('print-pdf-btn').addEventListener('click', handlePrintPdf);
    document.getElementById('mobile-cart-bar').addEventListener('click', () => {
      document.getElementById('cart-aside').scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('copy-pix-btn').addEventListener('click', async () => {
      const text = document.getElementById('pix-code-output').value;
      if (navigator.clipboard) await navigator.clipboard.writeText(text);
      showToast('Código Pix copiado para a área de transferência.');
    });

    document.getElementById('copy-store-link-btn').addEventListener('click', async () => {
      const shareUrl = buildShareableUrl();
      if (navigator.clipboard) await navigator.clipboard.writeText(shareUrl);
      showToast('Link compartilhável da sua loja copiado.');
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
      state.whatsapp = document.getElementById('cfg-whatsapp').value.trim();
      state.pixKey = document.getElementById('cfg-pix').value.trim();
      state.deliveryFee = Number(document.getElementById('cfg-delivery').value || 0);
      state.openHour = document.getElementById('cfg-open').value || '08:00';
      state.closeHour = document.getElementById('cfg-close').value || '22:00';
      state.primaryColor = document.getElementById('cfg-color').value;
      store.saveState(state);
      renderAll();
      showToast('Configurações da loja salvas.');
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
      showToast('Novo item adicionado ao catálogo.');
    });

    document.getElementById('export-csv-btn').addEventListener('click', () => {
      const csv = exportOrdersCsv(store.loadHistory());
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `pedidos-${state.id || 'vitrinezap'}.csv`;
      a.click();
      showToast('Planilha CSV exportada.');
    });

    document.getElementById('clear-history-btn').addEventListener('click', () => {
      store.clearHistory();
      renderAdminPanel();
      showToast('Histórico local limpo.');
    });

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
          showToast('Backup JSON importado com sucesso.');
        } catch {
          showToast('Arquivo JSON inválido.');
        }
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
