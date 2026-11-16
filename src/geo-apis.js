(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrineGeoApis = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * 8o Squad: open-apis-geo-squad
   * APIs 100% Gratuitas e Sem Chave: BrasilAPI v2, ViaCEP, OSRM, Open-Meteo e FIPE.
   */
  const SOROCABA_STORES_COORDS = {
    lanchonete: { lat: -23.5058, lng: -47.4192, label: 'Jardim Martinez • Sorocaba-SP' },
    padaria: { lat: -23.5064, lng: -47.4178, label: 'R. Belmira Loureiro • Jd. Martinez' },
    petshop: { lat: -23.4979, lng: -47.4342, label: 'Av. São Paulo • Zona Leste' },
    oficina: { lat: -23.5019, lng: -47.4792, label: 'Av. Gen. Carneiro / Vila Lucy' },
    barbearia: { lat: -23.4950, lng: -47.4480, label: 'Santa Rosália • Sorocaba-SP' },
    moda: { lat: -23.5280, lng: -47.4650, label: 'Campolim • Sorocaba-SP' },
    floricultura: { lat: -23.5110, lng: -47.4620, label: 'Mangal • Sorocaba-SP' },
  };

  const SOROCABA_CEP_OFFLINE_DICT = {
    '18016300': { street: 'Rua Belmira Loureiro de Almeida', neighborhood: 'Jardim Residencial Martinez', city: 'Sorocaba', state: 'SP', coords: { lat: -23.5064, lng: -47.4178 } },
    '18016310': { street: 'Rua Bernardo Martins Júnior', neighborhood: 'Jardim Residencial Martinez', city: 'Sorocaba', state: 'SP', coords: { lat: -23.5052, lng: -47.4189 } },
    '18016320': { street: 'Rua João Moncayo', neighborhood: 'Jardim Residencial Martinez', city: 'Sorocaba', state: 'SP', coords: { lat: -23.5048, lng: -47.4165 } },
    '18013000': { street: 'Avenida São Paulo', neighborhood: 'Além Ponte', city: 'Sorocaba', state: 'SP', coords: { lat: -23.4979, lng: -47.4342 } },
    '18013004': { street: 'Avenida São Paulo (Alt. 1800)', neighborhood: 'Vila Hortência', city: 'Sorocaba', state: 'SP', coords: { lat: -23.4994, lng: -47.4295 } },
    '18035000': { street: 'Rua Coronel Nogueira Padilha', neighborhood: 'Vila Hortência', city: 'Sorocaba', state: 'SP', coords: { lat: -23.5032, lng: -47.4408 } },
    '18040000': { street: 'Avenida General Carneiro', neighborhood: 'Vila Lucy', city: 'Sorocaba', state: 'SP', coords: { lat: -23.5019, lng: -47.4792 } },
    '18055000': { street: 'Avenida Afonso Vergueiro', neighborhood: 'Centro', city: 'Sorocaba', state: 'SP', coords: { lat: -23.4997, lng: -47.4601 } },
  };

  const OFFLINE_FIPE_VEHICLES = [
    'Chevrolet Onix 1.0 Turbo',
    'Hyundai HB20 1.0 Sense',
    'Volkswagen Polo TSI',
    'Fiat Strada Freedom 1.3',
    'Toyota Corolla 2.0 XEi',
    'Volkswagen Gol 1.6 MSI',
    'Renault Kwid 1.0 Zen',
    'Honda Civic Touring 1.5',
    'Jeep Compass Longitude',
    'Fiat Argo Drive 1.0',
  ];

  function normalizeCep(cep) {
    return String(cep || '').replace(/\D/g, '').slice(0, 8);
  }

  async function fetchJsonWithTimeout(fetchFn, url, timeoutMs = 2500) {
    if (typeof fetchFn !== 'function') throw new Error('fetch_unavailable');
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const res = await fetchFn(url, controller ? { signal: controller.signal } : undefined);
      if (!res || !res.ok) throw new Error(`HTTP_${res ? res.status : 'ERR'}`);
      return await res.json();
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /**
   * Consulta CEP: BrasilAPI v2 -> ViaCEP -> Dicionario Offline Configuravel/Sorocaba.
   */
  async function lookupBrazilianCep(cep, fetchImpl = (typeof fetch === 'function' ? fetch : null), geoConfig = {}) {
    const clean = normalizeCep(cep);
    if (clean.length !== 8) {
      throw new Error('CEP invalido. Informe 8 digitos.');
    }

    const customDict = geoConfig && typeof geoConfig.offlineDictionary === 'object' ? geoConfig.offlineDictionary : {};
    const mergedDict = { ...SOROCABA_CEP_OFFLINE_DICT, ...customDict };
    const defaultCity = geoConfig?.city || 'Sorocaba';
    const defaultState = geoConfig?.state || 'SP';
    const fallbackCoords = (geoConfig && Number.isFinite(Number(geoConfig.lat)) && Number.isFinite(Number(geoConfig.lon || geoConfig.lng)))
      ? { lat: Number(geoConfig.lat), lng: Number(geoConfig.lon ?? geoConfig.lng) }
      : { lat: -23.5015, lng: -47.4526 };

    // 1. BrasilAPI v2 (inclui lat/lng quando disponivel)
    try {
      const data = await fetchJsonWithTimeout(fetchImpl, `https://brasilapi.com.br/api/cep/v2/${clean}`, 2200);
      const lat = Number(data?.location?.coordinates?.latitude);
      const lng = Number(data?.location?.coordinates?.longitude);
      const dictCoords = mergedDict[clean]?.coords;
      const coords = (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0)
        ? { lat, lng }
        : (dictCoords || (clean.startsWith('180') ? fallbackCoords : fallbackCoords));
      return {
        cep: clean,
        street: data.street || '',
        neighborhood: data.neighborhood || '',
        city: data.city || defaultCity,
        state: data.state || defaultState,
        coords,
        source: 'brasilapi-v2',
      };
    } catch { /* fallback para ViaCEP */ }

    // 2. ViaCEP
    try {
      const data = await fetchJsonWithTimeout(fetchImpl, `https://viacep.com.br/ws/${clean}/json/`, 2200);
      if (data && !data.erro) {
        const dictCoords = mergedDict[clean]?.coords;
        return {
          cep: clean,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || defaultCity,
          state: data.uf || defaultState,
          coords: dictCoords || (clean.startsWith('180') ? fallbackCoords : fallbackCoords),
          source: 'viacep',
        };
      }
    } catch { /* fallback offline */ }

    // 3. Dicionario Offline (Custom / Sorocaba)
    if (mergedDict[clean]) {
      const entry = mergedDict[clean];
      return {
        cep: clean,
        street: entry.street,
        neighborhood: entry.neighborhood,
        city: entry.city || defaultCity,
        state: entry.state || defaultState,
        coords: entry.coords || fallbackCoords,
        source: customDict[clean] ? 'offline-custom' : 'offline-sorocaba',
      };
    }

    if (geoConfig && geoConfig.city && clean.length === 8) {
      return {
        cep: clean,
        street: `Logradouro CEP ${clean.slice(0, 5)}-${clean.slice(5)}`,
        neighborhood: geoConfig.neighborhood || 'Centro / Região Local',
        city: defaultCity,
        state: defaultState,
        coords: fallbackCoords,
        source: 'offline-store-region',
      };
    }

    if (clean.startsWith('180') || clean.startsWith('181')) {
      return {
        cep: clean,
        street: 'Via Local (Sorocaba)',
        neighborhood: 'Zona Urbana',
        city: 'Sorocaba',
        state: 'SP',
        coords: { lat: -23.5015, lng: -47.4526 },
        source: 'offline-region',
      };
    }

    throw new Error('CEP nao encontrado offline/online.');
  }

  function haversineKm(a, b) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(Number(b.lat) - Number(a.lat));
    const dLng = toRad(Number(b.lng) - Number(a.lng));
    const s1 = Math.sin(dLat / 2);
    const s2 = Math.sin(dLng / 2);
    const h = s1 * s1 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * s2 * s2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  function buildPolylineSvgPath(coordsList, width = 180, height = 56) {
    const pts = Array.isArray(coordsList) && coordsList.length >= 2
      ? coordsList
      : [{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }];
    const lats = pts.map(p => Number(p.lat));
    const lngs = pts.map(p => Number(p.lng));
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const spanLat = maxLat - minLat || 0.001;
    const spanLng = maxLng - minLng || 0.001;
    const pad = 8;
    const mapX = (lng) => pad + ((lng - minLng) / spanLng) * (width - pad * 2);
    const mapY = (lat) => height - pad - ((lat - minLat) / spanLat) * (height - pad * 2);
    return pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${mapX(p.lng).toFixed(1)},${mapY(p.lat).toFixed(1)}`).join(' ');
  }

  function calculateDynamicFeeByKm(distanceKm, options = {}) {
    if (options.freeDeliveryUnlocked) return 0;
    const feeTable = Array.isArray(options.feeTable) && options.feeTable.length
      ? options.feeTable
      : (Array.isArray(options.geo?.feeTable) ? options.geo.feeTable : null);
    let baseFee = Number(options.baseFee ?? 4.0);
    let includedKm = Number(options.includedKm ?? 1.5);
    let perKmRate = Number(options.perKmRate ?? 1.5);
    if (feeTable && feeTable.length) {
      const tier = feeTable.find(t => Number.isFinite(Number(t.upToKm)) && Number.isFinite(Number(t.fee)));
      const perExtra = feeTable.find(t => Number.isFinite(Number(t.perExtraKm)));
      if (tier) {
        includedKm = Number(tier.upToKm);
        baseFee = Number(tier.fee);
      }
      if (perExtra) {
        perKmRate = Number(perExtra.perExtraKm);
      }
    }
    const extraKm = Math.max(0, Number(distanceKm || 0) - includedKm);
    return Number((baseFee + extraKm * perKmRate).toFixed(2));
  }

  function buildNavigationLinks(storeCoords, customerCoords) {
    if (!storeCoords || !customerCoords) return { googleMapsUrl: '', wazeUrl: '' };
    const oLat = Number(storeCoords.lat).toFixed(6);
    const oLng = Number(storeCoords.lng).toFixed(6);
    const dLat = Number(customerCoords.lat).toFixed(6);
    const dLng = Number(customerCoords.lng).toFixed(6);
    return {
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${oLat},${oLng}&destination=${dLat},${dLng}&travelmode=driving`,
      wazeUrl: `https://waze.com/ul?ll=${dLat},${dLng}&navigate=yes`,
    };
  }

  /**
   * Calcula distancia real pelas ruas via OSRM publico + Fallback Haversine x 1.32x.
   */
  async function calculateRouteAndDeliveryFee(storeCoords, customerCoords, options = {}) {
    const fetchFn = options.fetchImpl === undefined ? (typeof fetch === 'function' ? fetch : null) : options.fetchImpl;
    const navLinks = buildNavigationLinks(storeCoords, customerCoords);

    if (fetchFn && !options.forceOffline) {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${storeCoords.lng},${storeCoords.lat};${customerCoords.lng},${customerCoords.lat}?overview=simplified&geometries=geojson`;
        const data = await fetchJsonWithTimeout(fetchFn, url, 2400);
        const route = data?.routes?.[0];
        if (route && Number.isFinite(route.distance)) {
          const distanceKm = Number((route.distance / 1000).toFixed(2));
          const durationMinutes = Math.max(3, Math.round((route.duration || 180) / 60));
          const geoPts = Array.isArray(route.geometry?.coordinates)
            ? route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }))
            : [storeCoords, customerCoords];
          const deliveryFee = calculateDynamicFeeByKm(distanceKm, options);
          return {
            distanceKm,
            durationMinutes,
            deliveryFee,
            polylineSvgPath: buildPolylineSvgPath(geoPts),
            ...navLinks,
            source: 'osrm-public',
          };
        }
      } catch { /* Fallback Haversine x 1.32 */ }
    }

    const rawKm = haversineKm(storeCoords, customerCoords);
    const distanceKm = Number(Math.max(0.4, rawKm * 1.32).toFixed(2));
    const durationMinutes = Math.max(4, Math.round((distanceKm / 26) * 60 + 3));
    const deliveryFee = calculateDynamicFeeByKm(distanceKm, options);
    return {
      distanceKm,
      durationMinutes,
      deliveryFee,
      polylineSvgPath: buildPolylineSvgPath([storeCoords, customerCoords]),
      ...navLinks,
      source: 'haversine-1.32x',
    };
  }

  /**
   * Open-Meteo (100% gratuito sem API key) — coordenada configuravel (default Sorocaba -23.5015, -47.4526)
   */
  async function fetchSorocabaWeather(fetchImpl = (typeof fetch === 'function' ? fetch : null), geoConfig = {}) {
    const lat = Number.isFinite(Number(geoConfig?.lat)) ? Number(geoConfig.lat) : -23.5015;
    const lon = Number.isFinite(Number(geoConfig?.lon ?? geoConfig?.lng)) ? Number(geoConfig.lon ?? geoConfig.lng) : -47.4526;
    const city = geoConfig?.city || 'Local';
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
      const data = await fetchJsonWithTimeout(fetchImpl, url, 2000);
      const cw = data?.current_weather;
      if (cw) {
        const rainAlert = Number(cw.weathercode || 0) >= 51;
        return {
          temperature: Number(cw.temperature),
          weathercode: Number(cw.weathercode || 0),
          rainAlert,
          label: rainAlert ? `Chuva em ${city} (${cw.temperature}°C)` : `${city} ${cw.temperature}°C`,
          source: 'open-meteo',
        };
      }
    } catch { /* fallback */ }
    return { temperature: 24, weathercode: 1, rainAlert: false, label: `${city} 24°C`, source: 'offline' };
  }

  /**
   * FIPE Gratuita (Parallelum) com cache/sugestoes locais de frota popular.
   */
  async function searchFipeVehicles(query = '', fetchImpl = (typeof fetch === 'function' ? fetch : null)) {
    const q = String(query || '').trim().toLowerCase();
    let results = [...OFFLINE_FIPE_VEHICLES];
    if (fetchImpl) {
      try {
        const brands = await fetchJsonWithTimeout(fetchImpl, 'https://parallelum.com.br/fipe/api/v1/carros/marcas', 1800);
        if (Array.isArray(brands) && brands.length) {
          const topBrands = brands.slice(0, 12).map(b => `${b.nome} (FIPE)`);
          results = [...OFFLINE_FIPE_VEHICLES, ...topBrands];
        }
      } catch { /* fallback offline FIPE */ }
    }
    return q ? results.filter(v => v.toLowerCase().includes(q)) : results;
  }

  return {
    SOROCABA_STORES_COORDS,
    SOROCABA_CEP_OFFLINE_DICT,
    OFFLINE_FIPE_VEHICLES,
    normalizeCep,
    lookupBrazilianCep,
    haversineKm,
    calculateDynamicFeeByKm,
    buildPolylineSvgPath,
    buildNavigationLinks,
    calculateRouteAndDeliveryFee,
    fetchSorocabaWeather,
    searchFipeVehicles,
  };
}));
