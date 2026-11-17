(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrineHomes = root.VitrineHomes || {};
    root.VitrineHomes.petshop = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function buildPetMascotSvg() {
    return `<svg viewBox="0 0 92 56" width="88" height="52" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="88" height="48" rx="16" fill="#ECFDF6" stroke="#99F6E4" stroke-width="1.4"/>
      <ellipse cx="46" cy="31" rx="17" ry="14" fill="#0F766E" opacity="0.16" stroke="#0F766E" stroke-width="1.6"/>
      <path d="M30 23c-4 0-7 5-5 11M62 23c4 0 7 5 5 11" stroke="#0F766E" stroke-width="3" stroke-linecap="round"/>
      <circle cx="40" cy="28" r="2.2" fill="#0F2E28"/>
      <circle cx="52" cy="28" r="2.2" fill="#0F2E28"/>
      <ellipse cx="46" cy="34" rx="3" ry="2.2" fill="#0F766E"/>
      <path d="M43 38c2 2 4 2 6 0" stroke="#0F2E28" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
  }

  function renderContext(slotEl, ctx) {
    const profile = ctx.petProfile || { petSize: 'Médio', petName: '', petBreed: '' };
    const size = profile.petSize || 'Médio';
    const petMod = ctx.mechanics['autoship-reminder'];
    const days15 = petMod ? petMod.calculateFoodDurationDays(15, size) : (size === 'Grande' ? 38 : (size === 'Pequeno' ? 120 : 60));
    const titleLabel = profile.petName
      ? `${profile.petName}${profile.petBreed ? ` (${profile.petBreed})` : ''}`
      : `Meu Pet • Porte ${size}`;

    slotEl.classList.remove('hidden');
    slotEl.innerHTML = `
      <div class="container">
        <div class="pet-passport-card">
          <div class="pet-passport-top">
            <div>
              <div class="pet-passport-eyebrow">Carteirinha do Pet</div>
              <h2>${titleLabel}</h2>
              <span class="pet-supply-forecast">Saco 15kg dura ~${days15} dias</span>
            </div>
            ${buildPetMascotSvg()}
          </div>
          <div class="pet-controls-row">
            <div class="pet-porte-group" role="radiogroup" aria-label="Porte do Pet">
              <button type="button" role="radio" aria-checked="${size === 'Pequeno' ? 'true' : 'false'}" class="pet-porte-btn ${size === 'Pequeno' ? 'active' : ''}" data-pet-size="Pequeno">P</button>
              <button type="button" role="radio" aria-checked="${size === 'Médio' ? 'true' : 'false'}" class="pet-porte-btn ${size === 'Médio' ? 'active' : ''}" data-pet-size="Médio">M</button>
              <button type="button" role="radio" aria-checked="${size === 'Grande' ? 'true' : 'false'}" class="pet-porte-btn ${size === 'Grande' ? 'active' : ''}" data-pet-size="Grande">G</button>
            </div>
            <button type="button" id="pet-club-toggle" role="switch" aria-checked="${ctx.petClubActive ? 'true' : 'false'}" class="pet-club-switch ${ctx.petClubActive ? 'active' : ''}">
              Clube -10% ${ctx.petClubActive ? '✓' : ''}
            </button>
            <button type="button" id="pet-grooming-btn" class="pet-club-switch" style="border-style:dashed;">
              ${ctx.petGroomingOnly ? 'Ver Tudo' : 'Banho & Tosa'}
            </button>
          </div>
        </div>
      </div>
    `;

    slotEl.querySelectorAll('[data-pet-size]').forEach((btn) => {
      btn.addEventListener('click', () => ctx.onPetSizeChange(btn.dataset.petSize));
    });
    slotEl.querySelector('#pet-club-toggle').addEventListener('click', ctx.onTogglePetClub);
    slotEl.querySelector('#pet-grooming-btn').addEventListener('click', ctx.onTogglePetGrooming);
  }

  function renderCatalog(gridEl, items, ctx) {
    const profile = ctx.petProfile || { petSize: 'Médio' };
    const size = profile.petSize || 'Médio';
    const petMod = ctx.mechanics['autoship-reminder'];
    const filtered = ctx.petGroomingOnly
      ? items.filter((i) => /banho|tosa|higiene|spa/i.test(`${i.name} ${i.category}`))
      : items;
    const list = filtered.length ? filtered : items;

    gridEl.className = 'catalog-grid pet-club-grid';
    gridEl.innerHTML = list.map((item) => {
      const packs = Array.isArray(item.packOptions) ? item.packOptions : [];
      const pIdx = ctx.selectedPackIdxMap[item.id] ?? item.defaultPackIdx ?? 0;
      const activePack = packs[pIdx] || null;
      const rawPrice = activePack ? activePack.price : item.price;
      const dispPrice = ctx.petClubActive ? Number((rawPrice * 0.9).toFixed(2)) : rawPrice;
      const kg = activePack && petMod ? petMod.extractKgFromLabel(activePack.label) : null;
      const days = kg && petMod ? petMod.calculateFoodDurationDays(kg, size) : null;
      const badge = days ? `${activePack.label} • Dura ~${days}d (${size})` : (item.cycleLabel || item.category);

      return `<article class="pet-club-card" data-open-id="${item.id}">
        <div class="pet-club-main">
          <span class="pet-duration-pill">${badge}</span>
          <h3>${item.name}</h3>
          <div class="pet-club-sub">${item.description || ''}</div>
        </div>
        <div class="pet-club-action">
          <strong class="pet-price">${ctx.formatBrl(dispPrice)}</strong>
          <button type="button" class="btn btn-primary btn-sm add-btn" data-id="${item.id}">+ Selecionar</button>
        </div>
      </article>`;
    }).join('');
  }

  return {
    id: 'petshop',
    hideDefaultMeta: true,
    hideDefaultFilterBar: true,
    renderContext,
    renderCatalog,
  };
}));
