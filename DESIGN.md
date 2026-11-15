---
product: VitrineZap Local
version: 3.0.0
squad_owner: ux-ui-design-squad
benchmarks:
  - Stripe Checkout & Dashboard (hierarquia tipografica, bordas 1px, tabulares)
  - Shopify Polaris (tokens semanticos, KPI cards, acoes primarias)
  - Mercado Libre Andes UI (checkout mobile 3 cliques, segmented controls, sticky bar)
  - Linear (densidade limpa, zero emojis na UI, icones SVG uniformes, WCAG AA)
---

# DESIGN.md — VitrineZap Local v3.0 (Commercial Pro Edition)

## 1. Paleta Semântica
- **Canvas:** `#F6F8FB` (`--canvas`)
- **Surface Card:** `#FFFFFF` (`--surface-card`)
- **Surface Muted:** `#F1F5F9` (`--surface-muted`)
- **Hairline Border:** `#E2E8F0` (`--hairline`)
- **Brand Primary (White-Label):** `#0F766E` (`--brand-primary`, customizável por loja)
- **Text Primary:** `#0F172A` (`--text-primary`)
- **Text Muted:** `#475569` (`--text-muted`)
- **WhatsApp CTA:** `#16A34A` / hover `#15803D` (`--whatsapp`)
- **Success / Warning / Danger:** `#059669`, `#D97706`, `#DC2626`

## 2. Tipografia
- **Display / Headings:** `'Plus Jakarta Sans', system-ui, sans-serif` (`26px` hero, `18px` section, `15px` card title)
- **Body / UI:** `'Inter', system-ui, sans-serif` (`14px` base, `13px` secondary)
- **Tabular / Codes / Prices:** `'JetBrains Mono', ui-monospace, monospace` com `font-variant-numeric: tabular-nums`

## 3. Regras de Qualidade Visual (WCAG AA + Zero Amadorismo)
- **Zero emojis crus** nos controles, botões ou cabeçalhos: usar ícones SVG vetoriais uniformes (`16px` / `18px`, `stroke-width: 2`).
- **Controles segmentados** para `Retirada vs Entrega` e **pills de pagamento** (`Pix`, `Cartão`, `Dinheiro`).
- **Stepper inline (`- 1 +`)** diretamente no card do produto quando adicionado ao carrinho.
- **Painel do Dono em abas** (`Resumo & Pedidos`, `Catálogo`, `Configurações & QR da Loja`) com KPIs e QR Code de balcão imprimível 100% offline.
