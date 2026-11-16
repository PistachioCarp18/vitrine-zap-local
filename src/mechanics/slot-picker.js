(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.VitrineMechanics = root.VitrineMechanics || {}; root.VitrineMechanics['slot-picker'] = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function getUpcomingDays(count = 4, baseDate = new Date()) {
    const labels = ['Hoje', 'Amanhã'];
    const days = [];
    for (let i = 0; i < count; i += 1) {
      const d = new Date(baseDate.getTime() + i * 86400000);
      const iso = d.toISOString().slice(0, 10);
      const dayLabel = labels[i] || `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      days.push({ iso, label: dayLabel });
    }
    return days;
  }

  function buildBookingIcsEvent({ storeName, serviceName, professional, dateIso, timeSlot }) {
    const cleanDate = String(dateIso || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
    const [hh, mm] = String(timeSlot || '10:00').split(':');
    const dtStart = `${cleanDate}T${(hh || '10').padStart(2, '0')}${(mm || '00').padStart(2, '0')}00`;
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//VitrineZap Local//Agendamento//PT',
      'BEGIN:VEVENT',
      `UID:book-${Date.now()}@vitrinezap.local`,
      `DTSTART:${dtStart}`,
      `SUMMARY:${serviceName || 'Agendamento'} — ${storeName || 'Estudio'}`,
      `DESCRIPTION:Profissional: ${professional || 'Qualquer disponivel'} (Confirmar via WhatsApp)`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  }

  return { id: 'slot-picker', getUpcomingDays, buildBookingIcsEvent };
}));
