# VitrineZap v15.0 — Fase P4: Mobile Real (Chromium + WebKit + 320px) & PWA

## 1. Cobertura de Dispositivos & Restrições Verificadas
- **Motores executados pós-edição final:** Playwright **Chromium (`390×844` e `320×568`)** + **WebKit (`390×844`, `v2388`)** across all 7 categories (`21` runs completos).
- **Tipografia OFL WebKit + Chromium (`G-TIPO`):** `document.fonts.check()` retornou **`true`** em `100%` dos testes nos dois motores (`Barlow Condensed`, `Playfair Display`, `Fraunces`, `Archivo`, `Bodoni Moda`, `Bricolage Grotesque`, `Nunito`, `Cormorant Garamond`, `DM Sans`, `Plus Jakarta Sans`), todas `< 45 KB` por categoria.
- **PWA Instalável (`G-PWA`):** `manifest.webmanifest` atualizado com `id`, `lang: "pt-BR"`, `scope: "./"`, `start_url: "./?demo=1"`, ícones PNG `192×192` e `512×512`, `apple-touch-icon` e `<meta name="theme-color">` dinâmico por categoria.
- **Service Worker v15 (`B15` & `G-PESO`):** `sw.js` (`vitrine-zap-v15`) pré-cacheia núcleo mínimo (`ASSETS`) no `install` e armazena módulos/fontes lazy no primeiro acesso (e `WARM_OFFLINE`), mantendo a transferência inicial gzip+WOFF2 máxima em **`136.3 KB`** (`< 170 KB`).
- **Ergonomia & Acessibilidade:** `0` alvos `< 44px`, `0` overflow horizontal em `390×844` e `320×568`, `0` erros JS, `0` violações `axe-core` críticas/sérias e `firstOrderFlowOk: true` em todas as 7 verticais (`wa.me`).

## 2. Lacunas Declaradas (`[L]`)
- **Hardware físico iOS Safari / Android real:** não executado diretamente neste ambiente Linux/Windows desktop — roteiro de validação em aparelho físico preservado para aceite de campo com lojistas em Sorocaba.
- **PageSpeed Insights API:** cota sem chave retorna HTTP `429`; compensado pelas métricas empíricas locais (`maxTransferKB = 136.3 KB` com fontes embutidas).
