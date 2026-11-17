(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrineHomes = root.VitrineHomes || {};
    root.VitrineHomes.floricultura = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const OCCASIONS = ['Todas', 'Romântico', 'Aniversário', 'Agradecimento'];

  function computeFloralCutoffStatus(demoMode = true, now = new Date()) {
    const h = demoMode ? 11 : now.getHours();
    const canSameDay = h < 15;
    const cutoffText = canSameDay
      ? `Peça até 15h p/ entregar hoje (faltam ${15 - h}h)`
      : 'Próxima entrega: Amanhã manhã';
    return { canSameDay, cutoffText };
  }

  function renderContext(slotEl, ctx) {
    const activeOcc = ctx.activeOccasion || 'Todas';
    const { cutoffText } = computeFloralCutoffStatus(ctx.demoMode);
    const holidayLabel = ctx.holidayInfo?.nextHoliday
      ? `Próx. data: ${ctx.holidayInfo.nextHoliday.name}`
      : 'Cartão impresso grátis';

    slotEl.classList.remove('hidden');
    slotEl.innerHTML = `
      <div class="container">
        <div class="flo-concierge">
          <div class="flo-cutoff-row">
            <span class="flo-cutoff-pill">${cutoffText}</span>
            <span>${holidayLabel}</span>
          </div>
          <h2>Para quem? Para qual ocasião?</h2>
          <div class="flo-occasions-row" role="tablist" aria-label="Filtrar arranjos por ocasião">
            ${OCCASIONS.map((occ) => `
              <button type="button" role="tab" aria-selected="${occ === activeOcc ? 'true' : 'false'}" class="flo-occ-btn ${occ === activeOcc ? 'active' : ''}" data-occ="${occ}">
                ${occ === 'Agradecimento' ? 'Gratidão' : occ}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    slotEl.querySelectorAll('[data-occ]').forEach((btn) => {
      btn.addEventListener('click', () => ctx.onOccasionChange(btn.dataset.occ));
    });
  }

  function renderCatalog(gridEl, items, ctx) {
    gridEl.className = 'catalog-grid flo-gallery-grid';
    gridEl.innerHTML = items.map((item, idx) => {
      const isHero = idx === 0;
      const art = !item.photoDataUrl && ctx.renderRichItemArt ? ctx.renderRichItemArt('floricultura', item) : '';
      return `<article class="flo-card ${isHero ? 'is-hero' : ''}" data-open-id="${item.id}">
        <div class="flo-art-stage">
          ${item.photoDataUrl ? `<img src="${item.photoDataUrl}" alt="${item.name}" />` : art}
        </div>
        <div class="flo-body">
          <div>
            <span class="flo-kicker">${item.yieldLabel || item.category}</span>
            <h3>${item.name}</h3>
          </div>
          <div class="flo-foot">
            <strong class="flo-price">${ctx.formatBrl(item.price)}</strong>
            <button type="button" class="btn btn-primary btn-xs add-btn" data-id="${item.id}">${isHero ? 'Presentear' : '+'}</button>
          </div>
        </div>
      </article>`;
    }).join('');
  }

  return {
    id: 'floricultura',
    hideDefaultMeta: true,
    hideDefaultFilterBar: true,
    computeFloralCutoffStatus,
    renderContext,
    renderCatalog,
  };
}));
