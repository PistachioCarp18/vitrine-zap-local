(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrineHomes = root.VitrineHomes || {};
    root.VitrineHomes.oficina = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function buildWorkshopBaySvg() {
    return `<svg viewBox="0 0 132 56" width="126" height="54" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="128" height="48" rx="6" fill="#F0F9FF" stroke="#BAE6FD" stroke-width="1.2"/>
      <path d="M20 38h92" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/>
      <path d="M28 34l8-13c2-3 5-5 9-5h34c4 0 7 2 10 5l10 8c3 2 5 4 5 7v2H26v-2c0-1 .8-2 2-2z" fill="#0369A1" opacity="0.18" stroke="#0369A1" stroke-width="1.8"/>
      <path d="M44 20h31l7 8H40l4-8z" fill="#FFFFFF" stroke="#0369A1" stroke-width="1.4"/>
      <circle cx="42" cy="38" r="6.5" fill="#0F172A" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="90" cy="38" r="6.5" fill="#0F172A" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="108" cy="14" r="5" fill="#059669"/>
      <path d="M106 14l1.5 1.5 3-3" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  function renderContext(slotEl, ctx) {
    const vehLabel = ctx.selectedVehicle
      ? `${ctx.selectedVehicle.brand} ${ctx.selectedVehicle.model} ${ctx.selectedVehicle.year || ''}`.trim()
      : 'Chevrolet Onix 1.0 Flex';
    const plateLabel = ctx.selectedPlate || 'MER-4S20';
    const km = Number(ctx.mileageKm || 40000);
    const est = ctx.estimate || { totalMin: 240, totalMax: 390 };
    const milestones = [10000, 40000, 80000, 120000];
    const nearest = milestones.reduce((prev, cur) => (Math.abs(cur - km) < Math.abs(prev - km) ? cur : prev), 40000);

    slotEl.classList.remove('hidden');
    slotEl.innerHTML = `
      <div class="container">
        <div class="ofi-car-card">
          <div class="ofi-car-top">
            <button type="button" id="open-fipe-est-btn" class="ofi-car-trigger">
              <div>
                <span class="ofi-mercosul-plate">BR • ${plateLabel}</span>
                <span class="ofi-car-title">${vehLabel}</span>
                <span class="ofi-car-sub">Trocar modelo FIPE ▾</span>
              </div>
            </button>
            <div class="ofi-bay-scene">${buildWorkshopBaySvg()}</div>
          </div>

          <div class="ofi-timeline-box">
            <div class="ofi-km-header">
              <label for="cockpit-km-slider">Odômetro: <strong id="ofi-km-label">${(km / 1000).toFixed(0)}.000 km</strong></label>
              <span id="cockpit-predict-chip" class="ofi-range-pill">Est. ${ctx.formatBrl(est.totalMin)}–${ctx.formatBrl(est.totalMax)}</span>
            </div>
            <input type="range" id="cockpit-km-slider" class="dvi-km-slider" style="width:100%;margin:2px 0;" min="10000" max="120000" step="10000" value="${km}" aria-label="Linha do tempo de revisões por quilometragem" />
            <div class="ofi-milestones" aria-hidden="true">
              ${milestones.map((m) => `<span class="${m === nearest ? 'active' : ''}">${m / 1000}k</span>`).join('')}
            </div>
          </div>
        </div>

        <div class="ofi-journey-strip" aria-label="Etapas do atendimento">
          <span class="ofi-journey-step is-active">1. Ficha do Carro</span>
          <span class="ofi-journey-step">2. Semáforo DVI</span>
          <span class="ofi-journey-step">3. Orçamento OS</span>
        </div>
      </div>
      <datalist id="fipe-vehicles-list"></datalist>
    `;

    slotEl.querySelector('#open-fipe-est-btn').addEventListener('click', ctx.openFipeModal);
    slotEl.querySelector('#cockpit-km-slider').addEventListener('input', (e) => {
      const nextKm = Number(e.target.value || 40000);
      ctx.onMileageChange(nextKm);
      const kmLab = slotEl.querySelector('#ofi-km-label');
      if (kmLab) kmLab.textContent = `${(nextKm / 1000).toFixed(0)}.000 km`;
      const near = milestones.reduce((prev, cur) => (Math.abs(cur - nextKm) < Math.abs(prev - nextKm) ? cur : prev), 40000);
      slotEl.querySelectorAll('.ofi-milestones span').forEach((sp, i) => {
        sp.classList.toggle('active', milestones[i] === near);
      });
    });
  }

  function renderCatalog(gridEl, items, ctx) {
    gridEl.className = 'catalog-grid ofi-dvi-list';
    const inspMod = ctx.mechanics['inspection-checklist'];
    gridEl.innerHTML = items.map((item) => {
      const sevKey = inspMod ? inspMod.getItemSeverity(item) : 'rotina';
      const sev = inspMod ? inspMod.SEVERITY_MAP[sevKey] : { badgeClass: 'sev-ok', label: 'Rotina' };
      const borderCls = sevKey === 'critico' ? 'is-crit' : (sevKey === 'atencao' ? 'is-warn' : 'is-ok');
      const inCart = ctx.osApprovedMap[item.id] || ctx.hasInCart(item.id);
      const minEst = Math.round(item.price * 0.9);
      const maxEst = Math.round(item.price * 1.15);
      return `<article class="ofi-service-card ${borderCls}" data-open-id="${item.id}">
        <div class="ofi-service-main">
          <div class="ofi-service-meta">
            <span class="ofi-traffic-dot" aria-hidden="true"></span>
            <span class="ofi-sev-label">${sev.label} • ${item.prepTime || '45 min'}</span>
          </div>
          <h3>${item.name}</h3>
          <p class="ofi-service-sub">Faixa est. ${ctx.formatBrl(minEst)}–${ctx.formatBrl(maxEst)} • Garantia 6m</p>
        </div>
        <div class="ofi-service-side">
          <strong class="ofi-price">${ctx.formatBrl(item.price)}</strong>
          <button type="button" class="btn ${inCart ? 'btn-primary' : 'btn-secondary'} btn-sm os-approve-btn" role="switch" aria-checked="${inCart ? 'true' : 'false'}" data-approve-id="${item.id}">
            ${inCart ? '✓ Na OS' : '+ Incluir'}
          </button>
        </div>
      </article>`;
    }).join('');
  }

  return {
    id: 'oficina',
    hideDefaultMeta: true,
    hideDefaultFilterBar: true,
    renderContext,
    renderCatalog,
  };
}));
