# P5 — Matriz Mobile Real: Chromium + WebKit (`v2388`) + Axe (v11.0)

**Fonte:** `audit/v11-verification.json` + screenshots em `evidence/v11/p5-p6/`

## 1. Resultados nas 7 Verticais (`390x844`, Chromium e WebKit)
| Vertical | `firstProductTop` (CR / WK) | Touch `< 44px` | Overflow | Toques 1º Pedido | Peso Inicial Gzip (WK) | Erros JS |
|---|---|---|---|---|---|---|
| `lanchonete` | `228px` / `228px` | `0` / `0` | `false` | `5` | `67.4 KB` | `0` |
| `padaria` | `228px` / `228px` | `0` / `0` | `false` | `5` | `67.6 KB` | `0` |
| `petshop` | `264px` / `264px` | `0` / `0` | `false` | `5` | `67.1 KB` | `0` |
| `oficina` | `263px` / `263px` | `0` / `0` | `false` | `5` | `66.5 KB` | `0` |
| `barbearia` | `228px` / `228px` | `0` / `0` | `false` | `3` | `66.5 KB` | `0` |
| `moda` | `266px` / `266px` | `0` / `0` | `false` | `5` | `66.3 KB` | `0` |
| `floricultura` | `266px` / `266px` | `0` / `0` | `false` | `5` | `67.9 KB` | `0` |

## 2. Matriz dos 5 Viewports (`320x568`, `360x800`, `390x844`, `412x915`, `800x360`)
- Chromium e WebKit: `0` controles `< 44px`, `docOverflow = false`, `firstProductTop = 228px` e `0` erros JS/404 em todos os 5 viewports.
- Defeitos reais corrigidos durante o loop P5:
  1. `favicon.ico` 404 no primeiro carregamento (`320x568`) eliminado com SVG data URI inline em `index.html`.
  2. Espaçamento de `#vertical-context-slot` ajustado em `styles.css` trazendo `petshop` (`300px -> 264px`) e `oficina` (`289px -> 263px`) para `<= 280px`.
  3. Subpixel rounding WebKit no input `#cust-name` (`43.x px < 44px` na Barbearia) corrigido elevando `.text-input, .select-input, .select-compact` para `min-height: 45px`.

## 3. Lacunas `[L]` Registradas
- Teste em aparelho físico real (Android / iOS Safari) e gravação manual de 10 minutos permanecem `[L]` para conferência humana pós-deploy.
- PageSpeed Insights API pública retornou `HTTP 429` no baseline P0 (`[L]`).
