# VitrineZap v10.0 — P5: Demos Autênticas (7 Verticais / Zero Vazamento Cross-Vertical)

**Status:** CONCLUÍDO `[O]`

## Verticais & Packs (`verticals/*.json` <-> `src/presets.js`)
| Vertical | Layout Catálogo (`data-layout`) | Tipografia | Módulos Exclusivos | Status Testes/Playwright |
|---|---|---|---|---|
| `lanchonete` | `list-thumb` (`food-card`) | Geometric Sans | `freteKm`, `splitBill` | `[O]` Validado |
| `padaria` | `editorial-grid` (`bakery-card`, 2 cols) | Serif Editorial | `freteKm`, `sinalPix`, `agendamento` | `[O]` Validado |
| `petshop` | `pet-packs` (`pet-card`, chips P/M/G e pesos) | Humanist Sans | `freteKm`, `recompra` | `[O]` Validado |
| `oficina` | `checklist-table` (`auto-card`, SKU + peças/MO) | Mono Industrial | `osTecnica` | `[O]` Validado |
| `barbearia` **(Nova)** | `agenda-slots` (`agenda-card`, slots de horário) | Serif Clássica | `agendamento` | `[O]` Validado |
| `moda` **(Nova)** | `variant-grid` (`fashion-card`, grade tamanhos 2 cols) | Geometric Sans | `freteKm` | `[O]` Validado |
| `floricultura` **(Nova)** | `editorial-grid` (`bakery-card`, cartão dedicatória) | Serif Editorial | `freteKm`, `sinalPix`, `agendamento` | `[O]` Validado |

- Todos os 7 arquivos em `verticals/*.json` passam `validateBrandConfig()` (`[O]` Teste 33).
- Módulos contextuais (`#vertical-context-slot`, `#cart-modules-top`, `#cart-split-slot`) são montados dinamicamente **apenas** quando ativados em `state.modules`, zerando vazamentos no DOM (`[O]` `audit/p7-verification.json`).
