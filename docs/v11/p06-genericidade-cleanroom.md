# P6 — Divergência Funcional, Acessibilidade Axe e Clean-Room Legal (v11.0)

## 1. Varredura Legal Clean-Room (`G-LEGAL`)
- Executada por `task-audit-gate-squad/scripts/audit-runner.js p7` em `src/`, `verticals/`, `mechanics/`, `index.html`, `styles.css`, `app.js`.
- **Resultado:** `G_LEGAL_SCAN: ok (hits: [])` (`0` referências ou nomes de marcas proprietárias no código/UI).

## 2. Divergência de Experiência e Fluxo (`G-DISTINCT`)
- `distinctTapsSet`: `[5, 3]` (`2` comprimentos de fluxo distintos observados: `barbearia` em 3 toques via Reserva Expressa vs. 5 toques padrão).
- `blindDistinctScorePct`: **`100%`** (`7/7` assinaturas únicas de módulos carregados sob demanda em `loadedMechScripts` + `7/7` comportamentos específicos de mecânica verificados ao vivo).

## 3. Acessibilidade `axe-core` WCAG 2.0/2.1 AA
- **Violações `critical`/`serious`: `0`** nos 6 estados auditados:
  - `home-lanchonete`, `cart-drawer-step1`, `cart-drawer-step2`, `merchant-studio`, `floricultura-step2-switches`, `moda-size-guide-modal`.
