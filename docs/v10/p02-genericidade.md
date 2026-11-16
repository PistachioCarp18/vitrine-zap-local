---
fase: p2-genericidade
squad_lead: ux-ui-design-squad
suporte: [innovation-squad, research-squad]
data: 2026-11-16
status: aguardando_aprovacao_humana
---

# p02 — Auditoria de Genericidade & Brand-Swap Matrix (Baseline v9)

## 1. Resumo `[O]`
A análise do DOM executado nos 4 presets atuais (`audit/p1-bug-ledger.json`) mostra que a v8/v9 realmente **mudou o esqueleto DOM do catálogo** entre os 4 nichos (`.food-card` vs `.bakery-card` 2 colunas vs `.pet-card` vs `.auto-card`), mas **reprovou no Gate de Genericidade (Score `65 / 100`, abaixo de `80`, com G3 = `11 < 12`)** devido a contraste WCAG AA quebrado em `#EA1D2C`, dependência de Google Fonts CDN, strings hard-coded (`Sorocaba`, `(iFood)`, `Desconto ()`), módulos no markup estático e falta de verticais fora de alimentação.

## 2. Genericity Score Atual (v9 → Alvo v10 ≥ 80) `[O]`
| Dimensão | Nota v9 | Mín. Exigido | Evidência `[O]` / Diagnóstico | Squad Dono |
| :--- | :---: | :---: | :--- | :--- |
| **G1 Estrutura** | `15/20` | `12` | DOM muda entre os 4 verticais, mas está fixo em `app.js` sem `verticals/*.json` nem layouts `agenda-slots`/`variant-grid` | `frontend-squad` |
| **G2 Vocabulário** | `13/20` | `12` | Textos estáticos no HTML (`Sua Sacola`, `Desconto ()`, `OSRM / Sorocaba`) | `research-squad` |
| **G3 Identidade** | **`11/20`** *(Reprovado)* | `12` | `axe-core` apontou 8 falhas `color-contrast`; Google Fonts CDN; falta `brand.schema.json`, tipografia local/sistema e Magic Link `#hash` sem Pix | `ux-ui-design-squad` |
| **G4 Módulos** | `12/20` | `12` | Módulos de pet/padaria existem no HTML com `.hidden` em vez de feature flags `modules`; seletores Demo visíveis ao comprador | `backend-squad` |
| **G5 Prova** | `14/20` | `12` | Faltam verticais fora de alimentação (Barbearia, Moda/Varejo, Floricultura/Estética) | `innovation-squad` |
| **TOTAL** | **`65/100`** | **`≥ 80`** | **REPROVADO NO GATE P2 — Necessita refatoração Brand Engine v2 (`p4`/`p5`)** | `todos` |

## 3. Plano Proposto para Aprovação Humana (Checkpoint 1 — `after_p2_audit`)
1. **Cluster Acessibilidade & Mobile (`P1-01` a `P1-08`):** corrigir `role="tab"`, labels faltantes, `#sort-select >= 16px`, alvos `>= 44x44px`, `<h1>` semântico, e contraste AA real ajustando automaticamente `primary` ou escolhendo `--brand-on-primary` com garantia `>= 4.5:1` (`#EA1D2C` escuro ou tinta `#0F172A` quando AA exigir!).
2. **Motor `Brand Engine v2` (`src/brand/` + `brand.schema.json`):** remover fontes CDN (100% sistema/locais offline), mover dados/geo de Sorocaba para `verticals/*.json` e `geo` configurável, mover Magic Link para **`#hash` sem chave Pix** por padrão e validar importações contra `brand.schema.json`.
3. **Verticais & Zero Vazamento (`verticals/*.json` + feature flags `modules`):** renderizar no DOM **somente** os módulos habilitados no pack ativo; ocultar `#niche-switcher` / Estúdio atrás de `?studio=1` (ou acesso discreto no rodapé) na visão de comprador; adicionar **3 novos verticais fora de alimentação** (**Barbearia — Agenda Slots**, **Moda/Varejo — Variant Grid Tamanho/Cor**, **Floricultura — Encomenda com Data**).
