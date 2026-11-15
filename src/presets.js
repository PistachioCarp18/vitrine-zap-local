(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrinePresets = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const NICHE_PRESETS = {
    lanchonete: {
      id: 'lanchonete',
      label: 'Lanchonete & Delivery',
      storeName: 'Empório do Lanche Martinez',
      neighborhood: 'Jardim Martinez • Sorocaba-SP',
      tagline: 'Artesanais na brasa direto no WhatsApp, sem taxa de aplicativo.',
      whatsapp: '15999990001',
      pixKey: '15999990001',
      deliveryFee: 6.0,
      primaryColor: '#0F766E',
      openHour: '18:00',
      closeHour: '23:30',
      mode: 'pedido',
      coupons: [
        { code: 'BAIRRO10', type: 'percent', value: 10 },
        { code: 'BEMVINDO5', type: 'fixed', value: 5 },
      ],
      pitchTip: 'Use o cupom BAIRRO10 (10% OFF) no checkout para demonstrar campanhas locais sem depender de apps de entrega.',
      items: [
        { id: 'lan-1', category: 'Burgers', name: 'X-Martinez Bacon Artesanal', description: 'Blend bovino 160g na brasa, cheddar cremoso, bacon crocante e maionese da casa.', price: 32.9, badge: 'Mais Pedido', prepTime: '20 min' },
        { id: 'lan-2', category: 'Combos', name: 'Combo Casal Clássico', description: '2 X-Salada artesanais + porção média de fritas + 2 refrigerantes lata 350ml.', price: 68.0, badge: 'Economia', prepTime: '25 min' },
        { id: 'lan-3', category: 'Porções', name: 'Batata Rústica Cheddar & Bacon', description: 'Porção 400g crocante com cobertura generosa de cheddar e cubos de bacon.', price: 29.5, prepTime: '15 min' },
        { id: 'lan-4', category: 'Bebidas', name: 'Coca-Cola Lata 350ml', description: 'Gelada, pronta para acompanhar seu pedido.', price: 6.5, prepTime: 'Imediato' },
        { id: 'lan-5', category: 'Sobremesas', name: 'Brownie Quente com Doce de Leite', description: 'Fatia artesanal macia com cobertura cremosa.', price: 14.9, badge: 'Novidade', prepTime: '10 min' },
      ],
    },
    padaria: {
      id: 'padaria',
      label: 'Padaria & Confeitaria',
      storeName: 'Padaria & Café do Bairro',
      neighborhood: 'Jardim Martinez • Sorocaba-SP',
      tagline: 'Pães de fermentação natural, salgados e kits de encomenda.',
      whatsapp: '15999990002',
      pixKey: '15999990002',
      deliveryFee: 5.0,
      primaryColor: '#B45309',
      openHour: '06:00',
      closeHour: '20:30',
      mode: 'pedido',
      coupons: [{ code: 'BAIRRO10', type: 'percent', value: 10 }],
      pitchTip: 'Ideal para encomendas de café corporativo e festas de fim de semana com sinal pago via Pix.',
      items: [
        { id: 'pad-1', category: 'Kits Café', name: 'Kit Café da Manhã Família', description: '8 pães franceses, 200g presunto, 200g mussarela, bolo caseiro e suco 1L.', price: 54.9, badge: 'Mais Pedido', prepTime: '30 min' },
        { id: 'pad-2', category: 'Salgados', name: 'Cento de Salgados Variados', description: 'Coxinha, bolinha de queijo, risole e kibe fritos na hora da retirada.', price: 79.0, badge: 'Encomenda', prepTime: '60 min' },
        { id: 'pad-3', category: 'Pães', name: 'Pão Italiano Fermentação Natural', description: 'Casca crocante e miolo macio, assado no período da manhã.', price: 22.0, prepTime: 'Pronta entrega' },
        { id: 'pad-4', category: 'Bolos', name: 'Bolo de Cenoura com Brigadeiro', description: 'Forma média (1kg) com cobertura cremosa de chocolate meio amargo.', price: 38.0, prepTime: 'Pronta entrega' },
      ],
    },
    petshop: {
      id: 'petshop',
      label: 'Pet Shop & Banho/Tosa',
      storeName: 'Amigo Fiel Pet Care',
      neighborhood: 'Zona Leste • Sorocaba-SP',
      tagline: 'Rações premium e agendamento rápido de banho e tosa pelo WhatsApp.',
      whatsapp: '15999990003',
      pixKey: '15999990003',
      deliveryFee: 7.0,
      primaryColor: '#1D4ED8',
      openHour: '08:30',
      closeHour: '19:00',
      mode: 'pedido',
      coupons: [{ code: 'BAIRRO10', type: 'percent', value: 10 }],
      pitchTip: 'Facilite a recompra mensal de ração no bairro e preencha horários ociosos de banho e tosa.',
      items: [
        { id: 'pet-1', category: 'Estética Pet', name: 'Banho & Tosa Higiênica (Porte P)', description: 'Banho morno, hidratação, corte de unhas e limpeza de ouvidos.', price: 65.0, badge: 'Mais Pedido', prepTime: 'Agenda' },
        { id: 'pet-2', category: 'Rações', name: 'Ração Premium Cães Adultos 15kg', description: 'Sabor carne e arroz com entrega rápida no mesmo dia no bairro.', price: 169.9, badge: 'Entrega Hoje', prepTime: 'Hoje' },
        { id: 'pet-3', category: 'Higiene', name: 'Tapete Higiênico Super Absorção (30 un.)', description: 'Fitas adesivas reforçadas e neutralizador de odores.', price: 49.9, prepTime: 'Hoje' },
        { id: 'pet-4', category: 'Acessórios', name: 'Antipulgas & Carrapatos (até 10kg)', description: 'Comprimido palatável com proteção de 30 dias.', price: 74.0, prepTime: 'Hoje' },
      ],
    },
    oficina: {
      id: 'oficina',
      label: 'Oficina & Auto Center',
      storeName: 'Martinez Auto Center',
      neighborhood: 'Jardim Martinez • Sorocaba-SP',
      tagline: 'Orçamento técnico transparente em PDF e aprovação ágil no WhatsApp.',
      whatsapp: '15999990004',
      pixKey: '15999990004',
      deliveryFee: 0.0,
      primaryColor: '#0F172A',
      openHour: '08:00',
      closeHour: '18:00',
      mode: 'orcamento',
      coupons: [{ code: 'REVISAO10', type: 'percent', value: 10 }],
      pitchTip: 'Gere orçamentos profissionais em PDF ou WhatsApp na frente do cliente e aumente a taxa de aprovação.',
      items: [
        { id: 'ofi-1', category: 'Revisão', name: 'Troca de Óleo 5W30 Sintético + Filtro', description: 'Inclui até 4L de óleo sintético homologado, filtro novo e check-up de fluidos.', price: 249.0, badge: 'Preventiva', prepTime: '45 min' },
        { id: 'ofi-2', category: 'Suspensão', name: 'Alinhamento 3D + Balanceamento (4 rodas)', description: 'Equipamento computadorizado com laudo técnico de geometria.', price: 139.0, badge: 'Mais Pedido', prepTime: '50 min' },
        { id: 'ofi-3', category: 'Freios', name: 'Troca de Pastilhas de Freio Dianteiras', description: 'Mão de obra completa + inspeção de discos e fluido DOT4.', price: 185.0, prepTime: '60 min' },
        { id: 'ofi-4', category: 'Diagnóstico', name: 'Scanner Eletrônico + Laudo de Injeção', description: 'Leitura completa de códigos de falha e parâmetros em tempo real.', price: 95.0, prepTime: '30 min' },
      ],
    },
  };

  return { NICHE_PRESETS };
}));
