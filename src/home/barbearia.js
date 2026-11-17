(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrineHomes = root.VitrineHomes || {};
    root.VitrineHomes.barbearia = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEFAULT_SCHEDULE = ['09:30', '11:00', '14:30', '15:30', '17:00', '18:30', '19:30'];

  function computeFilteredSlots({ dayIso, todayIso, openHour = '09:00', closeHour = '20:00', nowMinutes = 630, barber = 'Todos', holidayDates = [] }) {
    if (Array.isArray(holidayDates) && holidayDates.includes(dayIso)) {
      return [];
    }
    const [oh, om] = String(openHour).split(':').map(Number);
    const [ch, cm] = String(closeHour).split(':').map(Number);
    const openMin = (oh || 9) * 60 + (om || 0);
    const closeMin = (ch || 20) * 60 + (cm || 0);
    const seed = String(dayIso || '').split('-').reduce((a, b) => a + Number(b || 0), 0) + String(barber || '').length;

    const free = DEFAULT_SCHEDULE.filter((slot, idx) => {
      const [h, m] = slot.split(':').map(Number);
      const mins = h * 60 + m;
      if (mins < openMin || mins >= closeMin) return false;
      if (dayIso === todayIso && mins <= nowMinutes) return false;
      // Ocupacao deterministica realista (~20% dos horarios ocupados variando por dia/barbeiro)
      return ((idx + seed) % 5) !== 1;
    });
    return free.slice(0, 4);
  }

  function renderContext(slotEl, ctx) {
    const spMod = ctx.mechanics['slot-picker'];
    const baseClock = ctx.demoMode ? new Date('2026-11-16T10:30:00') : new Date();
    const days = spMod ? spMod.getUpcomingDays(4, new Date()) : [{ iso: ctx.selectedDayIso, label: 'Hoje' }];
    const todayIso = days[0]?.iso || ctx.selectedDayIso;
    const activeDay = days.some((d) => d.iso === ctx.selectedDayIso) ? ctx.selectedDayIso : todayIso;
    const barbers = ['Todos', ...new Set((ctx.items || []).flatMap((i) => String(i.barber || '').split('/').map((s) => s.trim())).filter(Boolean))];
    const holidayDates = (ctx.holidayInfo?.upcoming || []).map((h) => h.date).filter(Boolean);

    const slots = computeFilteredSlots({
      dayIso: activeDay,
      todayIso,
      openHour: ctx.state.openHour || '09:00',
      closeHour: ctx.state.closeHour || '20:00',
      nowMinutes: baseClock.getHours() * 60 + baseClock.getMinutes(),
      barber: ctx.selectedBarber,
      holidayDates,
    });
    const chosenSlot = slots.includes(ctx.globalSelectedSlot) ? ctx.globalSelectedSlot : (slots[0] || '');
    ctx.setGlobalSlot(chosenSlot);

    slotEl.classList.remove('hidden');
    slotEl.innerHTML = `
      <div class="container">
        <div class="barb-scheduler">
          <div class="barb-agenda-top">
            <h2 class="barb-agenda-title">Agenda em 3 Passos</h2>
            <span class="barb-demo-badge">Agenda demo</span>
          </div>

          <div class="barb-selects-grid">
            <label class="barb-field">1. Profissional
              <select id="barb-barber-select" class="barb-select">
                ${barbers.map((b) => `<option value="${b}" ${b === ctx.selectedBarber ? 'selected' : ''}>${b}</option>`).join('')}
              </select>
            </label>
            <label class="barb-field">2. Dia (Fuso Local)
              <select id="barb-day-select" class="barb-select">
                ${days.map((d) => `<option value="${d.iso}" ${d.iso === activeDay ? 'selected' : ''}>${d.label} (${d.iso.slice(5).split('-').reverse().join('/')})</option>`).join('')}
              </select>
            </label>
          </div>

          <div class="barb-next-line">
            <span>3. Horários disponíveis</span>
            <span class="barb-next-highlight">${chosenSlot ? `Próx. livre: ${chosenSlot}` : 'Feriado / fechado'}</span>
          </div>

          <div class="barb-slots-grid" role="radiogroup" aria-label="Grade única de horários">
            ${slots.length
              ? slots.map((sl) => `<button type="button" role="radio" aria-checked="${sl === chosenSlot ? 'true' : 'false'}" class="barb-slot-btn ${sl === chosenSlot ? 'active' : ''}" data-global-slot="${sl}">${sl}</button>`).join('')
              : '<span class="cart-row-sub">Sem horários hoje — escolha outro dia acima.</span>'}
          </div>
        </div>
      </div>
    `;

    slotEl.querySelector('#barb-barber-select').addEventListener('change', (e) => {
      ctx.onBarberChange(e.target.value);
    });
    slotEl.querySelector('#barb-day-select').addEventListener('change', (e) => {
      ctx.onDayChange(e.target.value);
    });
    slotEl.querySelectorAll('[data-global-slot]').forEach((btn) => {
      btn.addEventListener('click', () => {
        ctx.setGlobalSlot(btn.dataset.globalSlot);
        slotEl.querySelectorAll('[data-global-slot]').forEach((b) => {
          const active = b.dataset.globalSlot === btn.dataset.globalSlot;
          b.classList.toggle('active', active);
          b.setAttribute('aria-checked', active ? 'true' : 'false');
        });
        const hl = slotEl.querySelector('.barb-next-highlight');
        if (hl) hl.textContent = `Próx. livre: ${btn.dataset.globalSlot}`;
      });
    });
  }

  function renderCatalog(gridEl, items, ctx) {
    gridEl.className = 'catalog-grid barb-ledger';
    gridEl.innerHTML = items.map((item) => `
      <article class="barb-row-card" data-open-id="${item.id}">
        <div class="barb-row-info">
          <h3>${item.name}</h3>
          <div class="barb-row-meta">${item.prepTime || '40 min'} • ${item.barber || 'Equipe'}</div>
        </div>
        <div class="barb-row-cta">
          <strong class="barb-price">${ctx.formatBrl(item.price)}</strong>
          <button type="button" class="btn btn-primary btn-sm add-btn" data-id="${item.id}">Reservar</button>
        </div>
      </article>
    `).join('');
  }

  return {
    id: 'barbearia',
    hideDefaultMeta: true,
    hideDefaultFilterBar: true,
    computeFilteredSlots,
    renderContext,
    renderCatalog,
  };
}));
