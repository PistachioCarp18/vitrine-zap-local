# Licenças e Atribuições Clean-Room (VitrineZap Local v11.0)

Este projeto adota separação estrita em **duas pistas** (`docs/v11/p01-selecao-autoridades.md`):

## Pista A — Sistemas com Licença Aberta Verificada (MIT)

1. **GitHub Primer CSS**
   - Repositório: `https://github.com/primer/css`
   - Licença verificada em `2026-11-16`: **The MIT License (MIT)** — `Copyright (c) 2021 GitHub Inc.`
   - Uso no projeto: princípios de hierarquia administrativa, estados `:focus-visible` e organização tabular limpa para o Painel do Lojista (`#merchant-studio-modal`).

2. **Radix UI Primitives**
   - Repositório: `https://github.com/radix-ui/primitives`
   - Licença verificada em `2026-11-16`: **MIT License** — `Copyright (c) 2022 WorkOS`
   - Uso no projeto: padrões de acessibilidade WAI-ARIA (`role="radiogroup"`, `role="radio"`, `aria-checked`, controle de foco e fechamento de sheets/dialogs).

3. **Mercado Libre Andes UI (Referência Móvel)**
   - Organização: `https://github.com/mercadolibre` (`Andes UI`, MIT declarado nos repositórios móveis oficiais `[T]`)
   - Uso no projeto: referencial conceitual de contraste, chips numéricos e ergonomia de checkout mobile BR.

> Permissões MIT concedidas gratuitamente para uso, modificação e distribuição com preservação de crédito, sem garantia (*AS IS*).

---

## Pista B — Referências Proprietárias (Somente Abstração Estrutural / Proibido Copiar Ativos)

As referências listadas abaixo nos dossiês REA da pasta `30-Conhecimento/Dossie-REA-*.md` serviram **apenas** para extrair fluxos abstratos, número de etapas/toques e regras de negócio observáveis (`G-LEGAL = 0`):
- Delivery: MenuDino / iFood
- Encomendas: Square Online / Starbucks
- Pet Recorrência: Cobasi / Chewy
- Oficina Mecânica: RepairPal / Tekmetric
- Barbearia: Booksy / Trinks
- Moda Varejo: Shopify Dawn (explicitamente **excluído da Pista A** por cláusula *source-available* restritiva da Shopify)
- Floricultura: Giuliana Flores / 1-800-Flowers
- Transversal Checkout: WhatsApp Business Catalog / Mercado Pago UX

**Nenhum código-fonte, ícone, imagem, fonte proprietária, texto literal ou marca externa foi copiado.**
