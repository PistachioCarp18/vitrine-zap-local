# VitrineZap v11.0 — P0: Baseline Real em Produção (`https://vitrine-zap-local.vercel.app/`)

**Squad Lead:** `optimization-qa-squad` | **Data:** `2026-11-16` | **Dados brutos:** [`audit/p0-metrics-by-vertical.json`](file:///C:/Users/JUNIOR_2025/Projetos/vitrine-zap-local/audit/p0-metrics-by-vertical.json)

---

## 1. Resumo Executivo (5 linhas)
1. Medimos a produção real (`e3f8b28`, v10) em **Chromium** e **WebKit (`playwright webkit v2388`)** nos 5 viewports (`320..800px`) e nas **7 verticais**.
2. Todas as 7 verticais completam o primeiro pedido sem erros JS (`errs=0`), mas **todas exigem exatamente `5` toques idênticos** (`tapsToFirstOrder=5`), comprovando `[O]` que o fluxo é igual por baixo das configs.
3. Em **ambos** os motores (Chromium e WebKit), `padaria` e `floricultura` falharam em `1` alvo de toque (`#pay-deposit-50` checkbox `20x20px`).
4. `petshop` (`300px` Chromium / `298px` WebKit) e `oficina` (`289px`) empurram o 1º produto ~60–72px para baixo por causa do slot contextual acima da barra de busca; WebKit teve LCP até `2532ms` (`barbearia`).
5. A varredura `G-LEGAL` no código fonte ativo retornou `0` menções a marcas de terceiros, enquanto a API PageSpeed Insights retornou HTTP `429` (`[L]` sem chave).

---

## 2. Matriz Executada por Vertical (Produção, `390x844`) `[O]`

| Vertical | Motor | `firstProductTop` | Overflow | Touch `<44px` | Toques 1º Pedido | LCP | Transfer Inicial | Erros JS |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `lanchonete` | Chromium / WebKit | `228px` / `228px` | `false` / `false` | `0` / `0` | `5` / `5` | `1720ms` / `1134ms` | `61.9 KB` / `63.2 KB` | `0` |
| `padaria` | Chromium / WebKit | `228px` / `228px` | `false` / `false` | **`1` / `1`** (`#pay-deposit-50` 20×20) | `5` / `5` | `696ms` / `979ms` | `61.9 KB` / `63.2 KB` | `0` |
| `petshop` | Chromium / WebKit | `300px` / `298px` | `false` / `false` | `0` / `0` | `5` / `5` | `1224ms` / `1633ms` | `61.9 KB` / `63.2 KB` | `0` |
| `oficina` | Chromium / WebKit | `289px` / `289px` | `false` / `false` | `0` / `0` | `5` / `5` | `1380ms` / `1529ms` | `61.9 KB` / `63.2 KB` | `0` |
| `barbearia` | Chromium / WebKit | `228px` / `228px` | `false` / `false` | `0` / `0` | `5` / `5` | `1412ms` / `2532ms` | `61.9 KB` / `63.2 KB` | `0` |
| `moda` | Chromium / WebKit | `228px` / `228px` | `false` / `false` | `0` / `0` | `5` / `5` | `1440ms` / `1802ms` | `61.9 KB` / `63.2 KB` | `0` |
| `floricultura` | Chromium / WebKit | `228px` / `228px` | `false` / `false` | **`1` / `1`** (`#pay-deposit-50` 20×20) | `5` / `5` | `1292ms` / `1343ms` | `61.9 KB` / `63.2 KB` | `0` |

> **Viewports na Home (`lanchonete`, Chromium & WebKit):** `320x568`, `360x800`, `390x844`, `412x915`, `800x360` todos com `top=228px`, `overflow=false`, `touch=0` (`LCP` `725ms–2443ms`). Capturas WebKit salvas em `evidence/v11/p0/webkit-*.png`.

---

## 3. Confronto Nota v10 × Código × Produção (Divergências) `[O]`/`[I]`

| Item | Registrado na Nota v10 | Estado Real na Produção v10 | Tag |
| :--- | :--- | :--- | :---: |
| **Motor WebKit / Safari** | Declarado `[L]` (ausente no Windows) | Agora executado com Playwright `webkit v2388`; revelou `touch=1` (`padaria`/`floricultura`) e LCP `2532ms` em `barbearia`. | `[O]` |
| **Alvos de toque `< 44px`** | Declarado `touch=0` (medido apenas na Home de `lanchonete`) | Na `padaria` e `floricultura`, `#pay-deposit-50` renderiza checkbox `20x20px` visível na inspeção. | `[O]` |
| **Posição do 1º Produto** | Citado `228px` como número único | `228px` em 5 verticais, mas `289px` (`oficina`) e `298–300px` (`petshop`). | `[O]` |
| **Diferenciação de Fluxo** | Genericity `91/100` sobre schema/cards | Todas as 7 verticais possuem o **mesmo** funil linear de `5` toques (`tapsToFirstOrder=5`) e `61.9 KB` carregados integralmente de uma vez (sem dynamic import). | `[O]`/`[I]` |
| **PSI / Lighthouse CLI** | Ausente `[L]` | API PSI retornou `429 Too Many Requests` sem chave; CLI local não instalada `[L]`. | `[L]` |
| **Scan Clean-Room (`G-LEGAL`)** | — | `0` strings de marcas externas (`iFood`, `Amazon`, `Polaris`, `Andes`, `Stripe`, etc.) no código ativo do app. | `[O]` |

## 4. Metas Numéricas Inicializadas para a v11 (`[R]`)
- Manter peso inicial `<= 170 KB` (baseline atual: `61.9 KB` transfer / `210.7 KB` decoded — meta v11 é manter núcleo enxuto e carregar mecânicas sob demanda).
- Zerar `touch < 44px` em **todas as 7 verticais** em Chromium + WebKit (`#pay-deposit-50` corrigido na p4/p5).
- Diferenciar o funil (`taps` / etapas / campos reais) entre verticais de acordo com as referências da P2.
