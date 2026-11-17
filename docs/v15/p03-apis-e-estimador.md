# VitrineZap v15.0 — Fase P3: APIs Reais Validadas e Estimador Oficina v2

## 1. Matriz de Validação de APIs Candidatas (HTTP 200 Real + `CORS *` + Sem Chave + Fallback Offline)

| API | Endpoint Testado (`[O]`) | HTTP / CORS (`Origin`) | Decisão | Aplicação & Degradação Zero-API |
|---|---|---|---|---|
| **FIPE Parallelum + BrasilAPI** | `/fipe/marcas/v1/carros` | `200` / `CORS *` | Aprovada | Cascata Marca → Modelo → Ano → Preço na Oficina; placa **nunca** enviada a terceiros (`offline-fipe` fallback) |
| **BrasilAPI Feriados** | `brasilapi.com.br/api/feriados/v1/2026` | `200` / `CORS *` | Aprovada | Bloqueio real de feriados na Barbearia + contagem próxima data na Floricultura (`offline-holidays` fallback) |
| **Dog CEO** | `dog.ceo/api/breeds/list/all` | `200` / `CORS *` | Aprovada | Catálogo de raças e inferência de porte no Pet Shop (`offline-breeds` fallback) |
| **Open-Meteo** | `api.open-meteo.com/v1/forecast?...` | `200` / `CORS *` | Aprovada | Temperatura real na Moda (`23°C • Coleção Tech`) e Padaria (`pão de queijo + café`); alerta chuva (`rainAlert`) |
| **Open Food Facts** | `world.openfoodfacts.org/api/v2/product/{ean}.json` | `200` / `CORS *` | Aprovada | `fetchProductNutritionOrAllergens` em `src/category-apis.js` (`offline-padaria` fallback quando sem rede) |
| **GBIF Taxonomy** | `api.gbif.org/v1/species/match?name=Rosa` | `200` / `CORS *` | Aprovada | `fetchBotanicalTaxonomy` em `src/category-apis.js` (`offline-botanica` fallback quando sem rede) |
| **ViaCEP + OSRM** | `viacep.com.br` / `router.project-osrm.org` | `200` / `CORS *` | Aprovada | Roteirização local com fallback `Haversine × 1.32` e busca local |
| **TheCatAPI** | `api.thecatapi.com/v1/breeds` | **`403`** | **Descartada (`[L]`)** | Bloqueio 403 sem API key; mantida fora do código conforme Anti-Alucinação #4 |

## 2. Estimador Preditivo de Oficina v2 (`src/category-apis.js` + `app.js`)
- `calibrateMaintenanceEstimate(estimate, closedOrders, minSamples = 8)` calibra automaticamente as faixas mín/média/máx (`ratio` limitado a `[0.70, 1.45]`) assim que há `>= 8` ordens de serviço locais fechadas em `VitrineStore`.
- Abaixo de `8` OS, declara explicitamente `"Estimativa ilustrativa (base tabela FIPE + KM • calibra após 8 OS fechadas)"` (`R8`).
- Toda placa informada fica exclusivamente local para PDF / mensagem WhatsApp do cliente.

## 3. Evidência
- Validado pelos testes em `tests/v15-p3-all7.test.js` (`67/67` aprovados).
