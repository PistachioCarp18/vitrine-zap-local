---
name: VitrineZap Local Design System v2.0
version: 2.0.0
benchmarks:
  - Mercado Libre Andes UI (mobile checkout density, 4/8/12/16/24px spacing, 6-12px radius, 26/16/14/13px type scale)
  - Shopify Polaris (semantic surface tokens, merchant admin clarity)
  - Linear / Anthropic (Segundo Cerebro DESIGN.md — high contrast, reduced-motion guardrail)
accessibility: WCAG AA (>= 4.5:1 contrast, >= 44px touch targets, non-blocking toasts)
---

# DESIGN.md — VitrineZap Local v2.0 (`ux-ui-design-squad`)

## 1. Referências Aplicadas
- **Andes UI (Mercado Pago / Mercado Livre):** Escala espacial rigorosa (`4px`, `8px`, `12px`, `16px`, `24px`), raios compactos (`6px`–`12px`) e hierarquia tipográfica de checkout (`26px` Header, `16px` Card Title, `14px` Body, `13px` CTA/Badge) para leitura rápida no celular.
- **Shopify Polaris:** Separação entre a **Vitrine do Cliente** e o **Painel do Comerciante** (com histórico do dia e backup), usando superfícies semânticas limpas (`--canvas: #F8FAFC`, `--surface-card: #FFFFFF`, `--hairline: #E2E8F0`).
- **Linear / Guardrails (`30-Conhecimento/Engenharia-Reversa-e-Design-Systems-DESIGN-md.md`):** Zero `alert()` bloqueante (substituído por Toast), `@media (prefers-reduced-motion: reduce)` e `@media print` dedicado para Orçamento/Recibo em PDF.

## 2. Tokens Semânticos
- `--space-xs: 4px`, `--space-sm: 8px`, `--space-md: 12px`, `--space-base: 16px`, `--space-lg: 24px`
- `--radius-card: 10px`, `--radius-control: 8px`, `--radius-pill: 9999px`
- `--text-header: 1.5rem` (24px–26px), `--text-card: 1rem` (16px), `--text-body: 0.875rem` (14px), `--text-cta: 0.85rem` (13.6px)
