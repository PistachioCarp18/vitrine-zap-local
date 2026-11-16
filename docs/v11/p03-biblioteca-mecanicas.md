# P3 — Biblioteca de Mecânicas e Contratos por Categoria (v11.0)

**Gate:** `task-audit-gate-squad/scripts/audit-runner.js p3` -> **APPROVED**

## 1. Mapa Categoria → Mecânicas (`mechanics/category-map.json`)
| Categoria | Mecânicas Carregadas Sob Demanda |
|---|---|
| `lanchonete` | `item-sheet-addons`, `free-shipping-progress`, `reorder-1-tap` |
| `padaria` | `pickup-window`, `deposit-pix`, `reorder-1-tap` |
| `petshop` | `autoship-reminder`, `reorder-1-tap` |
| `oficina` | `inspection-checklist` |
| `barbearia` | `slot-picker` |
| `moda` | `variant-picker` |
| `floricultura` | `occasion-card-message`, `pickup-window`, `deposit-pix` |

## 2. Contratos JSON (`mechanics/*.json`) e Degradação Zero-API
Todos os 10 contratos definem `id`, `reference.dossie`, `categories`, `zeroApi.degradation` e `budgetKB`, com implementação desacoplada em `src/mechanics/<id>.js` e orquestração em `src/mechanics/registry.js`.

## 3. Atribuição e Licenças (`attribution/LICENSES.md`)
- Pista A restrita a licenças MIT verificadas (`GitHub Primer CSS`, `Radix UI Primitives`, `Andes UI [T]`).
- Shopify Polaris/Dawn mantidos estritamente em Pista B conceitual.
