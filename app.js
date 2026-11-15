(function () {
  'use strict';

  const { generatePixBrCode, calculateCartTotals, formatBrl, buildWhatsAppOrderUrl } = window.VitrineIntegrations;
  const { renderQrSvg } = window.VitrineQrCode;
  const { createStore } = window.VitrineStore;
  const { NICHE_PRESETS } = window.VitrinePresets;

  const store = createStore(window.localStorage);
  let state = store.loadState(NICHE_PRESETS.lanchonete);
  let cart = [];
  let activeCategory = 'Todos';

  function showToast(msg) {
    const wrap = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function applyTheme() {
    document.documentElement.style.setProperty('--brand-primary', state.primaryColor || '#0F766E');
    document.getElementById('store-title').textContent = state.storeName;
    document.getElementById('store-tagline').textContent = state.tagline || '';
    document.getElementById('store-neighborhood').textContent = state.neighborhood || 'Sorocaba-SP';
    document.getElementById('cart-title').textContent = state.mode === 'orcamento' ? '📋 Orçamento / OS' : '🛒 Seu Pedido';
    const banner = document.getElementById('pitch-banner');
    if (state.pitchTip) {
      banner.textContent = '💡 Dica de Demonstração: ' + state.pitchTip;
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
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
      store.saveState(state);
      renderAll();
      showToast(`Modo demonstração: ${preset.label}`);
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

  function renderCatalog() {
    const q = (document.getElementById('search-input').value || '').toLowerCase();
    const list = (state.items || []).filter(item => {
      const matchCat = activeCategory === 'Todos' || item.category === activeCategory;
      const matchText = !q || item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q);
      return matchCat && matchText;
    });

    const grid = document.getElementById('catalog-grid');
    if (!list.length) {
      grid.innerHTML = '<div class="card">Nenhum item encontrado.</div>';
      return;
    }
    grid.innerHTML = list.map(item => `
      <article class="item-card">
        <div>
          <div class="item-top-row">
            <span class="item-cat">${item.category}</span>
            ${item.badge ? `<span class="item-badge">${item.badge}</span>` : ''}
          </div>
          <h3>${item.name}</h3>
          <p class="item-desc">${item.description || ''}</p>
        </div>
        <div class="item-footer">
          <span class="item-price">${formatBrl(item.price)}</span>
          <button type="button" class="btn btn-primary btn-sm add-btn" data-id="${item.id}">+ Adicionar</button>
        </div>
      </article>
    `).join('');

    grid.querySelectorAll('.add-btn').forEach(btn => {
      btn.addEventListener('click', () => addToCart(btn.dataset.id));
    });
  }

  function addToCart(id) {
    const item = state.items.find(i => i.id === id);
    if (!item) return;
    const existing = cart.find(c => c.id === id);
    if (existing) existing.qty += 1;
    else cart.push({ ...item, qty: 1 });
    renderCart();
    showToast(`${item.name} adicionado!`);
  }

  function updateQty(id, delta) {
    const idx = cart.findIndex(c => c.id === id);
    if (idx === -1) return;
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    renderCart();
  }

  function renderCart() {
    const wrap = document.getElementById('cart-items');
    if (!cart.length) {
      wrap.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;">Adicione itens do catálogo ao lado.</p>';
    } else {
      wrap.innerHTML = cart.map(c => `
        <div class="cart-row">
          <div>
            <strong>${c.name}</strong><br />
            <small>${formatBrl(c.price)} un.</small>
          </div>
          <div class="qty-controls">
            <button type="button" class="qty-btn" data-id="${c.id}" data-d="-1">-</button>
            <span>${c.qty}</span>
            <button type="button" class="qty-btn" data-id="${c.id}" data-d="1">+</button>
          </div>
        </div>
      `).join('');
      wrap.querySelectorAll('.qty-btn').forEach(b => {
        b.addEventListener('click', () => updateQty(b.dataset.id, Number(b.dataset.d)));
      });
    }

    const mode = document.getElementById('delivery-mode').value;
    const fee = mode === 'Entrega' ? Number(state.deliveryFee || 0) : 0;
    const totals = calculateCartTotals(cart, fee);
    document.getElementById('subtotal-val').textContent = formatBrl(totals.subtotal);
    document.getElementById('delivery-val').textContent = formatBrl(totals.deliveryFee);
    document.getElementById('total-val').textContent = formatBrl(totals.total);
    document.getElementById('delivery-row').classList.toggle('hidden', mode !== 'Entrega');

    const mobileBar = document.getElementById('mobile-cart-bar');
    mobileBar.classList.toggle('hidden', totals.itemCount === 0);
    document.getElementById('mobile-cart-label').textContent =
      `${state.mode === 'orcamento' ? 'Ver Orçamento' : 'Ver Pedido'} (${totals.itemCount})`;
    document.getElementById('mobile-cart-total').textContent = formatBrl(totals.total);
  }

  function renderAdmin() {
    document.getElementById('cfg-name').value = state.storeName || '';
    document.getElementById('cfg-neighborhood').value = state.neighborhood || '';
    document.getElementById('cfg-whatsapp').value = state.whatsapp || '';
    document.getElementById('cfg-pix').value = state.pixKey || '';
    document.getElementById('cfg-delivery').value = state.deliveryFee || 0;
    document.getElementById('cfg-color').value = state.primaryColor || '#0F766E';

    const list = document.getElementById('admin-items-list');
    list.innerHTML = (state.items || []).map(i => `
      <div class="admin-item-row">
        <span><strong>[${i.category}]</strong> ${i.name} — ${formatBrl(i.price)}</span>
        <button type="button" class="btn btn-outline btn-sm del-item-btn" data-id="${i.id}">Remover</button>
      </div>
    `).join('');
    list.querySelectorAll('.del-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.items = state.items.filter(x => x.id !== btn.dataset.id);
        store.saveState(state);
        renderAll();
        renderAdmin();
        showToast('Item removido do catálogo.');
      });
    });

    const summary = store.getDailySummary();
    document.getElementById('stat-today-count').textContent = summary.count;
    document.getElementById('stat-today-total').textContent = formatBrl(summary.totalRevenue);

    const hist = store.loadHistory();
    const histWrap = document.getElementById('order-history-list');
    histWrap.innerHTML = hist.length
      ? hist.slice(0, 15).map(h => `
          <div class="admin-item-row">
            <span><strong>${h.id}</strong> · ${h.customerName || 'Cliente'} (${h.channel})</span>
            <strong>${formatBrl(h.total)}</strong>
          </div>
        `).join('')
      : '<p style="color:var(--text-muted);font-size:0.88rem;">Nenhum pedido/orçamento registrado ainda hoje.</p>';
  }

  function bindEvents() {
    document.getElementById('search-input').addEventListener('input', renderCatalog);

    document.getElementById('mobile-cart-bar').addEventListener('click', () => {
      document.getElementById('cart-aside').scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('delivery-mode').addEventListener('change', (e) => {
      document.getElementById('address-wrap').classList.toggle('hidden', e.target.value !== 'Entrega');
      renderCart();
    });

    document.getElementById('send-wa-btn').addEventListener('click', () => {
      if (!cart.length) return showToast('Adicione pelo menos 1 item antes de enviar.');
      const customerName = document.getElementById('cust-name').value;
      const res = buildWhatsAppOrderUrl({
        storeName: state.storeName,
        storeWhatsapp: state.whatsapp,
        customerName,
        customerPhone: document.getElementById('cust-phone').value,
        deliveryMode: document.getElementById('delivery-mode').value,
        address: document.getElementById('cust-address').value,
        notes: document.getElementById('cust-notes').value,
        paymentMethod: document.getElementById('payment-method').value,
        deliveryFee: state.deliveryFee,
        items: cart,
        mode: state.mode,
      });
      store.recordOrder({
        storeName: state.storeName,
        customerName,
        channel: 'WhatsApp',
        total: res.totals.total,
        itemsCount: res.totals.itemCount,
      });
      window.open(res.url, '_blank', 'noopener');
      showToast('Pedido registrado e aberto no WhatsApp!');
    });

    document.getElementById('gen-pix-btn').addEventListener('click', () => {
      if (!cart.length) return showToast('Adicione pelo menos 1 item para gerar o Pix.');
      if (!state.pixKey) return showToast('Configure a Chave Pix no Painel do Dono.');
      const mode = document.getElementById('delivery-mode').value;
      const totals = calculateCartTotals(cart, mode === 'Entrega' ? state.deliveryFee : 0);
      const brCode = generatePixBrCode({
        pixKey: state.pixKey,
        merchantName: state.storeName,
        merchantCity: 'Sorocaba',
        amount: totals.total,
      });
      document.getElementById('pix-qr-svg').innerHTML = renderQrSvg(brCode, 176);
      document.getElementById('pix-code-output').value = brCode;
      document.getElementById('pix-box').classList.remove('hidden');
      showToast('QR Code Pix gerado offline!');
    });

    document.getElementById('copy-pix-btn').addEventListener('click', async () => {
      const val = document.getElementById('pix-code-output').value;
      try {
        await navigator.clipboard.writeText(val);
        showToast('Código Pix copiado para a área de transferência!');
      } catch {
        showToast('Selecione e copie o código Pix acima.');
      }
    });

    document.getElementById('print-pdf-btn').addEventListener('click', () => {
      if (!cart.length) return showToast('Adicione itens para gerar o PDF.');
      const customer = document.getElementById('cust-name').value || 'Cliente';
      const notes = document.getElementById('cust-notes').value || '-';
      const mode = document.getElementById('delivery-mode').value;
      const totals = calculateCartTotals(cart, mode === 'Entrega' ? state.deliveryFee : 0);
      store.recordOrder({
        storeName: state.storeName,
        customerName: customer,
        channel: 'PDF',
        total: totals.total,
        itemsCount: totals.itemCount,
      });
      document.getElementById('print-summary').innerHTML = `
        <strong>${state.storeName}</strong> (${state.neighborhood})<br />
        <strong>Cliente:</strong> ${customer} · <strong>WhatsApp Loja:</strong> ${state.whatsapp}<br />
        <strong>Observações:</strong> ${notes}<br />
        <small>Emitido em ${new Date().toLocaleString('pt-BR')} via VitrineZap Local</small>
      `;
      window.print();
    });

    document.getElementById('toggle-admin-btn').addEventListener('click', () => {
      document.getElementById('catalog-section').classList.add('hidden');
      document.getElementById('admin-section').classList.remove('hidden');
      renderAdmin();
    });

    document.getElementById('close-admin-btn').addEventListener('click', () => {
      document.getElementById('admin-section').classList.add('hidden');
      document.getElementById('catalog-section').classList.remove('hidden');
    });

    document.getElementById('store-config-form').addEventListener('submit', (e) => {
      e.preventDefault();
      state.storeName = document.getElementById('cfg-name').value;
      state.neighborhood = document.getElementById('cfg-neighborhood').value;
      state.whatsapp = document.getElementById('cfg-whatsapp').value;
      state.pixKey = document.getElementById('cfg-pix').value;
      state.deliveryFee = Number(document.getElementById('cfg-delivery').value || 0);
      state.primaryColor = document.getElementById('cfg-color').value;
      store.saveState(state);
      renderAll();
      showToast('Configurações da loja salvas!');
    });

    document.getElementById('add-item-form').addEventListener('submit', (e) => {
      e.preventDefault();
      state.items.push({
        id: 'item_' + Date.now(),
        category: document.getElementById('item-category').value.trim(),
        name: document.getElementById('item-name').value.trim(),
        price: Number(document.getElementById('item-price').value || 0),
        badge: document.getElementById('item-badge').value.trim(),
        description: document.getElementById('item-desc').value.trim(),
      });
      store.saveState(state);
      e.target.reset();
      renderAll();
      renderAdmin();
      showToast('Novo item adicionado ao catálogo!');
    });

    document.getElementById('clear-history-btn').addEventListener('click', () => {
      store.clearHistory();
      renderAdmin();
      showToast('Histórico local limpo.');
    });

    document.getElementById('export-json-btn').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vitrine-${(state.id || 'loja')}.json`;
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
          renderAdmin();
          showToast('Catálogo importado com sucesso!');
        } catch { showToast('Arquivo JSON inválido.'); }
      };
      reader.readAsText(file);
    });
  }

  function renderAll() {
    applyTheme();
    renderCategories();
    renderCatalog();
    renderCart();
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  initSwitcher();
  bindEvents();
  renderAll();
})();
