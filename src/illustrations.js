(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrineIllustrations = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Ilustracoes vetoriais multi-camadas 100% offline (zero CDNs/fotos pesadas).
   * Suporta tintagem dinamica por swatch (ex: Moda / Vestuario) e cenografia por nicho.
   */
  const SWATCH_PALETTE_BY_ITEM = {
    'mod-1': [
      { name: 'Preto Ônix', hex: '#18181B' },
      { name: 'Off White', hex: '#E7E5E4' },
      { name: 'Azul Marinho', hex: '#1E3A5F' },
      { name: 'Terracota', hex: '#9A3412' },
    ],
    'mod-2': [
      { name: 'Areia', hex: '#D6C7B2' },
      { name: 'Preto Ônix', hex: '#18181B' },
      { name: 'Verde Musgo', hex: '#3F6212' },
    ],
    'mod-3': [
      { name: 'Chumbo', hex: '#374151' },
      { name: 'Café Torrado', hex: '#5C4033' },
      { name: 'Preto Ônix', hex: '#18181B' },
    ],
    'mod-4': [
      { name: 'Verde Musgo', hex: '#3F6212' },
      { name: 'Preto Ônix', hex: '#18181B' },
      { name: 'Areia', hex: '#D6C7B2' },
    ],
  };

  function getItemSwatches(item) {
    if (Array.isArray(item?.swatches) && item.swatches.length) return item.swatches;
    return SWATCH_PALETTE_BY_ITEM[item?.id] || [
      { name: item?.colorTag || 'Padrão', hex: '#18181B' },
      { name: 'Off White', hex: '#E5E7EB' },
    ];
  }

  function renderRichItemArt(vertical, item, options = {}) {
    const id = String(item?.id || '');
    const name = String(item?.name || '').toLowerCase();
    const cat = String(item?.category || '').toLowerCase();
    const tint = options.swatchHex || '#18181B';
    const view = options.view || 'front';

    // Lanchonete
    if (vertical === 'lanchonete') {
      if (id === 'lan-2' || name.includes('combo')) {
        return `<svg viewBox="0 0 80 80" width="68" height="68" aria-hidden="true">
          <rect x="6" y="42" width="38" height="24" rx="8" fill="#D97706"/>
          <rect x="4" y="38" width="42" height="7" rx="3.5" fill="#15803D"/>
          <rect x="6" y="33" width="38" height="7" rx="3" fill="#78350F"/>
          <path d="M8 33c0-10 34-10 34 0z" fill="#F59E0B"/>
          <rect x="49" y="20" width="23" height="46" rx="4" fill="#DC2626"/>
          <rect x="47" y="17" width="27" height="5" rx="2" fill="#E5E7EB"/>
          <path d="M58 17l4-10" stroke="#FBBF24" stroke-width="3" stroke-linecap="round"/>
          <circle cx="60.5" cy="43" r="6" fill="#FFFFFF" opacity="0.9"/>
        </svg>`;
      }
      if (id === 'lan-3' || name.includes('batata')) {
        return `<svg viewBox="0 0 80 80" width="68" height="68" aria-hidden="true">
          <rect x="22" y="14" width="7" height="28" rx="3" fill="#FBBF24"/>
          <rect x="31" y="10" width="7" height="32" rx="3" fill="#F59E0B"/>
          <rect x="40" y="13" width="7" height="29" rx="3" fill="#FCD34D"/>
          <rect x="49" y="16" width="7" height="26" rx="3" fill="#F59E0B"/>
          <path d="M18 36h44l-5 30H23z" fill="#B42318"/>
          <path d="M26 42c6 6 22 6 28 0" stroke="#FBBF24" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`;
      }
      if (id === 'lan-4' || cat.includes('bebid') || name.includes('coca')) {
        return `<svg viewBox="0 0 80 80" width="68" height="68" aria-hidden="true">
          <rect x="24" y="14" width="32" height="54" rx="7" fill="#DC2626"/>
          <rect x="26" y="12" width="28" height="4" rx="2" fill="#D1D5DB"/>
          <rect x="26" y="65" width="28" height="4" rx="2" fill="#9CA3AF"/>
          <path d="M24 34c10-6 22 6 32 0v10c-10 6-22-6-32 0z" fill="#FFFFFF" opacity="0.92"/>
          <circle cx="34" cy="24" r="3" fill="#FCA5A5"/><circle cx="46" cy="54" r="2.5" fill="#FCA5A5"/>
        </svg>`;
      }
      if (id === 'lan-5' || name.includes('brownie')) {
        return `<svg viewBox="0 0 80 80" width="68" height="68" aria-hidden="true">
          <polygon points="14,36 44,22 66,34 36,48" fill="#78350F"/>
          <polygon points="14,36 36,48 36,64 14,52" fill="#451A03"/>
          <polygon points="36,48 66,34 66,50 36,64" fill="#5C2D16"/>
          <path d="M24 34c6-4 14 4 22-2" stroke="#D97706" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>`;
      }
      return `<svg viewBox="0 0 80 80" width="68" height="68" aria-hidden="true">
        <path d="M14 34c0-15 52-15 52 0z" fill="#F59E0B"/>
        <circle cx="28" cy="24" r="1.8" fill="#FEF3C7"/><circle cx="40" cy="21" r="1.8" fill="#FEF3C7"/><circle cx="51" cy="25" r="1.8" fill="#FEF3C7"/>
        <path d="M12 37c6-3 10 3 16 0s10 3 16 0 10 3 16 0 8 3 8 0" stroke="#16A34A" stroke-width="5" fill="none" stroke-linecap="round"/>
        <polygon points="16,41 64,41 56,50 24,50" fill="#FBBF24"/>
        <rect x="13" y="45" width="54" height="10" rx="5" fill="#78350F"/>
        <rect x="15" y="56" width="50" height="10" rx="5" fill="#D97706"/>
      </svg>`;
    }

    // Padaria
    if (vertical === 'padaria') {
      if (id === 'pad-1' || name.includes('bolo')) {
        return `<svg viewBox="0 0 80 80" width="64" height="64" aria-hidden="true">
          <rect x="14" y="34" width="52" height="28" rx="6" fill="#451A03"/>
          <path d="M14 34h52v9c-6 5-12-3-18 2s-12-3-18 2-10-4-16-2z" fill="#78350F"/>
          <circle cx="40" cy="26" r="6" fill="#DC2626"/>
          <path d="M40 20c2-4 6-4 7-2" stroke="#15803D" stroke-width="2.5" fill="none"/>
          <rect x="10" y="62" width="60" height="5" rx="2.5" fill="#DECBB4"/>
        </svg>`;
      }
      if (id === 'pad-2' || name.includes('salgado')) {
        return `<svg viewBox="0 0 80 80" width="64" height="64" aria-hidden="true">
          <ellipse cx="40" cy="58" rx="28" ry="8" fill="#DECBB4"/>
          <path d="M22 52c0-10 8-22 10-22s10 12 10 22z" fill="#D97706"/>
          <path d="M38 54c0-10 8-20 10-20s10 10 10 20z" fill="#F59E0B"/>
          <circle cx="28" cy="48" r="8" fill="#B45309"/>
        </svg>`;
      }
      if (id === 'pad-3' || name.includes('kit')) {
        return `<svg viewBox="0 0 80 80" width="64" height="64" aria-hidden="true">
          <rect x="12" y="34" width="26" height="26" rx="4" fill="#9A4204"/>
          <path d="M38 40h6c4 0 6 3 6 6s-2 6-6 6h-6" stroke="#9A4204" stroke-width="4" fill="none"/>
          <ellipse cx="55" cy="48" rx="14" ry="10" fill="#F59E0B"/>
          <path d="M20 26c0-4 4-4 4-8m8 8c0-4 4-4 4-8" stroke="#DECBB4" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        </svg>`;
      }
      return `<svg viewBox="0 0 80 80" width="64" height="64" aria-hidden="true">
        <ellipse cx="40" cy="44" rx="28" ry="18" fill="#D97706"/>
        <ellipse cx="40" cy="42" rx="24" ry="13" fill="#F59E0B"/>
        <path d="M26 36l8 10m6-12l8 10m6-8l6 8" stroke="#FFFBEB" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`;
    }

    // Moda / Vestuario (tintada ao vivo pelo swatch selecionado + multiplos angulos PDP!)
    if (vertical === 'moda') {
      if (view === 'detail') {
        return `<svg viewBox="0 0 80 80" width="92" height="92" aria-hidden="true">
          <rect x="8" y="8" width="64" height="64" fill="${tint}"/>
          <path d="M8 20h64M8 32h64M8 44h64M8 56h64M20 8v64M32 8v64M44 8v64M56 8v64" stroke="#FFFFFF" stroke-width="0.9" opacity="0.28"/>
          <circle cx="40" cy="40" r="18" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="3 2" opacity="0.7"/>
        </svg>`;
      }
      if (view === 'fit') {
        return `<svg viewBox="0 0 80 80" width="92" height="92" aria-hidden="true">
          <line x1="12" y1="14" x2="68" y2="14" stroke="#52525B" stroke-width="1.2" stroke-dasharray="2 2"/>
          <line x1="12" y1="68" x2="68" y2="68" stroke="#52525B" stroke-width="1.2" stroke-dasharray="2 2"/>
          <line x1="66" y1="14" x2="66" y2="68" stroke="#09090B" stroke-width="1.5"/>
          <path d="M24 18h32l8 12-7 8-5-4v32H28V34l-5 4-7-8z" fill="${tint}" opacity="0.9"/>
          <line x1="28" y1="42" x2="52" y2="42" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="3 2" opacity="0.7"/>
        </svg>`;
      }
      if (id === 'mod-2' || name.includes('calça')) {
        return `<svg viewBox="0 0 80 80" width="68" height="68" aria-hidden="true">
          <path d="M24 14h32l4 54h-14l-6-32-6 32H20z" fill="${tint}"/>
          <rect x="24" y="14" width="32" height="6" fill="#000000" opacity="0.18"/>
          <line x1="40" y1="20" x2="40" y2="34" stroke="#FFFFFF" stroke-width="1.2" opacity="0.4"/>
        </svg>`;
      }
      if (id === 'mod-3' || name.includes('overshirt') || name.includes('jaqueta')) {
        return `<svg viewBox="0 0 80 80" width="68" height="68" aria-hidden="true">
          <path d="M24 16l16 6 16-6 14 14-8 10-6-6v34H24V34l-6 6-8-10z" fill="${tint}"/>
          <line x1="40" y1="22" x2="40" y2="68" stroke="#FFFFFF" stroke-width="1.5" opacity="0.45"/>
          <rect x="28" y="34" width="9" height="10" stroke="#FFFFFF" stroke-width="1" fill="none" opacity="0.45"/>
          <rect x="43" y="34" width="9" height="10" stroke="#FFFFFF" stroke-width="1" fill="none" opacity="0.45"/>
        </svg>`;
      }
      if (id === 'mod-4' || name.includes('boné')) {
        return `<svg viewBox="0 0 80 80" width="68" height="68" aria-hidden="true">
          <path d="M16 48c0-18 12-26 24-26s24 8 24 26z" fill="${tint}"/>
          <path d="M14 48h54c-4 7-16 10-28 10s-22-3-26-10z" fill="${tint}" opacity="0.82"/>
          <circle cx="40" cy="21" r="2.5" fill="#FFFFFF" opacity="0.6"/>
        </svg>`;
      }
      return `<svg viewBox="0 0 80 80" width="68" height="68" aria-hidden="true">
        <path d="M25 16c4 5 26 5 30 0l15 12-8 12-7-6v34H25V34l-7 6-8-12z" fill="${tint}"/>
        <path d="M32 18c3 4 13 4 16 0" stroke="#FFFFFF" stroke-width="1.5" fill="none" opacity="0.5"/>
      </svg>`;
    }

    // Floricultura (suporta multiplos angulos na PDP: bouquet, scale, detail)
    if (vertical === 'floricultura') {
      if (view === 'scale') {
        return `<svg viewBox="0 0 80 80" width="92" height="92" aria-hidden="true">
          <rect x="8" y="58" width="64" height="8" rx="2" fill="#DECBB4"/>
          <rect x="52" y="42" width="16" height="16" rx="2" fill="#BE123C"/>
          <path d="M52 48h16M60 42v16" stroke="#FEF2F2" stroke-width="2"/>
          <polygon points="22,36 46,36 40,58 28,58" fill="#D6C7B2"/>
          <circle cx="28" cy="28" r="7" fill="#E11D48"/><circle cx="38" cy="24" r="8" fill="#BE123C"/><circle cx="43" cy="31" r="6" fill="#FB7185"/>
        </svg>`;
      }
      if (view === 'detail') {
        return `<svg viewBox="0 0 80 80" width="92" height="92" aria-hidden="true">
          <circle cx="40" cy="34" r="22" fill="#BE123C"/>
          <circle cx="34" cy="30" r="12" fill="#E11D48"/><circle cx="46" cy="36" r="10" fill="#FB7185"/>
          <circle cx="39" cy="33" r="5" fill="#881337"/>
          <path d="M22 58c8-6 28-6 36 0" stroke="#D6C7B2" stroke-width="6" fill="none" stroke-linecap="round"/>
          <path d="M34 56l6 10 6-10" fill="#BE123C"/>
        </svg>`;
      }
      if (id === 'flo-2' || name.includes('orquídea')) {
        return `<svg viewBox="0 0 80 80" width="66" height="66" aria-hidden="true">
          <path d="M26 48h28l-4 20H30z" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1.5"/>
          <path d="M40 48V18" stroke="#166534" stroke-width="2.5"/>
          <circle cx="34" cy="24" r="7" fill="#F472B6"/><circle cx="34" cy="24" r="2.5" fill="#FDF2F8"/>
          <circle cx="47" cy="31" r="7" fill="#EC4899"/><circle cx="47" cy="31" r="2.5" fill="#FDF2F8"/>
          <path d="M40 48c-10-4-14-12-8-16m8 16c10-4 14-12 8-16" fill="#15803D"/>
        </svg>`;
      }
      if (id === 'flo-3' || name.includes('girassol')) {
        return `<svg viewBox="0 0 80 80" width="66" height="66" aria-hidden="true">
          <rect x="20" y="46" width="40" height="20" rx="4" fill="#9A4204"/>
          <circle cx="32" cy="30" r="11" fill="#FACC15"/><circle cx="32" cy="30" r="5" fill="#78350F"/>
          <circle cx="49" cy="26" r="10" fill="#FBBF24"/><circle cx="49" cy="26" r="4.5" fill="#78350F"/>
          <rect x="44" y="42" width="14" height="10" rx="2" fill="#451A03"/>
        </svg>`;
      }
      if (id === 'flo-4' || name.includes('jiboia')) {
        return `<svg viewBox="0 0 80 80" width="66" height="66" aria-hidden="true">
          <path d="M26 40h28l-5 24H31z" fill="#D97706"/>
          <path d="M40 40c-14-16-22-4-14 8m14-8c0-22 14-20 12-4m-12 4c16-12 22 4 12 16" stroke="#15803D" stroke-width="4" fill="#22C55E"/>
        </svg>`;
      }
      return `<svg viewBox="0 0 80 80" width="66" height="66" aria-hidden="true">
        <polygon points="22,38 58,38 46,68 34,68" fill="#D6C7B2"/>
        <circle cx="30" cy="28" r="8" fill="#BE123C"/><circle cx="40" cy="22" r="9" fill="#E11D48"/>
        <circle cx="50" cy="29" r="8" fill="#9F1239"/><circle cx="36" cy="33" r="7" fill="#FB7185"/>
        <path d="M33 50h14" stroke="#BE123C" stroke-width="3" stroke-linecap="round"/>
      </svg>`;
    }

    // Oficina (Diagramas tecnicos)
    if (vertical === 'oficina') {
      if (cat.includes('freio') || name.includes('freio')) {
        return `<svg viewBox="0 0 80 80" width="76" height="76" aria-hidden="true">
          <circle cx="40" cy="40" r="24" fill="#1E293B" stroke="#7DD3FC" stroke-width="3"/>
          <circle cx="40" cy="40" r="10" fill="#0F141C" stroke="#38BDF8" stroke-width="2"/>
          <path d="M52 18a26 26 0 0 1 12 22h-10a16 16 0 0 0-8-14z" fill="#EF4444"/>
        </svg>`;
      }
      if (cat.includes('susp') || name.includes('alinhamento')) {
        return `<svg viewBox="0 0 80 80" width="76" height="76" aria-hidden="true">
          <rect x="14" y="20" width="12" height="40" rx="4" fill="#38BDF8"/>
          <rect x="54" y="20" width="12" height="40" rx="4" fill="#38BDF8"/>
          <line x1="26" y1="40" x2="54" y2="40" stroke="#7DD3FC" stroke-width="4"/>
          <circle cx="40" cy="40" r="6" fill="#FBBF24"/>
        </svg>`;
      }
      return `<svg viewBox="0 0 80 80" width="76" height="76" aria-hidden="true">
        <rect x="22" y="20" width="36" height="44" rx="6" fill="#0369A1"/>
        <rect x="30" y="14" width="14" height="6" rx="2" fill="#7DD3FC"/>
        <circle cx="40" cy="42" r="10" fill="#0F141C" stroke="#7DD3FC" stroke-width="2"/>
        <path d="M36 42h8M40 38v8" stroke="#6EE7B7" stroke-width="2"/>
      </svg>`;
    }

    // Barbearia
    if (vertical === 'barbearia') {
      return `<svg viewBox="0 0 80 80" width="72" height="72" aria-hidden="true">
        <circle cx="28" cy="54" r="9" fill="none" stroke="#FBBF24" stroke-width="3"/>
        <circle cx="52" cy="54" r="9" fill="none" stroke="#FBBF24" stroke-width="3"/>
        <path d="M32 46L52 16M48 46L28 16" stroke="#F5EFE6" stroke-width="3.5" stroke-linecap="round"/>
      </svg>`;
    }

    // Pet Shop
    if (vertical === 'petshop') {
      return `<svg viewBox="0 0 80 80" width="72" height="72" aria-hidden="true">
        <rect x="20" y="18" width="40" height="48" rx="10" fill="#0F766E"/>
        <path d="M24 18h32l-4-6H28z" fill="#0D9488"/>
        <circle cx="40" cy="44" r="10" fill="#CCFBF1"/>
        <circle cx="34" cy="34" r="3.5" fill="#CCFBF1"/><circle cx="46" cy="34" r="3.5" fill="#CCFBF1"/>
      </svg>`;
    }

    return '';
  }

  return {
    getItemSwatches,
    renderRichItemArt,
  };
}));
