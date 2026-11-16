# P1 — Benchmarks Estéticos Clean-Room e 7 Design Systems Distintos (v12.0)

**Squads:** `design-system-squad` (`@visual-benchmark-scout`, `@category-ds-architect`, `@ds-contrast-validator`) + `task-audit-gate-squad`
**Evidência:** `audit/v12-ds-benchmarks.json` + `audit/v12-verification.json` + `evidence/v12/`

## 1. Inspeção de Referências Estéticas por Categoria
- **Oficina (`Linear` `200 [O]`):** superfície escura carbono (`rgb(8, 9, 10)`), cantos `6px` chanfrados, alto contraste técnico.
- **Moda (`Everlane` `200 [O]`):** galeria branca pura (`rgb(255, 255, 255)`), bordas `0px` estritas, tipografia tracking editorial.
- **Padaria (`Tartine Bakery` `200 [O]`):** minimalismo acolhedor editorial (`0px`/`3px`) + aquecimento pergaminho (`[T]` / `audit/p2-targets-inspection.json`).
- **Barbearia (`Fellow` `200 [O]`):** contraste fosco de precisão artesanal (`8px`/`0px` + pílula).
- **Lanchonete (`Sweetgreen` `200 [O]`):** delivery express de alta energia com CTAs em pílula cheia.
- **Pet Shop & Floricultura:** referências `rover.com` e `bouqs.com` retornaram `403` (`[L]` sem bypass); fundamentadas nos alvos públicos `200 [O]` inspecionados em P2 (`Cobasi` e `Giuliana Flores`).

## 2. Os 7 Design Systems Implementados (`src/brand/design-systems.js` + `styles.css` `[data-ds]`)
| Vertical | `data-ds` | Tema / Superfície | Tipografia Local | Geometria |
|---|---|---|---|---|
| `lanchonete` | `express-craving` | Light (`#FFF8F6` + topo carmesim `#B42318`) | `'Segoe UI'` `800` | Cards `14px`, pílulas `9999px` |
| `padaria` | `artisanal-atelier` | Light pergaminho (`#FBF6EE` + topo `#F7EFE2` borda dupla) | `Georgia, serif` títulos | Cards `10px`, bordas `#DECBB4` |
| `petshop` | `playful-club` | Light clube menta (`#ECFDF6` + topo teal arredondado) | `'Trebuchet MS'` `800` | Cards `22px` (`2px solid #99F6E4`) |
| `oficina` | `precision-telemetry` | **Dark carbono (`#08090A` / `#11161F`)** | `ui-monospace` uppercase | Chanfrado `4px`, zero sombra |
| `barbearia` | `heritage-grooming` | **Dark obsidiana & latão (`#141210` / `#1D1916` / `#D97706`)** | `Georgia, serif` | Caixas `2px` fio de latão |
| `moda` | `minimal-runway` | Galeria monocromática (`#FFFFFF` + `#09090B`) | `Georgia, serif` + tracking `0.08em` | **`0px` reto** em todo componente |
| `floricultura` | `botanical-conservatory` | Mist sálvia (`#F2F7F3` / topo `#EDF5EF`) | `Palatino / Georgia` | Assimétrico folha `18px 4px` |

- **WCAG AA:** `axe-core` = **`0` violações `critical` / `serious`** nos 7 Design Systems + modal FIPE.
