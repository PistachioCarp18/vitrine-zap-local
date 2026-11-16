---
fase: p1-auditoria-executada
squad_lead: optimization-qa-squad
suporte: [frontend-squad, ux-ui-design-squad]
data: 2026-11-16
status: concluido
---

# p01 — Auditoria Executada em Navegador Real (Playwright Chrome + axe-core)

## 1. Escopo Executado `[O]`
Script executor: `scratch/v10-runner/run_p1_p2_audit.js` contra `https://vitrine-zap-local.vercel.app/`.
- **Viewports Chromium testados:** `320x568`, `360x800`, `390x844`, `412x915`, `800x360` (`evidence/p1/home-*.png`, `cart-step*-360x800.png`, `niche-*-360x800.png`).
- **Offline SW (`context.setOffline(true)` + reload):** **PASS (`offlineReloadOk: true`)** `[O]`.
- **Lacunas declaradas `[L]`:** Motor **WebKit** e **Lighthouse CLI** não executados nesta máquina (apenas Chromium local + `axe-core` executados); simulação interativa de teclado virtual e botão Voltar físico do Android ficam pendentes de verificação final em p6.

## 2. Métricas por Viewport `[O]` (`audit/p1-bug-ledger.json`)
| Viewport | 1º Produto (`top`) | Overflow Horiz. (`scrollWidth > innerWidth`) | Alvos `< 44px` | Inputs `< 16px` | Evidência |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `320x568` | `196px` (PASS) | `false` (`320 / 320`, PASS) | **20** | **1** (`#sort-select` `13px`) | `evidence/p1/home-320x568.png` |
| `360x800` | `196px` (PASS) | `false` (`360 / 360`, PASS) | **20** | **1** (`#sort-select` `13px`) | `evidence/p1/home-360x800.png` |
| `390x844` | `196px` (PASS) | `false` (`390 / 390`, PASS) | **20** | **1** (`#sort-select` `13px`) | `evidence/p1/home-390x844.png` |
| `412x915` | `196px` (PASS) | `false` (`412 / 412`, PASS) | **20** | **1** (`#sort-select` `13px`) | `evidence/p1/home-412x915.png` |
| `800x360` | `196px` (PASS) | `false` (`800 / 800`, PASS) | **20** | **1** (`#sort-select` `13px`) | `evidence/p1/home-800x360.png` |

## 3. Achados & Ledger de Bugs (P1)
| ID | Sev | Tag | Evidência Executada | Squad Dono |
| :--- | :--- | :--- | :--- | :--- |
| `P1-01` (`aria-required-children`) | **S1 (Critical)** | `[O]` | `axe-core` na home e sacola: `role="tablist"` em `#category-pills` sem `role="tab"` nos filhos (`audit/p1-bug-ledger.json:406`) | `frontend-squad` |
| `P1-02` (`label` ausente na sacola) | **S1 (Critical)** | `[O]` | `axe-core` na sacola: 1 elemento de formulário sem `<label>` acessível (`audit/p1-bug-ledger.json:450`) | `frontend-squad` |
| `P1-03` (`color-contrast` WCAG AA) | **S2 (Serious)** | `[O]` | `axe-core`: **8 nós** na home e **11 nós** na sacola abaixo de `4.5:1` (ex.: `#EA1D2C` com texto `#FFFFFF` tem razão `3.96:1`) (`audit/p1-bug-ledger.json:412`) | `ux-ui-design-squad` |
| `P1-04` (`label-content-name-mismatch`) | **S2 (Serious)** | `[O]` | `#open-studio-btn` tem `aria-label="Abrir Estúdio da Marca"` enquanto o texto visível é `"🎨 Demo"` (`audit/p1-bug-ledger.json:418`) | `frontend-squad` |
| `P1-05` (Alvos `< 44x44px`) | **S2** | `[O]` | **20 elementos** abaixo de `44px` (`niche-switcher` 36px, `open-studio-btn` 36px, `search-input` 38px, `pill-btn` 34px, `mini-add-btn` 34px) | `frontend-squad` |
| `P1-06` (Input `< 16px` no mobile) | **S2** | `[O]` | `#sort-select` com `fontSize: "13px"` em `320px–412px` causa auto-zoom no iOS Safari (`audit/p1-bug-ledger.json:64`) | `frontend-squad` |
| `P1-07` (`page-has-heading-one`) | **S3 (Moderate)** | `[O]` | Home do comprador sem `<h1>` visível (`audit/p1-bug-ledger.json:424`) | `frontend-squad` |
| `P1-08` (Suspeito #3 `"Desconto ()"`) | **S3** | `[O]` | HTML da linha de desconto contém `"Desconto ()-R$ 0,00"` quando código está vazio (`audit/p1-bug-ledger.json:73`) | `frontend-squad` |
| `P1-09` (Suspeitos #1, #2, #7 DOM estático) | **S3** | `[O]` | `#pet-reorder-strip`, `#padaria-deposit-wrap` e `#pix-box` ocultos no runtime, mas presentes no markup inicial sem feature flag | `backend-squad` |
| `P1-10` (Suspeito #6 Demo exposto ao comprador) | **S2** | `[O]` | `#niche-switcher` e `#open-studio-btn` visíveis na barra do comprador (`demoBtnVisible: true`), misturando modo vitrine e demonstração | `ux-ui-design-squad` |
