(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrineCategoryApis = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * APIs Publicas Gratuitas e Sem Chave por Categoria (open-apis-geo-squad + innovation + integration).
   * Testadas ao vivo com HTTP 200 e Access-Control-Allow-Origin: *, com fallback 100% offline.
   */
  const OFFLINE_FIPE_BRANDS = [
    { codigo: '23', nome: 'GM - Chevrolet' },
    { codigo: '59', nome: 'VW - VolksWagen' },
    { codigo: '21', nome: 'Fiat' },
    { codigo: '26', nome: 'Hyundai' },
    { codigo: '56', nome: 'Toyota' },
    { codigo: '25', nome: 'Honda' },
    { codigo: '29', nome: 'Jeep' },
    { codigo: '48', nome: 'Renault' },
  ];

  const OFFLINE_FIPE_MODELS = {
    '23': [
      { codigo: 8888, nome: 'ONIX HATCH LT 1.0 12V TB Flex 5p Aut.', defaultFipe: 76500 },
      { codigo: 8100, nome: 'TRACKER Premier 1.2 Turbo 12V Flex Aut.', defaultFipe: 118000 },
      { codigo: 5520, nome: 'S10 Pick-Up LTZ 2.8 TDI 4x4 CD Diesel Aut.', defaultFipe: 175000 },
    ],
    '59': [
      { codigo: 8250, nome: 'POLO Comfortline 200 TSI 1.0 Flex 12V Aut.', defaultFipe: 82400 },
      { codigo: 5940, nome: 'AMAROK High.CD 2.0 16V TDI 4x4 Dies. Aut', defaultFipe: 85386 },
      { codigo: 7510, nome: 'GOL 1.6 MSI Flex 8V 5p', defaultFipe: 46800 },
    ],
    '21': [
      { codigo: 9102, nome: 'STRADA Freedom 1.3 Flex 8V CS Plus', defaultFipe: 89200 },
      { codigo: 7915, nome: 'ARGO Drive 1.0 6V Flex', defaultFipe: 61500 },
    ],
    '26': [
      { codigo: 8420, nome: 'HB20 Sense 1.0 Flex 12V Mec.', defaultFipe: 63900 },
      { codigo: 8950, nome: 'CRETA Comfort 1.0 TB 12V Flex Aut.', defaultFipe: 116000 },
    ],
    '56': [
      { codigo: 7640, nome: 'COROLLA XEi 2.0 Flex 16V Aut.', defaultFipe: 121000 },
      { codigo: 7210, nome: 'HILUX CD SRV 4x4 2.8 TDI Diesel Aut.', defaultFipe: 215000 },
    ],
    '25': [
      { codigo: 7490, nome: 'CIVIC Sedan Touring 1.5 Turbo 16V Aut.', defaultFipe: 128000 },
      { codigo: 7315, nome: 'HR-V EXL 1.5 Flexone 16V 5p Aut.', defaultFipe: 112000 },
    ],
    '29': [
      { codigo: 8050, nome: 'COMPASS Longitude T270 1.3 TB 4x2 Flex Aut.', defaultFipe: 138000 },
    ],
    '48': [
      { codigo: 8010, nome: 'KWID Zen 1.0 Flex 12V 5p', defaultFipe: 44500 },
    ],
  };

  const OFFLINE_DOG_BREEDS = [
    { name: 'Shih Tzu', size: 'Pequeno', weightKg: '4-7 kg' },
    { name: 'Yorkshire Terrier', size: 'Pequeno', weightKg: '2-4 kg' },
    { name: 'Pinscher', size: 'Pequeno', weightKg: '3-5 kg' },
    { name: 'Poodle Anão', size: 'Pequeno', weightKg: '4-8 kg' },
    { name: 'Beagle', size: 'Médio', weightKg: '10-14 kg' },
    { name: 'Bulldog Francês', size: 'Médio', weightKg: '9-13 kg' },
    { name: 'Cocker Spaniel', size: 'Médio', weightKg: '12-15 kg' },
    { name: 'Border Collie', size: 'Médio', weightKg: '14-20 kg' },
    { name: 'Golden Retriever', size: 'Grande', weightKg: '25-34 kg' },
    { name: 'Labrador Retriever', size: 'Grande', weightKg: '27-36 kg' },
    { name: 'Pastor Alemão', size: 'Grande', weightKg: '30-40 kg' },
    { name: 'Rottweiler', size: 'Grande', weightKg: '38-50 kg' },
  ];

  const OFFLINE_BR_HOLIDAYS_2026 = [
    { date: '2026-11-15', name: 'Proclamação da República' },
    { date: '2026-11-20', name: 'Dia da Consciência Negra' },
    { date: '2026-12-25', name: 'Natal' },
    { date: '2027-01-01', name: 'Confraternização Universal' },
  ];

  async function fetchJsonSafe(fetchFn, url, timeoutMs = 2600) {
    if (typeof fetchFn !== 'function') throw new Error('fetch_unavailable');
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
    try {
      const res = await fetchFn(url, ctrl ? { signal: ctrl.signal } : undefined);
      if (!res || !res.ok) throw new Error(`HTTP_${res ? res.status : 'ERR'}`);
      return await res.json();
    } finally {
      if (t) clearTimeout(t);
    }
  }

  function parseBrlCurrency(text) {
    if (typeof text === 'number') return text;
    const clean = String(text || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    const num = Number(clean);
    return Number.isFinite(num) ? num : 0;
  }

  async function fetchFipeBrands(fetchImpl = (typeof fetch === 'function' ? fetch : null)) {
    // 1. Parallelum FIPE
    try {
      const data = await fetchJsonSafe(fetchImpl, 'https://parallelum.com.br/fipe/api/v1/carros/marcas', 2500);
      if (Array.isArray(data) && data.length) {
        return { brands: data, source: 'parallelum-fipe' };
      }
    } catch { /* fallback BrasilAPI */ }

    // 2. BrasilAPI FIPE
    try {
      const data = await fetchJsonSafe(fetchImpl, 'https://brasilapi.com.br/api/fipe/marcas/v1/carros', 2500);
      if (Array.isArray(data) && data.length) {
        return { brands: data.map(b => ({ codigo: String(b.valor), nome: b.nome })), source: 'brasilapi-fipe' };
      }
    } catch { /* fallback offline */ }

    return { brands: OFFLINE_FIPE_BRANDS, source: 'offline-fipe' };
  }

  async function fetchFipeModels(brandCode, fetchImpl = (typeof fetch === 'function' ? fetch : null)) {
    const code = String(brandCode || '').trim();
    if (!code) return { models: [], source: 'empty' };
    try {
      const data = await fetchJsonSafe(fetchImpl, `https://parallelum.com.br/fipe/api/v1/carros/marcas/${encodeURIComponent(code)}/modelos`, 2600);
      if (Array.isArray(data?.modelos) && data.modelos.length) {
        return { models: data.modelos, source: 'parallelum-fipe' };
      }
    } catch { /* fallback offline */ }

    return { models: OFFLINE_FIPE_MODELS[code] || OFFLINE_FIPE_MODELS['23'], source: 'offline-fipe' };
  }

  async function fetchFipeYears(brandCode, modelCode, fetchImpl = (typeof fetch === 'function' ? fetch : null)) {
    const b = String(brandCode || '').trim();
    const m = String(modelCode || '').trim();
    if (!b || !m) return { years: [], source: 'empty' };
    try {
      const data = await fetchJsonSafe(fetchImpl, `https://parallelum.com.br/fipe/api/v1/carros/marcas/${encodeURIComponent(b)}/modelos/${encodeURIComponent(m)}/anos`, 2400);
      if (Array.isArray(data) && data.length) {
        return { years: data, source: 'parallelum-fipe' };
      }
    } catch { /* fallback offline */ }
    return {
      years: [
        { codigo: '2024-5', nome: '2024 Flex' },
        { codigo: '2022-5', nome: '2022 Flex' },
        { codigo: '2019-5', nome: '2019 Flex' },
        { codigo: '2015-1', nome: '2015 Gasolina' },
      ],
      source: 'offline-fipe',
    };
  }

  async function fetchFipeVehicleDetail(brandCode, modelCode, yearCode, fetchImpl = (typeof fetch === 'function' ? fetch : null)) {
    const b = String(brandCode || '').trim();
    const m = String(modelCode || '').trim();
    const y = String(yearCode || '').trim();
    if (!b || !m || !y) return null;
    try {
      const d = await fetchJsonSafe(fetchImpl, `https://parallelum.com.br/fipe/api/v1/carros/marcas/${encodeURIComponent(b)}/modelos/${encodeURIComponent(m)}/anos/${encodeURIComponent(y)}`, 2600);
      if (d && d.Modelo) {
        const valNum = parseBrlCurrency(d.Valor);
        return {
          brand: d.Marca,
          model: d.Modelo,
          year: Number(d.AnoModelo || 2020),
          fuel: d.Combustivel || 'Flex',
          fipeCode: d.CodigoFipe || '',
          fipePriceBrl: d.Valor,
          fipePriceNumber: valNum,
          source: 'parallelum-fipe',
        };
      }
    } catch { /* fallback offline */ }

    const list = OFFLINE_FIPE_MODELS[b] || OFFLINE_FIPE_MODELS['23'];
    const found = list.find(x => String(x.codigo) === m) || list[0];
    const yr = Number(String(y).split('-')[0]) || 2021;
    const baseVal = found?.defaultFipe || 72000;
    const isDiesel = /diesel|tdi|hilux|s10|amarok/i.test(found?.nome || '');
    return {
      brand: (OFFLINE_FIPE_BRANDS.find(x => x.codigo === b)?.nome) || 'Veículo',
      model: found?.nome || 'Modelo Popular',
      year: yr,
      fuel: isDiesel ? 'Diesel' : 'Flex',
      fipeCode: 'OFFLINE',
      fipePriceBrl: `R$ ${baseVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      fipePriceNumber: baseVal,
      source: 'offline-fipe',
    };
  }

  function classifyVehicleTier({ fipePriceNumber = 0, fuel = '', vehicleName = '', year = 2021 } = {}) {
    const name = String(vehicleName || '').toLowerCase();
    const isDieselOr4x4 = /diesel/i.test(fuel) || /hilux|amarok|s10|ranger|compass|sw4|suv|turbo 2\.0/i.test(name);
    const val = Number(fipePriceNumber || 0);
    let tierId = 'economico';
    let tierLabel = 'Popular / Compacto (1.0x)';
    let multiplier = 1.0;

    if (isDieselOr4x4 || val > 130000) {
      tierId = 'suv-diesel-premium';
      tierLabel = 'SUV / Pick-up / Diesel (1.65x)';
      multiplier = 1.65;
    } else if (val > 65000 || /corolla|civic|polo|tracker|hr-v|creta|turbo/i.test(name)) {
      tierId = 'intermediario';
      tierLabel = 'Sedan / Hatch Médio / Turbo (1.28x)';
      multiplier = 1.28;
    }

    const age = Math.max(0, new Date().getFullYear() - Number(year || 2021));
    if (age >= 8) multiplier = Number((multiplier * 1.1).toFixed(2));
    return { tierId, tierLabel, multiplier };
  }

  /**
   * Prediz serviços recomendados e faixa estimada de orçamento (Mín - Médio - Máx)
   * cruzando modelo FIPE / porte / ano + quilometragem atual do veículo.
   */
  function estimateMaintenanceByVehicleAndMileage({ vehicleName = '', fipePriceNumber = 72000, fuel = 'Flex', year = 2021, mileageKm = 40000 } = {}) {
    const km = Math.max(1000, Number(mileageKm || 40000));
    const { tierId, tierLabel, multiplier } = classifyVehicleTier({ fipePriceNumber, fuel, vehicleName, year });

    let milestoneLabel = 'Revisão 10k km (Preventiva Inicial)';
    let catalog = [
      { id: 'est-oleo', name: 'Troca de Óleo Sintético + Filtro + Check 30 Itens', basePrice: 280, urgency: 'rotina' },
      { id: 'est-filtros', name: 'Filtros de Ar Motor + Cabine (Oxi-sanitização)', basePrice: 140, urgency: 'rotina' },
    ];

    if (km >= 90000) {
      milestoneLabel = 'Revisão Completa 90k+ km (Alta Quilometragem)';
      catalog = [
        { id: 'est-correia', name: 'Kit Correia Dentada/Auxiliar + Bomba d\'Água', basePrice: 980, urgency: 'critico' },
        { id: 'est-susp', name: 'Kit Amortecedores Dianteiros + Bieletas + Alinhamento', basePrice: 1290, urgency: 'atencao' },
        { id: 'est-arref', name: 'Limpeza Completa Sistema Arrefecimento + Aditivo', basePrice: 290, urgency: 'atencao' },
        { id: 'est-freio-full', name: 'Pastilhas + Fluido Freio DOT4 + Inspeção Discos', basePrice: 460, urgency: 'critico' },
      ];
    } else if (km >= 60000) {
      milestoneLabel = 'Revisão Maior 60k km (Segurança & Sincronismo)';
      catalog = [
        { id: 'est-correia60', name: 'Kit Correia Dentada + Tensor + Inspeção Bomba', basePrice: 860, urgency: 'critico' },
        { id: 'est-freio60', name: 'Jogo de Pastilhas + Sangria Fluido DOT4', basePrice: 440, urgency: 'critico' },
        { id: 'est-oleo60', name: 'Óleo Motor + Todos os Filtros + Scanner Eletrônico', basePrice: 380, urgency: 'rotina' },
      ];
    } else if (km >= 35000) {
      milestoneLabel = 'Revisão Intermediária 40k km (Ignição & Freios)';
      catalog = [
        { id: 'est-velas40', name: 'Jogo de Velas + Limpeza TBI e Bicos Injetores', basePrice: 420, urgency: 'atencao' },
        { id: 'est-freio40', name: 'Substituição Fluido de Freio DOT4 + Inspeção Pastilhas', basePrice: 220, urgency: 'atencao' },
        { id: 'est-alin40', name: 'Alinhamento 3D + Balanceamento + Rodízio', basePrice: 160, urgency: 'rotina' },
      ];
    } else if (km >= 18000) {
      milestoneLabel = 'Revisão 20k km (Rodagem & Filtros)';
      catalog = [
        { id: 'est-oleo20', name: 'Óleo Motor + Filtro Óleo + Filtro Combustível', basePrice: 310, urgency: 'rotina' },
        { id: 'est-alin20', name: 'Alinhamento 3D + Balanceamento Computadorizado', basePrice: 150, urgency: 'rotina' },
      ];
    }

    const recommendedServices = catalog.map((srv) => {
      const avgPrice = Number((srv.basePrice * multiplier).toFixed(2));
      return {
        id: srv.id,
        name: srv.name,
        urgency: srv.urgency,
        minPrice: Number((avgPrice * 0.85).toFixed(2)),
        avgPrice,
        maxPrice: Number((avgPrice * 1.2).toFixed(2)),
      };
    });

    const totalMin = Number(recommendedServices.reduce((s, x) => s + x.minPrice, 0).toFixed(2));
    const totalAvg = Number(recommendedServices.reduce((s, x) => s + x.avgPrice, 0).toFixed(2));
    const totalMax = Number(recommendedServices.reduce((s, x) => s + x.maxPrice, 0).toFixed(2));

    return {
      vehicleName: vehicleName || 'Veículo Informado',
      mileageKm: km,
      tierId,
      tierLabel,
      multiplier,
      milestoneLabel,
      recommendedServices,
      totalMin,
      totalAvg,
      totalMax,
    };
  }

  function inferPetSizeFromBreed(breedName) {
    const q = String(breedName || '').trim().toLowerCase();
    const matched = OFFLINE_DOG_BREEDS.find(b => b.name.toLowerCase() === q || q.includes(b.name.toLowerCase()));
    if (matched) return matched;
    if (/toy|mini|pinscher|pug|shih|malt|york|dach|chihuahua|spitz|lhasa/i.test(q)) {
      return { name: breedName, size: 'Pequeno', weightKg: '3-8 kg' };
    }
    if (/golden|labrador|pastor|rott|husky|doberman|boxer|akita|retriever|mastiff|bernese/i.test(q)) {
      return { name: breedName, size: 'Grande', weightKg: '25-45 kg' };
    }
    return { name: breedName || 'Raça Média', size: 'Médio', weightKg: '10-20 kg' };
  }

  async function fetchDogBreedsCatalog(fetchImpl = (typeof fetch === 'function' ? fetch : null)) {
    try {
      const data = await fetchJsonSafe(fetchImpl, 'https://dog.ceo/api/breeds/list/all', 2200);
      if (data?.status === 'success' && data.message) {
        const list = Object.keys(data.message).slice(0, 60).map((b) => {
          const formatted = b.charAt(0).toUpperCase() + b.slice(1);
          return inferPetSizeFromBreed(formatted);
        });
        return { breeds: [...OFFLINE_DOG_BREEDS, ...list.filter(x => !OFFLINE_DOG_BREEDS.some(o => o.name.toLowerCase() === x.name.toLowerCase()))], source: 'dog-ceo-api' };
      }
    } catch { /* fallback offline */ }
    return { breeds: OFFLINE_DOG_BREEDS, source: 'offline-breeds' };
  }

  async function fetchUpcomingHolidaysBR(fetchImpl = (typeof fetch === 'function' ? fetch : null), nowDate = new Date()) {
    const year = nowDate.getFullYear();
    let list = OFFLINE_BR_HOLIDAYS_2026;
    let source = 'offline-holidays';
    try {
      const data = await fetchJsonSafe(fetchImpl, `https://brasilapi.com.br/api/feriados/v1/${year}`, 2200);
      if (Array.isArray(data) && data.length) {
        list = data;
        source = 'brasilapi-feriados';
      }
    } catch { /* fallback */ }

    const todayIso = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}-${String(nowDate.getDate()).padStart(2, '0')}`;
    const upcoming = list.filter(h => String(h.date || '') >= todayIso).sort((a, b) => a.date.localeCompare(b.date));
    return {
      nextHoliday: upcoming[0] || list[list.length - 1],
      upcoming: upcoming.slice(0, 3),
      source,
    };
  }

  function calibrateMaintenanceEstimate(estimate, closedOrders = [], minSamples = 8) {
    const orders = (Array.isArray(closedOrders) ? closedOrders : []).filter((o) => Number(o?.total || 0) > 0);
    if (orders.length < minSamples) {
      return {
        ...estimate,
        calibrated: false,
        sampleSize: orders.length,
        calibrationNote: `Estimativa ilustrativa (base tabela FIPE + KM • calibra após ${minSamples} OS fechadas)`,
      };
    }
    const avgReal = orders.reduce((s, o) => s + Number(o.total), 0) / orders.length;
    const ratio = Math.max(0.7, Math.min(1.45, avgReal / Math.max(100, estimate.totalAvg || 300)));
    return {
      ...estimate,
      totalMin: Math.round(estimate.totalMin * ratio),
      totalAvg: Math.round(estimate.totalAvg * ratio),
      totalMax: Math.round(estimate.totalMax * ratio),
      calibrated: true,
      sampleSize: orders.length,
      calibrationNote: `Calibrado com ${orders.length} OS locais (${(ratio * 100 - 100).toFixed(0)}%)`,
    };
  }

  async function fetchProductNutritionOrAllergens(ean = '7891000100103', fetchImpl = (typeof fetch === 'function' ? fetch : null)) {
    const cleanEan = String(ean || '').replace(/\D/g, '');
    if (cleanEan.length >= 8) {
      try {
        const data = await fetchJsonSafe(fetchImpl, `https://world.openfoodfacts.org/api/v2/product/${cleanEan}.json?fields=product_name,allergens`, 2200);
        if (data?.status === 1 && data.product) {
          return {
            name: data.product.product_name || 'Produto Embalado',
            allergens: data.product.allergens || 'Consultar rótulo',
            source: 'openfoodfacts-api',
          };
        }
      } catch { /* fallback offline */ }
    }
    return { name: 'Item Artesanal Local', allergens: 'Contém trigo/lácteos (consulta balcão)', source: 'offline-padaria' };
  }

  async function fetchBotanicalTaxonomy(genus = 'Rosa', fetchImpl = (typeof fetch === 'function' ? fetch : null)) {
    const q = encodeURIComponent(String(genus || 'Rosa').trim());
    try {
      const data = await fetchJsonSafe(fetchImpl, `https://api.gbif.org/v1/species/match?name=${q}`, 2200);
      if (data && data.scientificName) {
        return {
          scientificName: data.scientificName,
          family: data.family || 'Rosaceae',
          careTip: 'Cortar 1cm da haste em diagonal e trocar água a cada 2 dias',
          source: 'gbif-api',
        };
      }
    } catch { /* fallback offline */ }
    return {
      scientificName: `${genus} spp.`,
      family: 'Botânica Ornamental',
      careTip: 'Manter em ambiente arejado longe de sol direto e trocar água a cada 2 dias',
      source: 'offline-botanica',
    };
  }

  return {
    OFFLINE_FIPE_BRANDS,
    OFFLINE_FIPE_MODELS,
    OFFLINE_DOG_BREEDS,
    fetchFipeBrands,
    fetchFipeModels,
    fetchFipeYears,
    fetchFipeVehicleDetail,
    classifyVehicleTier,
    estimateMaintenanceByVehicleAndMileage,
    calibrateMaintenanceEstimate,
    inferPetSizeFromBreed,
    fetchDogBreedsCatalog,
    fetchUpcomingHolidaysBR,
    fetchProductNutritionOrAllergens,
    fetchBotanicalTaxonomy,
  };
}));
