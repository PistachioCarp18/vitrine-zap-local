(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VitrinePdp = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * VitrinePdp — Arquitetura de Detalhe de Produto/Servico por Categoria (v14.0).
   * Define modo de exibicao (pagina cheia vs sheet contextual), galeria multi-fotos,
   * composicoes, instrucoes de cuidado, adicionais e campos proprios por nicho.
   */
  const FULL_PAGE_VERTICALS = new Set(['moda', 'floricultura']);

  function getPdpMode(vertical) {
    const v = String(vertical || 'lanchonete').toLowerCase();
    if (FULL_PAGE_VERTICALS.has(v)) return 'full-page';
    if (v === 'oficina') return 'technical-sheet';
    if (v === 'barbearia') return 'booking-sheet';
    if (v === 'petshop') return 'club-sheet';
    if (v === 'padaria') return 'bakery-sheet';
    return 'craving-sheet';
  }

  function getItemGallerySlides(vertical, item, options = {}) {
    const v = String(vertical || 'lanchonete').toLowerCase();
    const ill = options.illustrations || (typeof window !== 'undefined' ? window.VitrineIllustrations : null);
    const hasCustomPhoto = Boolean(item?.photoDataUrl);
    const swatchHex = options.swatchHex || '#18181B';
    const tierScale = options.tierScale || 'classic';

    if (v === 'moda') {
      return [
        {
          id: 'front',
          caption: 'Vista Frontal • Modelagem',
          artHtml: hasCustomPhoto
            ? `<img src="${item.photoDataUrl}" alt="${item.name} — vista frontal" />`
            : (ill ? ill.renderRichItemArt('moda', item, { swatchHex, view: 'front' }) : ''),
        },
        {
          id: 'fit',
          caption: 'Costas & Caimento Tech',
          artHtml: ill ? ill.renderRichItemArt('moda', item, { swatchHex, view: 'fit' }) : '',
        },
        {
          id: 'detail',
          caption: 'Macro Fibra & Costura',
          artHtml: ill ? ill.renderRichItemArt('moda', item, { swatchHex, view: 'detail' }) : '',
        },
      ];
    }

    if (v === 'floricultura') {
      return [
        {
          id: 'bouquet',
          caption: 'Arranjo Completo',
          artHtml: hasCustomPhoto
            ? `<img src="${item.photoDataUrl}" alt="${item.name} — arranjo completo" />`
            : (ill ? ill.renderRichItemArt('floricultura', item, { view: 'bouquet', tierScale }) : ''),
        },
        {
          id: 'scale',
          caption: 'Proporção na Mesa / Vaso',
          artHtml: ill ? ill.renderRichItemArt('floricultura', item, { view: 'scale', tierScale }) : '',
        },
        {
          id: 'detail',
          caption: 'Pétalas & Embalagem Kraft',
          artHtml: ill ? ill.renderRichItemArt('floricultura', item, { view: 'detail', tierScale }) : '',
        },
      ];
    }

    const singleArt = hasCustomPhoto
      ? `<img src="${item.photoDataUrl}" alt="${item.name}" />`
      : (ill ? ill.renderRichItemArt(v, item, { swatchHex }) : '');
    return singleArt ? [{ id: 'main', caption: item?.category || 'Detalhe', artHtml: singleArt }] : [];
  }

  function getFloralTiers(basePrice) {
    const base = Number(basePrice || 0);
    return [
      { id: 'classic', label: 'Clássico', sub: 'Tamanho padrão', delta: 0, finalPrice: base },
      { id: 'luxo', label: 'Luxo (+50% flores)', sub: 'Volume dobrado', delta: 45, finalPrice: Number((base + 45).toFixed(2)) },
      { id: 'premium', label: 'Premium + Bombons', sub: 'Arranjo + chocolates finos', delta: 79, finalPrice: Number((base + 79).toFixed(2)) },
    ];
  }

  function getCategoryPdpSpec(vertical, item = {}, ctx = {}) {
    const v = String(vertical || 'lanchonete').toLowerCase();
    const mode = getPdpMode(v);

    if (v === 'moda') {
      const cat = String(item.category || '').toLowerCase();
      const fabric = cat.includes('calça') || cat.includes('acess')
        ? 'Sarja Tech 97% Algodão + 3% Elastano • Secagem rápida'
        : (cat.includes('jaqueta') ? 'Linho Misto Respirável 190g • Botões naturais' : 'Algodão Pima Peruano 220g • Antiodor & Não Amassa');
      return {
        mode,
        backLabel: 'Voltar para Coleção',
        requiresNote: false,
        optionalNoteSummary: 'Adicionar recado de presente (opcional)',
        notePlaceholder: 'Ex: Embalar para presente sem preço',
        benefits: ['Regulação Térmica', 'Antiodor', '1ª Troca Grátis 7 dias'],
        accordions: [
          { title: 'Composição & Tecido', body: `${fabric}. Corte anatômico testado para conforto térmico o dia todo.` },
          { title: 'Cuidados & Lavagem', body: 'Lavar à máquina no modo suave com água fria. Secar à sombra. Dispensa ferro.' },
          { title: 'Entrega & Troca Fácil', body: 'Entrega no mesmo dia na região local. Primeira troca de tamanho gratuita em até 7 dias.' },
        ],
      };
    }

    if (v === 'floricultura') {
      return {
        mode,
        backLabel: 'Voltar aos Arranjos',
        requiresNote: false,
        supportsInlineFloralCard: true,
        supportsFloralTiers: true,
        benefits: ['Entrega Hoje em até 3h', 'Flores Frescas do Dia', 'Cartão Dedicatória Grátis'],
        accordions: [
          { title: 'O que acompanha este presente', body: `${item.description || 'Flores selecionadas com folhagens frescas.'} Inclui embalagem kraft artesanal e cartão impresso.` },
          { title: 'Cuidados para durar até 2x mais', body: 'Corte 1cm dos caules na diagonal ao receber, troque a água a cada 48h e evite sol direto.' },
          { title: 'Garantia de Frescor Local', body: 'Caso alguma flor falte na estação, substituímos por equivalente de valor igual ou superior.' },
        ],
      };
    }

    if (v === 'oficina') {
      return {
        mode,
        backLabel: 'Fechar Laudo',
        requiresNote: false,
        optionalNoteSummary: 'Observação técnica do motorista (opcional)',
        notePlaceholder: 'Ex: Barulho ao passar em lombada',
        techFlags: ['Guardar peças substituídas', 'Ligar antes se surgir extra', 'Incluir check 30 pontos grátis'],
        vehicleHint: ctx.vehicleName
          ? `Aplicável para ${ctx.vehicleName} (${Number(ctx.mileageKm || 40000).toLocaleString('pt-BR')} km)`
          : `Estimativa calibrada para revisão de ${(Number(ctx.mileageKm || 40000) / 1000).toFixed(0)}k km`,
        accordions: [
          { title: 'Escopo Técnico & Bancada', body: `Tempo médio em elevador: ${item.prepTime || '45 min'}. Peça: R$ ${Number(item.partsPrice || 0).toFixed(2)} | Mão de obra: R$ ${Number(item.laborPrice ?? item.price ?? 0).toFixed(2)}.` },
          { title: 'Garantia & Transparência OS', body: `${item.warranty || 'Garantia 90 dias'}. Peças antigas podem ser entregues na retirada do veículo.` },
        ],
      };
    }

    if (v === 'barbearia') {
      return {
        mode,
        backLabel: 'Fechar Serviço',
        requiresNote: false,
        optionalNoteSummary: 'Preferência de atendimento (opcional)',
        notePlaceholder: 'Ex: Disfarçado na navalha / café expresso',
        groomingSteps: ['Consultoria rápida de visagismo', 'Execução precisa na máquina/tesoura', 'Acabamento navalhado + toalha quente', 'Finalização com balm'],
        groomingTags: ['Toalha quente', 'Sem cheiro forte', 'Acabamento navalhado'],
      };
    }

    if (v === 'petshop') {
      return {
        mode,
        backLabel: 'Fechar Produto Pet',
        requiresNote: false,
        optionalNoteSummary: 'Instruções para o Pet / Entrega (opcional)',
        notePlaceholder: 'Ex: Portaria ou cuidados especiais do pet',
        nutritionNote: `Cálculo automático de duração ajustado ao porte selecionado (${ctx.petSize || 'Médio'}). Assinantes Clube economizam 10% em toda compra.`,
      };
    }

    if (v === 'padaria') {
      return {
        mode,
        backLabel: 'Fechar Item',
        requiresNote: false,
        optionalNoteSummary: 'Recado opcional (ex: dizeres de bolo / embalagem)',
        notePlaceholder: 'Ex: Parabéns Maria! / Embalar separado',
        simpleQuickNote: true,
        bakeBadge: item.yieldLabel || 'Fornada fresca do dia',
      };
    }

    return {
      mode,
      backLabel: 'Fechar Item',
      requiresNote: true,
      notePlaceholder: 'Ex: Sem cebola, ponto bem passado...',
    };
  }

  return {
    getPdpMode,
    getItemGallerySlides,
    getFloralTiers,
    getCategoryPdpSpec,
  };
}));
