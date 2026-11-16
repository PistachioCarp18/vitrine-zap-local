(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrineBrandEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Brand Engine v2 (src/brand/brand-engine.js) — ux-ui-design-squad + backend-squad
   * Tokens em 3 camadas: Primitivos -> Semanticos -> Vertical.
   * Validador estrito contra brand.schema.json + Magic Hash seguro (#brand=...) sem Pix key.
   */
  const ALLOWED_VERTICALS = ['lanchonete', 'padaria', 'petshop', 'oficina', 'barbearia', 'moda', 'floricultura', 'custom'];
  const ALLOWED_TONES = ['direto', 'caloroso', 'premium', 'divertido'];
  const ALLOWED_TYPE_STACKS = ['system', 'humanist', 'geometric', 'serif', 'mono'];
  const ALLOWED_RADII = ['sharp', 'soft', 'round'];
  const ALLOWED_ELEVATIONS = ['flat', 'subtle', 'raised'];
  const ALLOWED_DENSITIES = ['compact', 'regular', 'airy'];
  const ALLOWED_CATALOG_LAYOUTS = ['list-thumb', 'editorial-grid', 'checklist-table', 'agenda-slots', 'variant-grid', 'pet-packs'];

  const FONT_STACK_MAP = {
    system: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    humanist: "'Segoe UI', 'Trebuchet MS', system-ui, sans-serif",
    geometric: "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', Cambria, serif",
    mono: "ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace",
  };

  const RADIUS_MAP = {
    sharp: { sm: '4px', md: '6px', lg: '8px' },
    soft: { sm: '8px', md: '12px', lg: '16px' },
    round: { sm: '14px', md: '20px', lg: '24px' },
  };

  const DENSITY_MAP = {
    compact: { pad: '10px', gap: '8px' },
    regular: { pad: '12px', gap: '12px' },
    airy: { pad: '16px', gap: '14px' },
  };

  function normalizeHex(hex, fallback = '#0F766E') {
    const raw = String(hex || '').trim();
    const m3 = /^#?([0-9a-fA-F]{3})$/.exec(raw);
    if (m3) {
      const [r, g, b] = m3[1].split('');
      return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
    }
    const m6 = /^#?([0-9a-fA-F]{6})$/.exec(raw);
    return m6 ? `#${m6[1].toUpperCase()}` : fallback;
  }

  function linearize(c255) {
    const c = c255 / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function relLuminance(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  }

  function contrastRatio(hexA, hexB) {
    const l1 = relLuminance(hexA);
    const l2 = relLuminance(hexB);
    const bright = Math.max(l1, l2);
    const dark = Math.min(l1, l2);
    return Number(((bright + 0.05) / (dark + 0.05)).toFixed(2));
  }

  function darkenHex(hex, factor = 0.82) {
    const r = Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) * factor)));
    const g = Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) * factor)));
    const b = Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) * factor)));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  }

  function mixHex(hexA, hexB, ratioA) {
    const r = Math.round(parseInt(hexA.slice(1, 3), 16) * ratioA + parseInt(hexB.slice(1, 3), 16) * (1 - ratioA));
    const g = Math.round(parseInt(hexA.slice(3, 5), 16) * ratioA + parseInt(hexB.slice(3, 5), 16) * (1 - ratioA));
    const b = Math.round(parseInt(hexA.slice(5, 7), 16) * ratioA + parseInt(hexB.slice(5, 7), 16) * (1 - ratioA));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  }

  /**
   * Gera 3 camadas de tokens garantindo contraste >= 4.5:1 WCAG AA sem falha no axe-core.
   * Se a cor-semente tiver contraste < 4.5 com branco e nao for amarela/clara, escurece primaryFill automaticamente.
   */
  function generateBrandTokens(brand) {
    const seed = normalizeHex(brand?.color?.seed, '#0F766E');
    const cWhite = contrastRatio(seed, '#FFFFFF');
    const cDark = contrastRatio(seed, '#0F172A');

    let actionBg = seed;
    let onAction = cDark >= cWhite ? '#0F172A' : '#FFFFFF';
    let autoAdjusted = false;

    // Se escolher branco como texto e nao atingir 4.5:1 (ex: #EA1D2C = 3.96:1), escurece o fill de acao para >= 4.5:1
    if (onAction === '#FFFFFF' && cWhite < 4.5) {
      let factor = 0.9;
      while (factor >= 0.45 && contrastRatio(actionBg, '#FFFFFF') < 4.7) {
        actionBg = darkenHex(seed, factor);
        factor -= 0.08;
      }
      autoAdjusted = true;
    } else if (onAction === '#0F172A' && cDark < 4.5) {
      actionBg = darkenHex(seed, 0.72);
      onAction = '#FFFFFF';
      autoAdjusted = true;
    }

    const surfaceTint = mixHex(seed, '#FFFFFF', 0.08);
    // Cor de texto de destaque sobre fundo claro / softTint garantindo >= 4.7:1 WCAG AA
    let inkAccent = seed;
    let f = 0.88;
    while (f >= 0.35 && (contrastRatio(inkAccent, '#FFFFFF') < 4.8 || contrastRatio(inkAccent, surfaceTint) < 4.7)) {
      inkAccent = darkenHex(seed, f);
      f -= 0.06;
    }

    const typeStack = ALLOWED_TYPE_STACKS.includes(brand?.type?.stack) ? brand.type.stack : 'geometric';
    const radiusKey = ALLOWED_RADII.includes(brand?.shape?.radius) ? brand.shape.radius : 'soft';
    const densityKey = ALLOWED_DENSITIES.includes(brand?.shape?.density) ? brand.shape.density : 'regular';

    return {
      primitives: { seed, actionBg, inkAccent, autoAdjusted },
      semantics: {
        primary: actionBg,
        onPrimary: onAction,
        inkAccent,
        surfaceTint,
        borderTint: mixHex(seed, '#FFFFFF', 0.25),
        contrastWithSurface: contrastRatio(actionBg, onAction),
        wcagAA: contrastRatio(actionBg, onAction) >= 4.5 && contrastRatio(inkAccent, surfaceTint) >= 4.5,
      },
      vertical: {
        fontHeading: FONT_STACK_MAP[typeStack],
        fontBody: FONT_STACK_MAP.system,
        radii: RADIUS_MAP[radiusKey],
        density: DENSITY_MAP[densityKey],
      },
    };
  }

  function validateBrandConfig(raw) {
    const errors = [];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { valid: false, errors: ['Configuracao invalida: objeto esperado.'], sanitized: null };
    }
    const name = String(raw?.identity?.name || raw?.storeName || '').trim().slice(0, 80);
    if (!name) errors.push('identity.name e obrigatorio.');

    const rawColor = raw?.color?.seed || raw?.primaryColor || '#0F766E';
    const colorOk = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(rawColor).trim());
    if (!colorOk) errors.push('color.seed invalido (use HEX #RRGGBB).');

    const vertical = ALLOWED_VERTICALS.includes(raw.vertical) ? raw.vertical : 'custom';
    const catalogLayout = ALLOWED_CATALOG_LAYOUTS.includes(raw?.layout?.catalog) ? raw.layout.catalog : 'list-thumb';
    const dataUri = raw?.identity?.logo?.dataUri || null;
    if (dataUri && (typeof dataUri !== 'string' || !dataUri.startsWith('data:image/') || dataUri.length > 150000)) {
      errors.push('identity.logo.dataUri invalido ou excede 150KB.');
    }

    if (errors.length) {
      return { valid: false, errors, sanitized: null };
    }

    const sanitized = {
      schemaVersion: '1.0',
      vertical,
      identity: {
        name,
        tagline: String(raw?.identity?.tagline || raw?.tagline || '').trim().slice(0, 140),
        tone: ALLOWED_TONES.includes(raw?.identity?.tone) ? raw.identity.tone : 'direto',
        logo: {
          type: dataUri ? 'image' : 'monogram',
          initials: String(raw?.identity?.logo?.initials || name.slice(0, 2)).trim().toUpperCase().slice(0, 3),
          dataUri,
        },
      },
      color: {
        seed: normalizeHex(rawColor),
        mode: ['auto', 'light', 'dark'].includes(raw?.color?.mode) ? raw.color.mode : 'auto',
        accent: ['analogous', 'complementary', 'mono'].includes(raw?.color?.accent) ? raw.color.accent : 'analogous',
      },
      type: {
        stack: ALLOWED_TYPE_STACKS.includes(raw?.type?.stack) ? raw.type.stack : 'geometric',
        scale: ['compact', 'regular', 'comfortable'].includes(raw?.type?.scale) ? raw.type.scale : 'regular',
      },
      shape: {
        radius: ALLOWED_RADII.includes(raw?.shape?.radius) ? raw.shape.radius : 'soft',
        elevation: ALLOWED_ELEVATIONS.includes(raw?.shape?.elevation) ? raw.shape.elevation : 'subtle',
        density: ALLOWED_DENSITIES.includes(raw?.shape?.density) ? raw.shape.density : 'regular',
      },
      layout: {
        catalog: catalogLayout,
        nav: ['chips', 'tabs', 'sidebar'].includes(raw?.layout?.nav) ? raw.layout.nav : 'chips',
      },
      vocabulary: {
        catalog: String(raw?.vocabulary?.catalog || 'Catálogo').slice(0, 40),
        cart: String(raw?.vocabulary?.cart || 'Sacola').slice(0, 40),
        order: String(raw?.vocabulary?.order || 'Pedido').slice(0, 40),
        cta: String(raw?.vocabulary?.cta || 'Enviar no WhatsApp').slice(0, 50),
      },
      modules: {
        freteKm: Boolean(raw?.modules?.freteKm),
        splitBill: Boolean(raw?.modules?.splitBill),
        sinalPix: Boolean(raw?.modules?.sinalPix),
        recompra: Boolean(raw?.modules?.recompra),
        agendamento: Boolean(raw?.modules?.agendamento),
        osTecnica: Boolean(raw?.modules?.osTecnica),
      },
      geo: {
        city: String(raw?.geo?.city || '').slice(0, 60),
        state: String(raw?.geo?.state || '').slice(0, 4),
        neighborhood: String(raw?.geo?.neighborhood || '').slice(0, 80),
        lat: Number.isFinite(Number(raw?.geo?.lat)) && raw?.geo?.lat !== null ? Number(raw.geo.lat) : null,
        lon: Number.isFinite(Number(raw?.geo?.lon)) && raw?.geo?.lon !== null ? Number(raw.geo.lon) : null,
        feeTable: Array.isArray(raw?.geo?.feeTable) ? raw.geo.feeTable : [],
        offlineDictionary: raw?.geo?.offlineDictionary && typeof raw.geo.offlineDictionary === 'object' ? raw.geo.offlineDictionary : null,
      },
      contact: {
        whatsapp: String(raw?.contact?.whatsapp || '').replace(/\D/g, '').slice(0, 15),
        pixKey: String(raw?.contact?.pixKey || '').trim().slice(0, 80),
      },
    };

    return { valid: true, errors: [], sanitized };
  }

  /**
   * Seguranca v10: Dados do Magic Link vao no HASH (#brand=...), NUNCA na query, e SEM chave Pix por padrao.
   */
  function encodeMagicHash(baseUrl, config = {}, options = {}) {
    const cleanUrl = new URL(baseUrl);
    cleanUrl.search = '';
    const params = new URLSearchParams();
    params.set('v', config.vertical || config.id || 'lanchonete');
    if (config.identity?.name || config.storeName) params.set('name', String(config.identity?.name || config.storeName).slice(0, 60));
    if (config.color?.seed || config.primaryColor) params.set('color', normalizeHex(config.color?.seed || config.primaryColor));
    if (config.type?.stack) params.set('font', config.type.stack);
    if (config.shape?.radius) params.set('radius', config.shape.radius);
    if (config.layout?.catalog) params.set('layout', config.layout.catalog);
    if (config.contact?.whatsapp || config.whatsapp) params.set('wa', String(config.contact?.whatsapp || config.whatsapp).replace(/\D/g, '').slice(0, 15));
    if (options.includePix && (config.contact?.pixKey || config.pixKey)) {
      params.set('pix', String(config.contact?.pixKey || config.pixKey).slice(0, 60));
    }
    cleanUrl.hash = `brand=${params.toString()}`;
    return cleanUrl.toString();
  }

  function decodeMagicHash(hashString) {
    const raw = String(hashString || '').trim();
    if (!raw) return null;
    const stripped = raw.startsWith('#') ? raw.slice(1) : raw;
    const payload = stripped.startsWith('brand=') ? stripped.slice(6) : stripped;
    if (!payload) return null;

    const p = new URLSearchParams(payload);
    if (!['v', 'name', 'color', 'font', 'radius', 'layout', 'wa'].some(k => p.has(k))) return null;

    const color = p.get('color');
    const validColor = color && /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color) ? normalizeHex(color) : undefined;
    return {
      vertical: ALLOWED_VERTICALS.includes(p.get('v')) ? p.get('v') : undefined,
      name: p.get('name') ? p.get('name').trim().slice(0, 60) : undefined,
      color: validColor,
      font: ALLOWED_TYPE_STACKS.includes(p.get('font')) ? p.get('font') : undefined,
      radius: ALLOWED_RADII.includes(p.get('radius')) ? p.get('radius') : undefined,
      layout: ALLOWED_CATALOG_LAYOUTS.includes(p.get('layout')) ? p.get('layout') : undefined,
      whatsapp: p.get('wa') ? p.get('wa').replace(/\D/g, '').slice(0, 15) : undefined,
    };
  }

  return {
    ALLOWED_VERTICALS,
    ALLOWED_CATALOG_LAYOUTS,
    FONT_STACK_MAP,
    normalizeHex,
    contrastRatio,
    generateBrandTokens,
    validateBrandConfig,
    encodeMagicHash,
    decodeMagicHash,
  };
}));
