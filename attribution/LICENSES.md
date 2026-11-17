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

---

## Fontes Self-Hosted (`assets/fonts/*.woff2`) — SIL Open Font License 1.1 (OFL)

Subsets `latin` auto-hospedados via `@fontsource/*` (carregamento lazy por categoria, zero requisições externas em runtime):
- **Barlow Condensed** (`barlow-condensed-700.woff2`, 21.9 KB) — Jeremy Tribby, SIL OFL 1.1
- **Plus Jakarta Sans** (`jakarta-400.woff2` 11.5 KB, `jakarta-700.woff2` 12.0 KB) — Tokotype, SIL OFL 1.1
- **Playfair Display** (`playfair-700.woff2`, 22.7 KB) — Claus Eggers Sørensen, SIL OFL 1.1
- **Fraunces** (`fraunces-700.woff2`, 17.8 KB) — Undercase Type, SIL OFL 1.1
- **Archivo** (`archivo-700.woff2`, 14.2 KB) — Omnibus-Type, SIL OFL 1.1
- **Bodoni Moda** (`bodoni-italic-600.woff2`, 16.7 KB) — Owen Earl (indestructible type*), SIL OFL 1.1
- **Bricolage Grotesque** (`bricolage-700.woff2`, 21.9 KB) — Mathieu Triay, SIL OFL 1.1
- **Nunito** (`nunito-700.woff2`, 15.8 KB) — Vernon Adams / Cyreal, SIL OFL 1.1
- **Cormorant Garamond** (`cormorant-700.woff2`, 21.8 KB) — Christian Thalmann (Catharsis Fonts), SIL OFL 1.1
- **DM Sans** (`dm-sans-400.woff2`, 13.9 KB) — Colophon Foundry, SIL OFL 1.1
