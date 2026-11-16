(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.VitrineMechanics = root.VitrineMechanics || {}; root.VitrineMechanics['autoship-reminder'] = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DAILY_GRAMS_BY_SIZE = { Pequeno: 120, Médio: 250, Grande: 450 };

  function calculateFoodDurationDays(packWeightKg, petSize = 'Médio') {
    const kg = Math.max(0.5, Number(packWeightKg || 1));
    const dailyGrams = DAILY_GRAMS_BY_SIZE[petSize] || 250;
    return Math.max(3, Math.round((kg * 1000) / dailyGrams));
  }

  function extractKgFromLabel(label) {
    const m = /([\d.]+)\s*kg/i.exec(String(label || ''));
    return m ? Number(m[1]) : null;
  }

  function buildPetReminderIcs(storeName, petName, days = 30) {
    const target = new Date(Date.now() + Math.max(1, Number(days)) * 86400000);
    const ymd = target.toISOString().slice(0, 10).replace(/-/g, '');
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//VitrineZap Local//Pet Reminder//PT',
      'BEGIN:VEVENT',
      `UID:pet-${Date.now()}@vitrinezap.local`,
      `DTSTART;VALUE=DATE:${ymd}`,
      `SUMMARY:Repor racao ${petName ? 'de ' + petName : 'do Pet'} — ${storeName}`,
      `DESCRIPTION:Lembrete local gerado para recompra rapida em ${storeName}.`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  }

  return { id: 'autoship-reminder', DAILY_GRAMS_BY_SIZE, calculateFoodDurationDays, extractKgFromLabel, buildPetReminderIcs };
}));
