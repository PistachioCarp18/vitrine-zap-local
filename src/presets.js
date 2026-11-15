(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrinePresets = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Conteudos comerciais otimizados pelo research-squad para comercios do Jardim Martinez e Zona Leste (Sorocaba-SP).
   */
  const NICHE_PRESETS = {
    lanchonete: {
      id: 'lanchonete',
      label: 'Lanchonete / Delivery (Zero Taxa App)',
      mode: 'pedido',
      storeName: 'Empório do Lanche — Zona Leste',
      tagline: 'Peça direto no WhatsApp com preço de balcão (0% taxa de aplicativo)',
      neighborhood: 'Jardim Martinez & Região / Sorocaba-SP',
      whatsapp: '(15) 99999-0001',
      pixKey: '15999990001',
      deliveryFee: 6.00,
      primaryColor: '#C2410C',
      pitchTip: 'Mostre ao dono: "Aqui o cliente escolhe o lanche em 3 cliques e cai pronto no seu WhatsApp, sem perder 27% de comissão para aplicativo."',
      items: [
        { id: 'l1', category: 'Combos', badge: 'Mais Pedido', name: 'Combo X-Bacon Duplo + Fritas + Refri', description: '2 hambúrgueres 160g, bacon crocante, cheddar, batata 250g e lata 350ml', price: 42.90 },
        { id: 'l2', category: 'Lanches', badge: 'Clássico', name: 'X-Burger Artesanal da Casa', description: 'Pão brioche selado na manteiga, blend 160g, queijo prato e maionese verde', price: 25.90 },
        { id: 'l3', category: 'Porções', badge: '', name: 'Batata Frita com Cheddar e Bacon (400g)', description: 'Porção generosa ideal para compartilhar em 2 pessoas', price: 28.00 },
        { id: 'l4', category: 'Bebidas', badge: '', name: 'Refrigerante Lata 350ml (Gelado)', description: 'Coca-Cola, Guaraná Antarctica ou Fanta Laranja', price: 6.50 }
      ]
    },
    padaria: {
      id: 'padaria',
      label: 'Padaria & Encomendas',
      mode: 'pedido',
      storeName: 'Padaria & Confeitaria — Vila Hortência',
      tagline: 'Encomende bolos, salgados e kits de café direto pelo celular',
      neighborhood: 'Vila Hortência / Sorocaba-SP',
      whatsapp: '(15) 99999-0002',
      pixKey: '15999990002',
      deliveryFee: 8.00,
      primaryColor: '#92400E',
      pitchTip: 'Mostre ao dono: "Seu cliente encomenda o bolo ou cento de salgado aqui, já gera o Pix de sinal e você recebe o pedido organizado."',
      items: [
        { id: 'p1', category: 'Bolos', badge: 'Encomenda', name: 'Bolo Brigadeiro Gourmet (1,5kg)', description: 'Massa fofinha de cacau 50% com recheio cremoso — serve até 15 fatias', price: 94.00 },
        { id: 'p2', category: 'Salgados', badge: 'Mais Pedido', name: 'Cento de Salgados Fritos na Hora', description: 'Coxinha de frango, bolinha de queijo, risoles e kibe', price: 78.00 },
        { id: 'p3', category: 'Kits Café', badge: 'Economia', name: 'Kit Café da Tarde Família', description: '10 pães franceses, 200g mussarela, 200g presunto e bolo caseiro de fubá', price: 44.00 },
        { id: 'p4', category: 'Doces', badge: '', name: 'Caixa 25 Brigadeiros Tradicionais', description: 'Pronta para festas e reuniões de última hora', price: 49.00 }
      ]
    },
    petshop: {
      id: 'petshop',
      label: 'Pet Shop & Banho e Tosa',
      mode: 'pedido',
      storeName: 'Pet Bairro — Jardim Martinez & Zona Leste',
      tagline: 'Rações com entrega rápida no bairro e agendamento de banho & tosa',
      neighborhood: 'Zona Leste / Sorocaba-SP',
      whatsapp: '(15) 99999-0003',
      pixKey: '15999990003',
      deliveryFee: 5.00,
      primaryColor: '#0F766E',
      pitchTip: 'Mostre ao dono: "O cliente pede a ração recorrente ou reserva o banho em 20 segundos, sem você parar o atendimento no balcão."',
      items: [
        { id: 'pt1', category: 'Banho & Tosa', badge: 'Agende Hoje', name: 'Banho + Tosa Higiênica (Porte Pequeno)', description: 'Corte de unhas, limpeza de ouvidos, hidratação e laço/gravata', price: 65.00 },
        { id: 'pt2', category: 'Rações', badge: 'Entrega Hoje', name: 'Ração Premium Cães Adultos 15kg', description: 'Entrega expressa no Jardim Martinez, Jd. Gonçalves e Vila Hortência', price: 159.90 },
        { id: 'pt3', category: 'Rações', badge: '', name: 'Ração Gatos Castrados Salmão 3kg', description: 'Controle urinário e pelagem saudável', price: 64.90 },
        { id: 'pt4', category: 'Higiene', badge: '', name: 'Tapete Higiênico Super Absorção (30 un.)', description: 'Com atrativo canino e fita adesiva', price: 49.90 }
      ]
    },
    oficina: {
      id: 'oficina',
      label: 'Oficina & Orçamento PDF',
      mode: 'orcamento',
      storeName: 'Auto Center — Av. São Paulo',
      tagline: 'Monte o orçamento do veículo, envie no WhatsApp e imprima o PDF na hora',
      neighborhood: 'Av. São Paulo / Além Ponte — Sorocaba-SP',
      whatsapp: '(15) 99999-0004',
      pixKey: '15999990004',
      deliveryFee: 0.00,
      primaryColor: '#1E3A8A',
      pitchTip: 'Mostre ao mecânico: "Você seleciona os serviços no celular, gera o PDF profissional ou manda direto no WhatsApp do cliente com Pix."',
      items: [
        { id: 'o1', category: 'Revisão', badge: 'Preventiva', name: 'Troca de Óleo 5W30 Sintético + Filtro', description: 'Até 4L de óleo homologado + filtro de óleo + check-up de 15 itens', price: 229.00 },
        { id: 'o2', category: 'Freios', badge: 'Segurança', name: 'Troca de Pastilhas de Freio Dianteiras', description: 'Mão de obra + jogo de pastilhas cerâmicas sem ruído', price: 245.00 },
        { id: 'o3', category: 'Suspensão', badge: '', name: 'Alinhamento 3D + Balanceamento 4 Rodas', description: 'Relatório completo de geometria veicular', price: 135.00 },
        { id: 'o4', category: 'Diagnóstico', badge: '', name: 'Scanner Eletrônico + Limpeza de Bicos', description: 'Leitura de códigos de falha e teste de vazão', price: 140.00 }
      ]
    }
  };

  return { NICHE_PRESETS };
}));
