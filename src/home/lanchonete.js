(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrineHomes = root.VitrineHomes || {};
    root.VitrineHomes.lanchonete = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function renderContext(slotEl, ctx) {
    const cats = [...new Set((ctx.items || []).map((i) => i.category).filter(Boolean))].slice(0, 3);
    const activeSec = ctx.activeSpySec || cats[0] || '';
    const comboItem = (ctx.items || []).find((i) => /combo|duplo/i.test(i.name)) || (ctx.items || [])[0];
    const freeThreshold = Number(ctx.state.freeDeliveryThreshold || 45);

    slotEl.classList.remove('hidden');
    slotEl.innerHTML = `
      <div class="container">
        <div class="lanch-combo-hero">
          <div>
            <div class="lanch-combo-eyebrow">Frete grátis acima de ${ctx.formatBrl(freeThreshold)}</div>
            <h2>Monte seu Combo em 1 Toque</h2>
            <div class="lanch-combo-sub">${comboItem ? `${comboItem.name} • 25–35 min` : 'Preparo na chapa na hora'}</div>
          </div>
          ${comboItem ? `<button type="button" id="lanch-hero-combo-btn" class="lanch-combo-btn">+ ${ctx.formatBrl(comboItem.price)}</button>` : ''}
        </div>
        <div class="lanch-scrollspy-rail" role="navigation" aria-label="Seções do cardápio">
          ${cats.map((c) => `<button type="button" class="lanch-spy-pill ${c === activeSec ? 'active' : ''}" data-spy-target="${c}">${c}</button>`).join('')}
        </div>
      </div>
    `;

    const comboBtn = slotEl.querySelector('#lanch-hero-combo-btn');
    if (comboBtn && comboItem && ctx.onQuickAddCombo) {
      comboBtn.addEventListener('click', () => ctx.onQuickAddCombo(comboItem));
    }
    slotEl.querySelectorAll('[data-spy-target]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (ctx.onScrollSpySelect) ctx.onScrollSpySelect(btn.dataset.spyTarget);
      });
    });
  }

  function renderCatalog(gridEl, items, ctx) {
    const grouped = [];
    const seenCat = new Map();
    for (const item of items) {
      const cat = item.category || 'Cardápio';
      if (!seenCat.has(cat)) {
        const entry = { cat, list: [] };
        seenCat.set(cat, entry);
        grouped.push(entry);
      }
      seenCat.get(cat).list.push(item);
    }

    gridEl.className = 'catalog-grid lanch-stream-grid';
    gridEl.innerHTML = grouped.map((g) => `
      <div class="lanch-sec-title" data-sec-heading="${g.cat}">${g.cat}</div>
      ${g.list.map((item) => {
        const art = !item.photoDataUrl && ctx.renderRichItemArt ? ctx.renderRichItemArt('lanchonete', item) : '';
        return `<article class="lanch-card" data-open-id="${item.id}">
          <div class="food-card-info">
            ${item.badge ? `<span class="food-badge">${item.badge}</span>` : ''}
            <h3>${item.name}</h3>
            <p class="food-desc">${item.description || ''}</p>
            <strong class="lanch-price">${ctx.formatBrl(item.price)}</strong>
          </div>
          <div class="lanch-thumb-box">
            ${item.photoDataUrl ? `<img src="${item.photoDataUrl}" alt="${item.name}" />` : art}
            <div class="food-add-overlay">
              <button type="button" class="mini-add-btn add-btn" data-id="${item.id}" aria-label="Adicionar ${item.name}">+</button>
            </div>
          </div>
        </article>`;
      }).join('')}
    `).join('');
  }

  return {
    id: 'lanchonete',
    hideDefaultMeta: true,
    hideDefaultFilterBar: true,
    renderContext,
    renderCatalog,
  };
}));
