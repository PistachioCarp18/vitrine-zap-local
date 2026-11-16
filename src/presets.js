(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrinePresets = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const LEGACY_META_MAP = {
    lanchonete: { domainMode: 'food-delivery', brandArchetype: 'high-energy-food', layoutMode: 'food-list', label: 'Lanchonete & Delivery', mode: 'pedido', canvasColor: '#FFFFFF', inkColor: '#0F172A' },
    padaria: { domainMode: 'scheduled-order', brandArchetype: 'artisanal-warm', layoutMode: 'bakery-editorial', label: 'Padaria & Confeitaria', mode: 'pedido', canvasColor: '#FAF6F0', inkColor: '#2D1E14', supportsDeposit50: true },
    petshop: { domainMode: 'recurring-pet', brandArchetype: 'playful-soft', layoutMode: 'pet-recurring', label: 'Pet Shop (Recorrente)', mode: 'pedido', canvasColor: '#F0FDF4', inkColor: '#132A24' },
    oficina: { domainMode: 'service-quote', brandArchetype: 'industrial-precision', layoutMode: 'auto-blueprint', label: 'Oficina & Autopeças (OS)', mode: 'orcamento', canvasColor: '#F1F5F9', inkColor: '#0F172A' },
    barbearia: { domainMode: 'service-booking', brandArchetype: 'barber-atelier', layoutMode: 'agenda-slots', label: 'Barbearia & Agenda', mode: 'pedido', canvasColor: '#FFFFFF', inkColor: '#0F172A' },
    moda: { domainMode: 'retail-variants', brandArchetype: 'fashion-editorial', layoutMode: 'variant-grid', label: 'Moda & Vestuário', mode: 'pedido', canvasColor: '#FFFFFF', inkColor: '#0F172A' },
    floricultura: { domainMode: 'floral-scheduled', brandArchetype: 'botanical-warm', layoutMode: 'botanical-editorial', label: 'Floricultura & Presentes', mode: 'pedido', canvasColor: '#F8FAF8', inkColor: '#132A24', supportsDeposit50: true },
  };

  function packToPreset(pack) {
    const leg = LEGACY_META_MAP[pack.vertical] || LEGACY_META_MAP.lanchonete;
    const meta = pack.meta || {};
    const vocab = pack.vocabulary || {};
    const geo = pack.geo || {};
    const nb = [geo.neighborhood, geo.city].filter(Boolean).join(' • ');
    return {
      // Brand Engine v2 canonical fields
      schemaVersion: pack.schemaVersion || '1.0',
      vertical: pack.vertical,
      identity: pack.identity,
      color: pack.color,
      type: pack.type,
      shape: pack.shape,
      layout: pack.layout,
      vocabulary: pack.vocabulary,
      modules: pack.modules,
      geo: pack.geo,
      contact: pack.contact,
      meta: pack.meta,
      // Legacy-compatible v9 fields
      id: pack.vertical,
      domainMode: leg.domainMode,
      brandArchetype: leg.brandArchetype,
      layoutMode: leg.layoutMode,
      label: leg.label,
      storeName: pack.identity.name,
      logoInitials: pack.identity.logo?.initials || '',
      logoDataUri: pack.identity.logo?.dataUri || null,
      neighborhood: nb || 'Atendimento Local',
      tagline: pack.identity.tagline,
      rating: meta.rating || '4.9',
      whatsapp: pack.contact.whatsapp,
      pixKey: pack.contact.pixKey || '',
      deliveryFee: Number(meta.deliveryFee || 0),
      freeDeliveryThreshold: Number(meta.freeDeliveryThreshold || 0),
      primaryColor: pack.color.seed,
      canvasColor: leg.canvasColor,
      inkColor: leg.inkColor,
      openHour: meta.openHour || '08:00',
      closeHour: meta.closeHour || '22:00',
      etaLabel: meta.etaLabel || 'Hoje',
      mode: leg.mode,
      supportsDeposit50: Boolean(pack.modules?.sinalPix),
      scheduleWindows: pack.scheduleWindows || [],
      quoteValidityDays: meta.quoteValidityDays || 7,
      symptoms: pack.symptoms || [],
      vocab: {
        catalogTitle: vocab.catalog || 'Catálogo',
        cartTitle: vocab.cart || 'Sua Sacola',
        barCta: `Ver ${vocab.cart || 'Sacola'}`,
        addBtn: pack.vertical === 'oficina' ? '+ Incluir na OS' : (pack.vertical === 'padaria' || pack.vertical === 'floricultura' ? 'Encomendar' : (pack.vertical === 'barbearia' ? 'Agendar' : 'Adicionar')),
        ctaBtn: vocab.cta || 'Enviar no WhatsApp',
        pdfBtn: pack.vertical === 'oficina' ? 'Imprimir OS (PDF)' : 'Resumo PDF',
      },
      coupons: pack.coupons || [],
      quickTags: pack.quickTags || [],
      pitchTip: pack.pitchTip || '',
      items: pack.items || [],
    };
  }

  const EMBEDDED_PACKS = [
    {
      schemaVersion: '1.0',
      vertical: 'lanchonete',
      identity: { name: 'Empório Lanches', tagline: 'Burgers na brasa direto no WhatsApp, sem taxa de aplicativo.', tone: 'direto', logo: { type: 'monogram', initials: 'EL', dataUri: null } },
      color: { seed: '#D92D20', mode: 'light', accent: 'analogous' },
      type: { stack: 'geometric', scale: 'regular' },
      shape: { radius: 'soft', elevation: 'subtle', density: 'regular' },
      layout: { catalog: 'list-thumb', nav: 'chips' },
      vocabulary: { catalog: 'Cardápio', cart: 'Sacola', order: 'Pedido', cta: 'Enviar pedido no WhatsApp' },
      modules: { freteKm: true, splitBill: true, sinalPix: false, recompra: false, agendamento: false, osTecnica: false },
      geo: { city: 'Sorocaba', state: 'SP', neighborhood: 'Jardim Martinez', lat: -23.5058, lon: -47.4192, feeTable: [{ upToKm: 1.5, fee: 4.0 }, { perExtraKm: 1.5 }] },
      contact: { whatsapp: '15998066213', pixKey: '15998066213' },
      meta: { rating: '4.9 (120+)', etaLabel: '25-35 min', deliveryFee: 6.0, freeDeliveryThreshold: 45.0, openHour: '18:00', closeHour: '23:30' },
      coupons: [{ code: 'BAIRRO10', type: 'percent', value: 10 }, { code: 'BEMVINDO5', type: 'fixed', value: 5 }],
      quickTags: ['Sem cebola', 'Maionese à parte', 'Caprichar no molho'],
      pitchTip: 'Entrega grátis acima de R$ 45, ponto da carne, adicionais pagos, divisor de conta e cálculo de rota.',
      items: [
        { id: 'lan-1', category: 'Burgers', name: 'X-Martinez Bacon Artesanal', description: 'Blend 160g na brasa, cheddar cremoso, bacon crocante e maionese verde no brioche.', price: 32.9, badge: 'Mais Pedido', prepTime: '20 min', variants: ['Ao ponto (suculento)', 'Bem passado', 'Mal passado'], variantLabel: 'Ponto da carne', extras: [{ id: 'ex-bacon', name: 'Bacon extra crocante', price: 5.0 }, { id: 'ex-cheddar', name: 'Cheddar duplo', price: 4.5 }] },
        { id: 'lan-2', category: 'Combos', name: 'Combo Casal Clássico', description: '2 X-Salada artesanais + fritas rústicas médias + 2 refrigerantes lata 350ml.', price: 68.0, badge: 'Frete Grátis', prepTime: '25 min', extras: [{ id: 'ex-ched-batata', name: 'Cheddar e bacon nas fritas', price: 8.0 }] },
        { id: 'lan-3', category: 'Porções', name: 'Batata Rústica Cheddar & Bacon', description: 'Porção 400g crocante com cobertura generosa de cheddar e bacon.', price: 29.5, prepTime: '15 min' },
        { id: 'lan-4', category: 'Bebidas', name: 'Coca-Cola Lata 350ml', description: 'Gelada, pronta para acompanhar seu pedido.', price: 6.5, prepTime: 'Imediato' },
        { id: 'lan-5', category: 'Sobremesas', name: 'Brownie Quente com Doce de Leite', description: 'Fatia artesanal macia com cobertura cremosa.', price: 14.9, badge: 'Novidade', prepTime: '10 min' },
      ],
    },
    {
      schemaVersion: '1.0',
      vertical: 'padaria',
      identity: { name: 'União Padaria & Atelier', tagline: 'Encomendas artesanais com agendamento de horário e sinal 50% no Pix.', tone: 'caloroso', logo: { type: 'monogram', initials: 'UP', dataUri: null } },
      color: { seed: '#9A4204', mode: 'light', accent: 'analogous' },
      type: { stack: 'serif', scale: 'comfortable' },
      shape: { radius: 'soft', elevation: 'subtle', density: 'airy' },
      layout: { catalog: 'editorial-grid', nav: 'chips' },
      vocabulary: { catalog: 'Vitrine de Encomendas', cart: 'Sua Encomenda', order: 'Encomenda', cta: 'Reservar Encomenda no WhatsApp' },
      modules: { freteKm: true, splitBill: false, sinalPix: true, recompra: false, agendamento: true, osTecnica: false },
      geo: { city: 'Sorocaba', state: 'SP', neighborhood: 'R. Belmira Loureiro', lat: -23.5064, lon: -47.4178, feeTable: [{ upToKm: 1.5, fee: 5.0 }, { perExtraKm: 1.5 }] },
      contact: { whatsapp: '15998234575', pixKey: '15998234575' },
      meta: { rating: '4.9 (95+)', etaLabel: 'Fornadas 08h / 16h', deliveryFee: 5.0, freeDeliveryThreshold: 80.0, openHour: '06:00', closeHour: '20:30' },
      scheduleWindows: ['08:00 - 10:00 (Manhã)', '11:30 - 13:30 (Almoço)', '16:00 - 18:30 (Café)'],
      coupons: [{ code: 'BAIRRO10', type: 'percent', value: 10 }],
      quickTags: ['Embalagem presente', 'Velinha inclusa', 'Fatiado na hora'],
      pitchTip: 'Encomendas com agendamento por janela de horário, dizeres do bolo e cálculo de sinal 50% no Pix.',
      items: [
        { id: 'pad-1', category: 'Bolos', name: 'Bolo Brigadeiro Belga', description: 'Massa úmida de cacau 50% com granulado belga.', yieldLabel: 'Serve 15 fatias', price: 89.0, extras: [{ id: 'ex-topo', name: 'Topo de Bolo Personalizado', price: 15.0 }, { id: 'ex-morango', name: 'Morangos Frescos', price: 14.0 }] },
        { id: 'pad-2', category: 'Salgados', name: 'Cento de Salgados Fritos', description: 'Coxinha, bolinha de queijo, risole e kibe na hora.', yieldLabel: 'Serve 20 pessoas', price: 79.0 },
        { id: 'pad-3', category: 'Kits Café', name: 'Kit Café Condomínio', description: '8 pães franceses, frios, pão de queijo, bolo e suco 1L.', yieldLabel: 'Para 4 pessoas', price: 58.0 },
        { id: 'pad-4', category: 'Pães', name: 'Pão Italiano Natural', description: 'Fermentação lenta 24h, casca crocante.', yieldLabel: 'Fornada 16h', price: 22.0 },
      ],
    },
    {
      schemaVersion: '1.0',
      vertical: 'petshop',
      identity: { name: 'Amigo Fiel Pet', tagline: 'Rações com escolha de pacote direto no card e recompra mensal em 1 toque.', tone: 'divertido', logo: { type: 'monogram', initials: 'AF', dataUri: null } },
      color: { seed: '#0F766E', mode: 'light', accent: 'analogous' },
      type: { stack: 'humanist', scale: 'regular' },
      shape: { radius: 'round', elevation: 'subtle', density: 'regular' },
      layout: { catalog: 'pet-packs', nav: 'chips' },
      vocabulary: { catalog: 'Produtos Pet', cart: 'Sacola do Pet', order: 'Pedido Pet', cta: 'Pedir & Agendar Lembrete' },
      modules: { freteKm: true, splitBill: false, sinalPix: false, recompra: true, agendamento: false, osTecnica: false },
      geo: { city: 'Sorocaba', state: 'SP', neighborhood: 'Av. São Paulo • Zona Leste', lat: -23.4979, lon: -47.4342, feeTable: [{ upToKm: 1.5, fee: 7.0 }, { perExtraKm: 1.5 }] },
      contact: { whatsapp: '15999990003', pixKey: '15999990003' },
      meta: { rating: '4.8 (80+)', etaLabel: 'Entrega Hoje', deliveryFee: 7.0, freeDeliveryThreshold: 120.0, openHour: '08:30', closeHour: '19:00' },
      coupons: [{ code: 'BAIRRO10', type: 'percent', value: 10 }],
      quickTags: ['Deixar na portaria', 'Perfume suave', 'Buscar com Táxi Dog'],
      pitchTip: 'Recompra em 1 toque no topo, seletor de porte P/M/G e pesos clicáveis direto no card.',
      items: [
        { id: 'pet-1', category: 'Rações', name: 'Ração Super Premium Cães Adultos', description: 'Alta digestibilidade, pele e pelos saudáveis. Escolha o pacote:', price: 169.9, cycleLabel: 'Dura ~30 dias', packOptions: [{ label: '1kg', price: 28.9 }, { label: '3kg', price: 69.9 }, { label: '15kg (-15%)', price: 169.9 }], defaultPackIdx: 2, extras: [{ id: 'ex-sache', name: 'Kit 3 Sachês Gourmet', price: 12.0 }] },
        { id: 'pet-2', category: 'Banho & Tosa', name: 'Banho & Tosa Higiênica', description: 'Banho morno, hidratação, corte de unhas e limpeza de ouvidos.', price: 65.0, cycleLabel: 'Ciclo 15 dias', packOptions: [{ label: 'Porte P', price: 65.0 }, { label: 'Porte M', price: 82.0 }, { label: 'Porte G', price: 105.0 }], defaultPackIdx: 0 },
        { id: 'pet-3', category: 'Higiene', name: 'Tapete Higiênico Super Absorção', description: 'Fitas adesivas reforçadas e neutralizador de odores.', price: 49.9, cycleLabel: 'Dura ~30 dias', packOptions: [{ label: '15 un.', price: 29.9 }, { label: '30 un.', price: 49.9 }], defaultPackIdx: 1 },
        { id: 'pet-4', category: 'Saúde', name: 'Antipulgas & Carrapatos Palatável', description: 'Proteção mensal em comprimido mastigável.', price: 74.0, cycleLabel: 'Proteção 30 dias' },
      ],
    },
    {
      schemaVersion: '1.0',
      vertical: 'oficina',
      identity: { name: 'Fort Center Auto', tagline: 'Pré-Orçamento Técnico Digital & Triagem de Ordem de Serviço.', tone: 'direto', logo: { type: 'monogram', initials: 'FC', dataUri: null } },
      color: { seed: '#1D4ED8', mode: 'light', accent: 'mono' },
      type: { stack: 'mono', scale: 'compact' },
      shape: { radius: 'sharp', elevation: 'flat', density: 'compact' },
      layout: { catalog: 'checklist-table', nav: 'chips' },
      vocabulary: { catalog: 'Serviços & Peças', cart: 'Pré-Orçamento Técnico', order: 'Orçamento OS', cta: 'Enviar Orçamento no WhatsApp' },
      modules: { freteKm: false, splitBill: false, sinalPix: false, recompra: false, agendamento: false, osTecnica: true },
      geo: { city: 'Sorocaba', state: 'SP', neighborhood: 'Vila Lucy', lat: -23.5019, lon: -47.4792, feeTable: [] },
      contact: { whatsapp: '15996398869', pixKey: '15996398869' },
      meta: { rating: '4.9 (140+)', etaLabel: '45 min bancada', deliveryFee: 0.0, freeDeliveryThreshold: 0.0, openHour: '08:00', closeHour: '18:00', quoteValidityDays: 7 },
      symptoms: ['Barulho ao frear', 'Revisão preventiva', 'Luz de injeção acesa', 'Vibração / Alinhamento'],
      coupons: [{ code: 'REVISAO10', type: 'percent', value: 10 }],
      quickTags: ['Guardar peças trocadas', 'Aprovar antes de executar', 'Emitir NF-e'],
      pitchTip: 'Ordem de Serviço blueprint com códigos [OS-XXX], separação Peça vs. Mão de Obra e garantia.',
      items: [
        { id: 'ofi-1', sku: 'OS-REV-01', category: 'Revisão', name: 'Troca de Óleo 5W30 Sintético + Filtro', description: 'Até 4L óleo homologado + filtro de óleo + inspeção 18 pontos.', partsPrice: 189.0, laborPrice: 60.0, price: 249.0, warranty: 'Garantia 90 dias', prepTime: '45 min bancada' },
        { id: 'ofi-2', sku: 'OS-SUSP-02', category: 'Suspensão', name: 'Alinhamento 3D + Balanceamento (4 rodas)', description: 'Geometria computadorizada com laudo técnico impresso.', partsPrice: 20.0, laborPrice: 119.0, price: 139.0, warranty: 'Garantia 90 dias', prepTime: '50 min bancada' },
        { id: 'ofi-3', sku: 'OS-FREIO-03', category: 'Freios', name: 'Pastilhas de Freio Dianteiras + Sangria', description: 'Jogo dianteiro + inspeção de discos e fluido DOT4.', partsPrice: 115.0, laborPrice: 70.0, price: 185.0, warranty: 'Garantia 90 dias', prepTime: '60 min bancada' },
        { id: 'ofi-4', sku: 'OS-DIAG-04', category: 'Diagnóstico', name: 'Scanner Eletrônico + Laudo de Injeção', description: 'Leitura completa de códigos DTC e parâmetros em tempo real.', partsPrice: 0.0, laborPrice: 95.0, price: 95.0, warranty: 'Laudo técnico', prepTime: '30 min bancada' },
      ],
    },
    {
      schemaVersion: '1.0',
      vertical: 'barbearia',
      identity: { name: 'Barbearia Navalha Clássica', tagline: 'Agende corte, barba e combo direto no horário livre pelo WhatsApp.', tone: 'premium', logo: { type: 'monogram', initials: 'NC', dataUri: null } },
      color: { seed: '#1E293B', mode: 'light', accent: 'mono' },
      type: { stack: 'serif', scale: 'regular' },
      shape: { radius: 'sharp', elevation: 'subtle', density: 'airy' },
      layout: { catalog: 'agenda-slots', nav: 'chips' },
      vocabulary: { catalog: 'Serviços & Horários', cart: 'Sua Reserva', order: 'Agendamento', cta: 'Confirmar Horário no WhatsApp' },
      modules: { freteKm: false, splitBill: false, sinalPix: false, recompra: false, agendamento: true, osTecnica: false },
      geo: { city: 'Sorocaba', state: 'SP', neighborhood: 'Santa Rosália', lat: -23.495, lon: -47.448, feeTable: [] },
      contact: { whatsapp: '1533290131', pixKey: '1533290131' },
      meta: { rating: '5.0 (210+)', etaLabel: 'Atendimento pontual', deliveryFee: 0.0, freeDeliveryThreshold: 0.0, openHour: '09:00', closeHour: '20:00' },
      scheduleWindows: ['09:30', '11:00', '14:30', '16:00', '18:30'],
      coupons: [{ code: 'PRIMEIROCORTE', type: 'fixed', value: 10 }],
      quickTags: ['Sem máquina zero', 'Toalha quente', 'Café expresso'],
      pitchTip: 'Vertical fora de alimentação (Agenda Slots): escolha do serviço + horário livre e profissional direto no card.',
      items: [
        { id: 'bar-1', category: 'Cortes', name: 'Corte Degradê + Finalização', description: 'Tesoura e máquina com acabamento na navalha e lavagem.', price: 55.0, prepTime: '40 min', slots: ['09:30', '11:00', '14:30', '17:00'], barber: 'Thiago' },
        { id: 'bar-2', category: 'Combos', name: 'Combo Corte + Barba Terapia', description: 'Toalha quente, óleo essencial de eucalipto e hidratação.', price: 90.0, prepTime: '60 min', slots: ['10:00', '15:00', '18:30'], barber: 'Thiago / Marcos' },
        { id: 'bar-3', category: 'Barba', name: 'Barba Tradicional na Navalha', description: 'Modelagem completa com balm pós-barba.', price: 45.0, prepTime: '30 min', slots: ['09:00', '13:30', '16:30'], barber: 'Marcos' },
        { id: 'bar-4', category: 'Sobrancelha', name: 'Design de Sobrancelha Masculina', description: 'Alinhamento discreto na pinça e navalha.', price: 25.0, prepTime: '15 min', slots: ['12:00', '16:00', '19:00'], barber: 'Marcos' },
      ],
    },
    {
      schemaVersion: '1.0',
      vertical: 'moda',
      identity: { name: 'Studio Urbano Vestuário', tagline: 'Moda casual local com grade de tamanhos e entrega no mesmo dia.', tone: 'premium', logo: { type: 'monogram', initials: 'SU', dataUri: null } },
      color: { seed: '#6D28D9', mode: 'light', accent: 'complementary' },
      type: { stack: 'geometric', scale: 'regular' },
      shape: { radius: 'soft', elevation: 'subtle', density: 'airy' },
      layout: { catalog: 'variant-grid', nav: 'chips' },
      vocabulary: { catalog: 'Coleção', cart: 'Sacola', order: 'Pedido', cta: 'Reservar Peças no WhatsApp' },
      modules: { freteKm: true, splitBill: false, sinalPix: false, recompra: false, agendamento: false, osTecnica: false },
      geo: { city: 'Sorocaba', state: 'SP', neighborhood: 'Campolim', lat: -23.528, lon: -47.465, feeTable: [{ upToKm: 2.0, fee: 8.0 }, { perExtraKm: 1.5 }] },
      contact: { whatsapp: '15991234567', pixKey: '15991234567' },
      meta: { rating: '4.9 (75+)', etaLabel: 'Entrega hoje', deliveryFee: 8.0, freeDeliveryThreshold: 199.0, openHour: '09:30', closeHour: '19:00' },
      coupons: [{ code: 'LOOK10', type: 'percent', value: 10 }],
      quickTags: ['Embalar para presente', 'Troca em 7 dias', 'Experimentar em casa'],
      pitchTip: 'Vertical Moda/Varejo: grade 2 colunas com chips de tamanho P/M/G/GG clicáveis direto no card.',
      items: [
        { id: 'mod-1', category: 'Camisetas', name: 'Camiseta Heavy Pima Preta', description: 'Algodão peruano 220g, modelagem boxy.', price: 119.0, colorTag: 'Preto Ônix', sizes: ['P', 'M', 'G', 'GG'], prepTime: 'Pronta entrega' },
        { id: 'mod-2', category: 'Calças', name: 'Calça Cargo Sarja Areia', description: 'Cintura ajustável e bolsos utilitários.', price: 189.0, colorTag: 'Areia', sizes: ['38', '40', '42', '44'], prepTime: 'Pronta entrega' },
        { id: 'mod-3', category: 'Jaquetas', name: 'Overshirt Linho Chumbo', description: 'Botões madrepérola, toque macio.', price: 229.0, colorTag: 'Chumbo', sizes: ['P', 'M', 'G'], prepTime: 'Pronta entrega' },
        { id: 'mod-4', category: 'Acessórios', name: 'Boné Dad Hat Sarja', description: 'Fivela metálica regulável.', price: 79.0, colorTag: 'Verde Musgo', sizes: ['Único'], prepTime: 'Pronta entrega' },
      ],
    },
    {
      schemaVersion: '1.0',
      vertical: 'floricultura',
      identity: { name: 'Flora & Jardim Botânico', tagline: 'Buquês frescos montados na hora com entrega agendada e cartão dedicatória.', tone: 'caloroso', logo: { type: 'monogram', initials: 'FJ', dataUri: null } },
      color: { seed: '#047857', mode: 'light', accent: 'analogous' },
      type: { stack: 'serif', scale: 'comfortable' },
      shape: { radius: 'soft', elevation: 'subtle', density: 'airy' },
      layout: { catalog: 'editorial-grid', nav: 'chips' },
      vocabulary: { catalog: 'Arranjos & Plantas', cart: 'Cesta Floral', order: 'Pedido Floral', cta: 'Enviar Encomenda no WhatsApp' },
      modules: { freteKm: true, splitBill: false, sinalPix: true, recompra: false, agendamento: true, osTecnica: false },
      geo: { city: 'Sorocaba', state: 'SP', neighborhood: 'Mangal', lat: -23.511, lon: -47.462, feeTable: [{ upToKm: 2.0, fee: 9.0 }, { perExtraKm: 2.0 }] },
      contact: { whatsapp: '15997778899', pixKey: '15997778899' },
      meta: { rating: '4.9 (110+)', etaLabel: 'Entrega agendada', deliveryFee: 9.0, freeDeliveryThreshold: 180.0, openHour: '08:00', closeHour: '18:30' },
      scheduleWindows: ['08:30 - 11:30 (Manhã)', '13:30 - 16:30 (Tarde)', '17:00 - 18:30 (Fim de tarde)'],
      coupons: [{ code: 'FLORES10', type: 'percent', value: 10 }],
      quickTags: ['Cartão escrito à mão', 'Papel kraft rústico', 'Entregar com surpresa'],
      pitchTip: 'Vertical Floricultura: cartão dedicatória, agendamento de entrega e arranjos sazonais.',
      items: [
        { id: 'flo-1', category: 'Buquês', name: 'Buquê 12 Rosas Colombianas', description: 'Rosas frescas envolvidas em papel kraft e laço de cetim.', yieldLabel: 'Com cartão incluso', price: 149.0 },
        { id: 'flo-2', category: 'Orquídeas', name: 'Orquídea Phalaenopsis Cachepô', description: 'Duas hastes floridas em vaso cerâmico.', yieldLabel: 'Dura até 60 dias', price: 119.0 },
        { id: 'flo-3', category: 'Cestas', name: 'Cesta Girassol + Chocolates', description: '3 girassóis selecionados + caixa de bombons finos.', yieldLabel: 'Presente completo', price: 165.0 },
        { id: 'flo-4', category: 'Plantas', name: 'Jiboia Pendente Vaso Cuia', description: 'Folhagem exuberante de fácil cuidado interno.', yieldLabel: 'Ambiente interno', price: 59.0 },
      ],
    },
  ];

  // In Node, read directly from verticals/*.json if present so single source of truth is enforced
  let resolvedPacks = EMBEDDED_PACKS;
  if (typeof require === 'function' && typeof __dirname !== 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const vDir = path.resolve(__dirname, '../verticals');
      if (fs.existsSync(vDir)) {
        const files = fs.readdirSync(vDir).filter(f => f.endsWith('.json'));
        if (files.length >= 7) {
          resolvedPacks = files.map(f => JSON.parse(fs.readFileSync(path.join(vDir, f), 'utf8')));
        }
      }
    } catch { /* fallback to embedded packs */ }
  }

  const VERTICAL_PACKS = {};
  const NICHE_PRESETS = {};
  resolvedPacks.forEach((p) => {
    VERTICAL_PACKS[p.vertical] = p;
    NICHE_PRESETS[p.vertical] = packToPreset(p);
  });

  return { NICHE_PRESETS, VERTICAL_PACKS, packToPreset };
}));
