# VitrineZap v15.0 — Fase P6: Relatório Final de Originalidade por Categoria

## 1. Resumo
A v15 substituiu o shell único com 7 configs JSON por **7 módulos de home independentes carregados sob demanda (`src/home/<categoria>.js` + `styles/home-<categoria>.css`)**, **11 fontes OFL WOFF2 self-hosted (`<= 42.4 KB` por categoria)**, **momento-assinatura interativo visível sem rolar (`<= 420px`)**, correções de fuso horário local (`America/Sao_Paulo`), PWA instalável (`192/512` + `theme-color` dinâmico), remoção do stepper em PDPs de serviço/reserva (`B06`), estimador de oficina calibrável v2 (`P3`) e auditoria perceptual independente (`7/7` acertos).

## 2. Gates Finais (`audit/v15-all7-verification.json` + `audit-runner.js p7`)
- **`G-ESQUELETO`:** `7/7` esqueletos e módulos `src/home/*.js` distintos (`PASS`).
- **`G-1ª-TELA`:** Máx. `6` controles acima do 1º item (`2–6`) e máx. `12` na 1ª tela (`8–12`) (`PASS`).
- **`G-SILHUETA`:** Correlação máxima de bordas entre os 21 pares = `0.21` (`<= 0.35`), média `0.136` (`PASS`).
- **`G-PERCEPTUAL`:** **`7/7` (`100%`)** de acerto por avaliador cego em telas monocromáticas desfocadas (`PASS`).
- **`G-TIPO`:** `document.fonts.check()` verdadeiro para todas as 7 categorias em Chromium e WebKit; `0` fontes Windows; `0` preços monoespaçados (`PASS`).
- **`G-SERVIÇO` & `G-FUSO`:** `TZ=America/Sao_Paulo` validado às `22:30` sem deslocamento UTC (`B02`); horários filtrados com selo demo (`B05`); stepper oculto em Oficina/Barbearia (`B06`) (`PASS`).
- **`G-PWA` & `G-PESO`:** Manifesto completo `192/512`, ícones e `sw.js` `vitrine-zap-v15`; peso máximo inicial `136.3 KB` (`< 170 KB`) (`PASS`).
- **`AXE_ZERO` & `G-LEGAL` & Regressão:** `0` violações críticas/sérias no `axe-core`; `0` alvos `< 44px` e `0` overflow (`390×844` + `320×568` + WebKit); `G_LEGAL_SCAN` `0` hits; **`67/67` testes unitários passando (`0` falhas)**; `audit-runner.js p7` -> **`APPROVED`**.
