---
product: VitrineZap Local
version: 7.0.0
cycles_completed: 40+
squad_owner: ux-ui-design-squad + innovation-squad + research-squad + frontend-squad + backend-squad + integration-squad + optimization-qa-squad
engine: Chameleon Brand Engine (4 Polymorphic Domain Modes + 4 Visual Archetypes + WCAG AA Auto-Contrast)
---

# DESIGN.md — VitrineZap Local v7.0 (Chameleon Brand Engine & Mobile-First)

## 1. Arquitetura Camaleão: 4 Arquétipos Visuais Completos (`brandArchetype`)
Cada nicho aplica seu arquétipo completo (raios, bordas, fundos, fontes, sombras e acentos):
- **`high-energy-food`:** Cantos `14px`, sombras quentes suaves, acento `#EA1D2C`, pílulas vibrantes, barra de frete grátis gamificada e seletor de ponto/adicionais.
- **`artisanal-warm`:** Fundo creme editorial `#FAF7F2`, superfície `#FFFFFF`, acento `#B45309`, títulos serifados (`Fraunces`), bordas delicadas `10px`, agendador de encomenda + sinal 50% Pix.
- **`playful-soft`:** Superfícies suaves `#F0FDF4` / `#F8FAFC`, cards `20px`, acento esmeralda/ciano `#0D9488`, perfil do pet + ciclo de duração + recompra em 1 toque.
- **`industrial-precision`:** Estética técnica inspirada em Linear/Vercel, cantos `6px`, bordas `1px solid`, números/placas/preços em `JetBrains Mono` (`tabular-nums`), acento `#2563EB`, pré-orçamento & triagem de OS válida por 7 dias.

## 2. Motor Matemático de Auto-Contraste WCAG AA
`computeAccessibleBrandTokens(hexColor)` calcula luminância relativa ($L = 0.2126R + 0.7152G + 0.0722B$) para qualquer cor HEX escolhida, garantindo `--brand-on-primary` (`#FFFFFF` ou `#0F172A`) com razão de contraste `>= 4.5:1`, mais `--brand-surface-tint` (`8%`) e `--brand-border-tint` (`26%`).

## 3. Guardrails Mobile-First Reais
- `min-height: 100dvh` e Bottom Sheets com `max-height: 88dvh`, `overscroll-behavior: contain` e trava `overflow: hidden` no `body`.
- `font-size: 16px` em inputs/selects/textareas mobile para prevenir auto-zoom do iOS Safari.
- `touch-action: manipulation` e alvos `>= 44x44px` em steppers, filtros e botões de fechar.
- Listener `window.visualViewport` para acomodar o teclado virtual sem quebrar a barra inferior.
- Auto-centralização de categoria ativa com `scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })`.
