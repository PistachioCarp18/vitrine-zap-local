---
fase: p0-grounding
squad_lead: research-squad
data: 2026-11-16
status: concluido
---

# p00 — Estado Atual Verificado (VitrineZap Local v9 → Base v10)

## 1. Resumo (Baseline Real `[O]`)
O repositório em `C:\Users\JUNIOR_2025\.gemini\antigravity\scratch\vitrine-zap-local` está no commit `f688bbd` (v9.0), com **32/32 testes Node passando** e **8 squads AIOX validados (`0 errors, 0 warnings`)** em `Conselho_Buffet\squads\`. Em produção (`https://vitrine-zap-local.vercel.app/`), o Service Worker `vitrine-zap-v9` responde e suporta reload offline.

## 2. Histórico Git (`git log -10 --oneline` `[O]`)
- `f688bbd` — `feat(v9.0): 8o squad open-apis-geo-squad, BrasilAPI/ViaCEP, OSRM+Haversine x1.32, frete/km, Maps/Waze, FIPE e Open-Meteo`
- `bc656d8` — `feat(v8.0): intervencao Mobile-First critica`
- `c1dd529` — `feat(v7.0): Chameleon Brand Engine`
- `594ad7d` — `feat(v6.0): rebuild mobile-first iFood/Amazon`
- `d97a750` — `feat(v5.0): 30 ciclos AIOX`
- `be986ec` — `feat(v4.0): 10 ciclos AIOX`
- `ea064d1` — `feat(v3.0): UI comercial Stripe/Linear/Polaris`
- `3443783` — `feat: VitrineZap Local v2.0`

## 3. Divergência Notas no Cofre × Código Real (`[O]` / `[L]`)
| Item | O que dizem as referências / prompt | O que existe no disco `[O]` | Tag |
| :--- | :--- | :--- | :--- |
| Notas `60-Sessoes-IA/*v7*`, `*v8*`, `*v9*` | Mencionadas em Relações | Apenas `2026-11-16-Workflow-AIOX-v7...md.gdoc` (Google Doc nativo, não `.md` legível via filesystem); notas v8 e v9 não existem como `.md` em `60-Sessoes-IA/` | `[L]` |
| Presets / Verticais | `verticals/*.json` planejado na v10 | Ainda em `src/presets.js` (`lanchonete`, `padaria`, `petshop`, `oficina`) | `[O]` |
| Motor da Marca | `src/brand/` + `brand.schema.json` planejado | Lógicas espalhadas entre `src/integrations.js`, `src/store.js` e `styles.css` | `[O]` |
| Geo / Cidade | Configurável por loja | `"Sorocaba"` e dicionário/coords ainda hard-coded em `src/geo-apis.js`, `src/presets.js` e `app.js` | `[O]` |
| Lighthouse / WebKit | Previstos no workflow v10 | `playwright-core` + `axe-core` instalados com Chrome local; `webkit` e `lighthouse` CLI ausentes no ambiente Windows | `[L]` |

## 4. Gates de Entrada (p0)
- **Testes baseline (`node --test tests/integrations.test.js`):** **`32/32` PASS** `[O]`
- **Validação AIOX (8 squads):** **`0 errors, 0 warnings`** `[O]`
