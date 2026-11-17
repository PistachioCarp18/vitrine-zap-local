(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrineHomes = root.VitrineHomes || {};
    root.VitrineHomes.padaria = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function buildOvenArtSvg() {
    return `<svg viewBox="0 0 112 56" width="106" height="52" fill="none" aria-hidden="true">
      <rect x="4" y="6" width="104" height="44" rx="8" fill="#3C2D20" stroke="#785A3C" stroke-width="1.4"/>
      <path d="M22 44V28c0-11 9-18 34-18s34 7 34 18v16H22z" fill="#1C140E" stroke="#D97706" stroke-width="1.5"/>
      <path d="M36 42c0-7 8-12 20-12s20 5 20 12H36z" fill="#F59E0B" opacity="0.28"/>
      <ellipse cx="56" cy="39" rx="14" ry="5.5" fill="#D97706"/>
      <path d="M47 37c3-2 7-2 10 0M55 37c2-2 5-2 8 0" stroke="#FFFBEB" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M40 16c-1-3 2-5 1-8M56 14c-1-3 2-5 1-8M72 16c-1-3 2-5 1-8" stroke="#FCD34D" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
  }

  function resolveBatchStatus(demoMode, weatherInfo) {
    const refHour = demoMode ? 14 : new Date().getHours();
    const nextBatch = refHour < 8 ? '08:00' : (refHour < 16 ? '16:00' : 'Amanhã 08:00');
    const rawT = weatherInfo?.temperature ?? weatherInfo?.tempC;
    const tVal = rawT != null && Number.isFinite(Number(rawT)) ? Math.round(Number(rawT)) : null;
    const climateTip = tVal !== null && tVal <= 21
      ? `${tVal}°C • Ideal com pão de queijo + café`
      : 'Fornada artesanal com fermentação natural';
    return { nextBatch, climateTip };
  }

  function renderContext(slotEl, ctx) {
    const mode = ctx.padariaMode || 'agora';
    const { nextBatch, climateTip } = resolveBatchStatus(ctx.demoMode, ctx.weatherInfo);

    slotEl.classList.remove('hidden');
    slotEl.innerHTML = `
      <div class="container">
        <div class="pad-oven-stage">
          <div class="pad-oven-top">
            <div>
              <span class="pad-oven-eyebrow"><span class="pad-steam-dot" aria-hidden="true"></span>Fornada ao vivo • Lote demo</span>
              <h2 class="pad-oven-title">Próxima fornada às ${nextBatch}</h2>
              <div class="pad-oven-sub">${climateTip}</div>
            </div>
            ${buildOvenArtSvg()}
          </div>
          <div class="pad-oven-progress" aria-hidden="true"><div class="pad-oven-fill"></div></div>
          <div class="pad-mode-switch" role="tablist" aria-label="Modo de compra">
            <button type="button" role="tab" aria-selected="${mode === 'agora' ? 'true' : 'false'}" class="pad-mode-btn ${mode === 'agora' ? 'active' : ''}" data-pad-mode="agora">Agora (Balcão)</button>
            <button type="button" role="tab" aria-selected="${mode === 'encomenda' ? 'true' : 'false'}" class="pad-mode-btn ${mode === 'encomenda' ? 'active' : ''}" data-pad-mode="encomenda">Encomenda (Data)</button>
          </div>
        </div>
      </div>
    `;

    slotEl.querySelectorAll('[data-pad-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (ctx.onPadariaModeChange) ctx.onPadariaModeChange(btn.dataset.padMode);
      });
    });
  }

  function renderCatalog(gridEl, items, ctx) {
    const mode = ctx.padariaMode || 'agora';
    const filtered = mode === 'encomenda'
      ? items.filter((i) => /bolo|cesta|torta|encomenda|festa/i.test(`${i.name} ${i.category} ${i.yieldLabel || ''}`))
      : items;
    const list = filtered.length ? filtered : items;

    gridEl.className = 'catalog-grid pad-lousa-list';
    gridEl.innerHTML = list.map((item) => `
      <article class="pad-lousa-row" data-open-id="${item.id}">
        <div class="pad-lousa-info">
          <span class="pad-lousa-tag">${mode === 'encomenda' ? 'Sob encomenda • Sinal 50%' : (item.badge || 'Balcão hoje')}</span>
          <h3>${item.name}</h3>
          <div class="pad-lousa-yield">${item.yieldLabel || item.category} • ${item.prepTime || 'Fornada do dia'}</div>
        </div>
        <div class="pad-lousa-cta">
          <strong class="pad-price">${ctx.formatBrl(item.price)}</strong>
          <button type="button" class="btn btn-primary btn-sm add-btn" data-id="${item.id}">${mode === 'encomenda' ? 'Agendar' : '+'}</button>
        </div>
      </article>
    `).join('');
  }

  return {
    id: 'padaria',
    hideDefaultMeta: true,
    hideDefaultFilterBar: true,
    resolveBatchStatus,
    renderContext,
    renderCatalog,
  };
}));
