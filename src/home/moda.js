(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrineHomes = root.VitrineHomes || {};
    root.VitrineHomes.moda = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SIZES_RAIL = ['Todos', 'P', 'M', 'G', 'GG'];

  function renderContext(slotEl, ctx) {
    const activeSize = ctx.modaSizeFilter || 'Todos';
    const rawT = ctx.weatherInfo?.temperature ?? ctx.weatherInfo?.tempC;
    const tVal = rawT != null && Number.isFinite(Number(rawT)) ? Math.round(Number(rawT)) : null;
    const temp = tVal !== null ? `${tVal}°C • ` : '';
    const moodTag = tVal !== null && tVal <= 20
      ? `${temp}Coleção Térmica & Camadas`
      : `${temp}Coleção Tech Respirável`;

    slotEl.classList.remove('hidden');
    slotEl.innerHTML = `
      <div class="container">
        <div class="moda-runway-bar">
          <div class="moda-runway-top">
            <span class="moda-eyebrow">${moodTag}</span>
            <button type="button" id="open-size-guide-btn" class="btn btn-secondary btn-xs">Provador cm</button>
          </div>
          <div class="moda-size-rail" role="radiogroup" aria-label="Meu Tamanho">
            ${SIZES_RAIL.map((sz) => `
              <button type="button" role="radio" aria-checked="${sz === activeSize ? 'true' : 'false'}" class="moda-sz-pill ${sz === activeSize ? 'active' : ''}" data-moda-sz="${sz}">
                ${sz === 'Todos' ? 'Todos' : sz}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    slotEl.querySelector('#open-size-guide-btn').addEventListener('click', ctx.openSizeGuide);
    slotEl.querySelectorAll('[data-moda-sz]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (ctx.onModaSizeChange) ctx.onModaSizeChange(btn.dataset.modaSz);
      });
    });
  }

  function renderCatalog(gridEl, items, ctx) {
    const activeSize = ctx.modaSizeFilter || 'Todos';
    gridEl.className = 'catalog-grid moda-lookbook-grid';
    gridEl.innerHTML = items.map((item) => {
      const sizes = Array.isArray(item.sizes) && item.sizes.length ? item.sizes : ['P', 'M', 'G'];
      const hasMySize = activeSize === 'Todos' || sizes.includes(activeSize);
      const swatches = ctx.getItemSwatches ? ctx.getItemSwatches(item) : [];
      const firstSw = swatches[0];
      const art = !item.photoDataUrl && ctx.renderRichItemArt
        ? ctx.renderRichItemArt('moda', item, { swatchHex: firstSw?.hex })
        : '';
      const dotsHtml = swatches.length
        ? `<div class="moda-dots-preview" aria-hidden="true">${swatches.map((s) => `<span class="moda-dot-static" style="background:${s.hex}"></span>`).join('')}</div>`
        : '';

      return `<article class="moda-look-card ${hasMySize ? '' : 'is-size-out'}" data-open-id="${item.id}">
        <div class="moda-look-art">
          ${item.photoDataUrl ? `<img src="${item.photoDataUrl}" alt="${item.name}" />` : art}
          ${dotsHtml}
        </div>
        <div class="moda-look-body">
          <span class="moda-look-cat">${item.category} • ${hasMySize ? 'Em estoque' : `Sem tam. ${activeSize}`}</span>
          <h3>${item.name}</h3>
          <strong class="moda-price">${ctx.formatBrl(item.price)}</strong>
        </div>
        <button type="button" class="moda-look-cta add-btn" data-id="${item.id}">${activeSize !== 'Todos' && hasMySize ? `Adicionar (${activeSize})` : 'Adicionar'}</button>
      </article>`;
    }).join('');
  }

  return {
    id: 'moda',
    hideDefaultMeta: true,
    hideDefaultFilterBar: true,
    renderContext,
    renderCatalog,
  };
}));
