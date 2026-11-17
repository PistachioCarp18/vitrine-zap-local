# VitrineZap v15.0 — Fase P0: Baseline Real, Diagnóstico de Deploy e Correções Fundacionais

## 1. Resumo Executivo (P0)
- **`B01` (Produção vs Repositório + Carimbo de Build):** Verificado via `fetch` direto em `https://vitrine-zap-local.vercel.app/` que a produção recebeu o deploy do commit `7b3da98` (`HTTP 200`, `26531` bytes LF vs `26644` bytes CRLF locais, contendo `src/pdp.js` e `sw.js` `vitrine-zap-v14`) após a auditoria externa anterior. Adicionado carimbo `<meta name="build" content="v15-p0" data-repo="vitrine-zap-local">` em `index.html` e exibição visível `#studio-build-stamp` no Estúdio da Marca.
- **`B02` (Fuso Horário Local):** Eliminado uso de `.toISOString().slice(0, 10)` (UTC) em `src/mechanics/slot-picker.js`, `src/mechanics/pickup-window.js`, `src/category-apis.js` e `app.js`. Novo teste em `tests/v15-p0.test.js` com `TZ=America/Sao_Paulo` às `22:30-03:00` confirma `Hoje === '2026-11-16'` e `DTSTART:20261116T093000`.
- **`B04` e `B15` (PWA Instalável + Pre-cache SW):** Criados ícones PNG `assets/icons/icon-192.png` e `assets/icons/icon-512.png`; atualizado `manifest.webmanifest` com `id`, `lang: "pt-BR"`, `scope`, `start_url: "./?demo=1"` e ícones `192/512`; `<meta name="theme-color">` atualizado dinamicamente em `applyBrandToDom()`; `sw.js` (`vitrine-zap-v15-p0`) passa a pré-cachear todos os `src/mechanics/*.js` e `verticals/*.json`.
- **`B07` e `B08` (Modo Demo e Truncamentos 390px):** Modo demo (`?demo=1` ou padrão da vitrine) avalia expediente dentro do turno da vertical (`statusClosed: false`, `"Aberto • Demo"` nas 7 verticais). Topbar `.brand-text` empilhado + `.store-meta-text` sem `ellipsis` forçado zeraram truncamentos em `390×844` (`truncations: []` nas 7 demos).

## 2. Medição Estrutural P0 nas 7 Demos (`390×844`, Chromium — `audit/v15-p0-baseline.json`)

| Demo | 1º item (px) | Controles acima 1º item | Controles na 1ª tela | Altura card (px) | Título / Preço (Pilha Atual) | Sequência de Esqueleto | Status & Truncamentos |
|---|---|---|---|---|---|---|---|
| `lanchonete` | `308` | `12` | `17` | `121–169` | `"Segoe UI"` / `ui-monospace` | `topbar > meta > context > filter > grid > cart` | `Aberto • Demo` (`0` trunc.) |
| `padaria` | `309` | `11` | `16` | `257–257` | `Georgia` / `ui-monospace` | `topbar > meta > context > filter > grid > cart` | `Aberto • Demo` (`0` trunc.) |
| `petshop` | `269` | `13` | `22` | `179–233` | `"Trebuchet MS"` / `ui-monospace` | `topbar > meta > context > filter > grid > cart` | `Aberto • Demo` (`0` trunc.) |
| `oficina` | `273` | `11` | `14` | `252–271` | `ui-monospace` / `ui-monospace` | `topbar > context > filter > grid > cart` | `Aberto • Demo` (`0` trunc.) |
| `barbearia` | `334` | `13` | `23` | `199–240` | `Georgia` / `ui-monospace` | `topbar > meta > context > filter > grid > cart` | `Aberto • Demo` (`0` trunc.) |
| `moda` | `242` | `8` | `26` | `412–504` | `Georgia` / `ui-monospace` | `topbar > context > filter > grid > cart` | `Aberto • Demo` (`0` trunc.) |
| `floricultura` | `300` | `12` | `17` | `257–257` | `"Palatino Linotype"` / `ui-monospace` | `topbar > meta > context > filter > grid > cart` | `Aberto • Demo` (`0` trunc.) |

**Achados objetivos da baseline P0 `[O]`:**
1. **Esqueleto compartilhado confirmado:** `5/7` demos têm a mesma sequência de blocos e as outras `2/7` apenas suprimem `.store-meta-strip`.
2. **Orçamento `G-1ª-TELA` (`<= 6` acima / `<= 12` na 1ª tela) reprovado na baseline:** todas as 7 estão entre `8–13` acima do 1º item e `14–26` na 1ª tela — será o foco de redução estrutural na Fase **P2**.
3. **Tipografia P0 (`G-TIPO`):** todas usam pilhas de sistema dependentes de Windows (`Segoe UI`, `Trebuchet MS`, `Palatino Linotype`) e `ui-monospace` nos preços — substituição planejada por fontes **OFL WOFF2 self-hosted** em `assets/fonts/` na Fase **P2**.
4. **Correlação de borda em `390×844` (amostragem `65×140` px Sobel):** média `0.134`, maior par `padaria × floricultura` (`0.278`).

## 3. Evidências Pós-Edição P0
- **Testes automatizados (`node --test`):** `62/62` passando (`0` falhas, `0` pulados, `1048.76ms`).
- **Screenshots baseline (`390×844`):** `evidence/v15/p0-baseline/*.png`.
