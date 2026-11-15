(function () {
  'use strict';

  const { generatePixBrCode, calculateCartTotals, formatBrl, buildWhatsAppOrderUrl } = window.VitrineIntegrations;
  const { renderQrSvg } = window.VitrineQrCode;
  const { createStore, encodeStoreConfig, decodeStoreConfig } = window.VitrineStore;
  const { NICHE_PRESETS } = window.VitrinePresets;

  const store = createStore(window.localStorage);
  let state = loadInitialState();
  let cart = [];
  let activeCategory = 'Todos';
  let deliveryMode = 'Retirada';
  let paymentMethod = 'Pix';

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

  function getCategoryIconSvg() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';
  }

  function applyTheme() {
    document.documentElement.style.setProperty('--brand-primary', state.primaryColor || '#0F766E');
    document.getElementById('store-title').textContent = state.storeName;
    document.getElementById('topbar-store-name').textContent = state.storeName;
    document.getElementById('store-tagline').textContent = state.tagline || '';
    document.getElementById('store-neighborhood').textContent = state.neighborhood || 'Sorocaba-SP';
    document.getElementById('cart-title').textContent = state.mode === 'orcamento' ? 'Orçamento / OS' : 'Seu Pedido';
    document.getElementById('hero-delivery-fee').textContent = Number(state.deliveryFee || 0) > 0 ? formatBrl(state.deliveryFee) : 'Grátis / Retirada';
    document.getElementById('hero-item-count').textContent = `${(state.items || []).length} itens`;

    const banner = document.getElementById('pitch-banner');
    const bannerText = document.getElementById('pitch-banner-text');
    if (state.pitchTip) {
      bannerText.textContent = state.pitchTip;
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
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
      store.saveState(state);
      renderAll();
      showToast(`Vitrine alterada para ${preset.label}`);
    });
  }

  function renderCategories() {
    const cats = ['Todos', ...new Set((state.items || []).map(i => i.category))];
    const wrap = document.getElementById('category-pills');
    wrap.innerHTML = cats.map(c =>
      `<button type="button" class="pill-btn ${c === activeCategory ? 'active' : ''}" data-cat="${c}">${c}</button>`
    ).join('');
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
      const item = (state.items || []).find(i => i.id === itemId);
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
    const list = (state.items || []).filter(item => {
      const matchCat = activeCategory === 'Todos' || item.category === activeCategory;
      const matchText = !q || item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      return matchCat && matchText;
    });

    const grid = document.getElementById('catalog-grid');
    if (!list.length) {
      grid.innerHTML = '<div class="card">Nenhum produto ou serviço encontrado para essa busca.</div>';
      return;
    }

    grid.innerHTML = list.map(item => {
      const inCart = cart.find(c => c.id === item.id);
      const actionHtml = inCart
        ? `<div class="qty-inline">
             <button type="button" class="card-dec-btn" data-id="${item.id}" aria-label="Remover 1">-</button>
             <span>${inCart.qty}</span>
             <button type="button" class="card-inc-btn" data-id="${item.id}" aria-label="Adicionar 1">+</button>
           </div>`
        : `<button type="button" class="btn btn-primary btn-sm add-btn" data-id="${item.id}">Adicionar</button>`;

      return `
        <article class="item-card">
          <div class="item-visual">
            <span class="item-cat-tag">${getCategoryIconSvg()}<span>${item.category}</span></span>
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

  function renderCart() {
    const wrap = document.getElementById('cart-items');
    const fee = deliveryMode === 'Entrega' ? Number(state.deliveryFee || 0) : 0;
    const totals = calculateCartTotals(cart, fee);

    document.getElementById('cart-badge-count').textContent = String(totals.itemCount);
    document.getElementById('subtotal-val').textContent = formatBrl(totals.subtotal);
    document.getElementById('delivery-val').textContent = formatBrl(totals.deliveryFee);
    document.getElementById('total-val').textContent = formatBrl(totals.total);
    document.getElementById('delivery-row').classList.toggle('hidden', fee === 0);

    const mobileBar = document.getElementById('mobile-cart-bar');
    if (totals.itemCount > 0) {
      mobileBar.classList.remove('hidden');
      document.getElementById('mobile-cart-label').textContent = `Ver Pedido (${totals.itemCount} ${totals.itemCount === 1 ? 'item' : 'itens'})`;
      document.getElementById('mobile-cart-total').textContent = formatBrl(totals.total);
    } else {
      mobileBar.classList.add('hidden');
    }

    if (!cart.length) {
      wrap.innerHTML = '<div class="cart-empty">Selecione itens no catálogo para montar seu pedido ou orçamento.</div>';
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
    return {
      storeName: state.storeName,
      storeWhatsapp: state.whatsapp,
      customerName: document.getElementById('cust-name').value.trim(),
      customerPhone: document.getElementById('cust-phone').value.trim(),
      deliveryMode,
      address: document.getElementById('cust-address').value.trim(),
      paymentMethod,
      notes: document.getElementById('cust-notes').value.trim(),
      deliveryFee: deliveryMode === 'Entrega' ? Number(state.deliveryFee || 0) : 0,
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
    return true;
  }

  function handleSendWhatsApp() {
    if (!validateOrder()) return;
    const payload = getCheckoutPayload();
    const { url, totals } = buildWhatsAppOrderUrl(payload);
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
    const fee = deliveryMode === 'Entrega' ? Number(state.deliveryFee || 0) : 0;
    const { total } = calculateCartTotals(cart, fee);
    const code = generatePixBrCode({
      pixKey: state.pixKey,
      merchantName: state.storeName,
      merchantCity: 'Sorocaba',
      amount: total,
    });
    document.getElementById('pix-amount-badge').textContent = formatBrl(total);
    document.getElementById('pix-qr-svg').innerHTML = renderQrSvg(code, 176);
    document.getElementById('pix-code-output').value = code;
    document.getElementById('pix-box').classList.remove('hidden');
    showToast('QR Code Pix gerado offline com sucesso.');
  }

  function handlePrintPdf() {
    if (!validateOrder()) return;
    const payload = getCheckoutPayload();
    const { totals } = buildWhatsAppOrderUrl(payload);
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
    document.getElementById('cfg-color').value = state.primaryColor || '#0F766E';

    const shareUrl = buildShareableUrl();
    document.getElementById('store-counter-qr').innerHTML = renderQrSvg(shareUrl, 132);

    const listEl = document.getElementById('admin-items-list');
    listEl.innerHTML = (state.items || []).map(item => `
      <div class="admin-item-row">
        <div>
          <strong>${item.name}</strong> <span class="cart-row-sub">(${item.category})</span>
          <div class="cart-row-sub mono">${formatBrl(item.price)}</div>
        </div>
        <button type="button" class="btn btn-secondary btn-sm remove-item-btn" data-id="${item.id}">Remover</button>
      </div>`).join('');

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

  function bindEvents() {
    document.getElementById('search-input').addEventListener('input', renderCatalog);

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
      };
      state.items = [...(state.items || []), newItem];
      store.saveState(state);
      e.target.reset();
      renderAll();
      showToast('Novo item adicionado ao catálogo.');
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

  initSwitcher();
  bindEvents();
  renderAll();
})();
