# VitrineZap v15.0 — Fase P5: Validação Perceptual Independente, Gates & Clean-Room

## 1. Teste Perceptual Cego (`G-PERCEPTUAL` — Subagente Isolado)
Um subagente avaliador independente (`conversationId: 8ac0cbf2-cac1-4b7c-a1d3-0eb4e0700f61`), sem acesso ao mapeamento nem ao código, recebeu as **7 telas em escala de cinza reduzida e desfocada (`195×422`, raio de desfoque 7×7px)** em `evidence/v15/blind/screen-1.png` .. `screen-7.png` (embaralhadas via `[4, 1, 6, 2, 7, 3, 5]`):

| Arquivo Cego | Categoria Real (`[O]`) | Classificação do Avaliador Cego | Acerto |
|---|---|---|---|
| `screen-1.png` | `barbearia` | `barbearia` (polaridade escura + agenda 3 passos topo + lista serviços) | ✅ |
| `screen-2.png` | `moda` | `moda` (rail retangular tamanhos + grid lookbook 2 col + CTA cheia) | ✅ |
| `screen-3.png` | `petshop` | `petshop` (carteirinha arredondada pet no topo + porte P/M/G + cards arredondados) | ✅ |
| `screen-4.png` | `oficina` | `oficina` (ficha do veículo + slider KM + 3 degraus + lista DVI) | ✅ |
| `screen-5.png` | `floricultura` | `floricultura` (seleção de ocasião + card hero em destaque + grade 2 col) | ✅ |
| `screen-6.png` | `padaria` | `padaria` (bloco escuro forno/barra + alternância balcão/encomenda + lista unificada `+`) | ✅ |
| `screen-7.png` | `lanchonete` | `lanchonete` (hero banner entrega/combo + 3 chips seção + miniaturas direita `+`) | ✅ |

**Score Perceptual Independente:** **`7/7` (`100%`, `0` confusões repetidas)** — meta era `>= 6/7`.

## 2. Comparativo Antes (P0) × Depois (P5) em `390×844`

| Categoria | Controles acima 1º item (P0 → P5) | Controles 1ª tela (P0 → P5) | Esqueleto DOM (P5) | Tipografia Display / Preço (P5) | Peso Inicial Gzip+WOFF2 |
|---|---|---|---|---|---|
| `oficina` | `11 → 2` | `14 → 8` | `catalog-grid ofi-dvi-list` | `Barlow Condensed` / `Plus Jakarta Sans` | `127.6 KB` |
| `barbearia` | `13 → 6` | `23 → 12` | `catalog-grid barb-ledger` | `Playfair Display` / `Plus Jakarta Sans` | `128.0 KB` |
| `padaria` | `11 → 2` | `16 → 8` | `catalog-grid pad-lousa-list` | `Fraunces` / `Plus Jakarta Sans` | `123.4 KB` |
| `moda` | `8 → 6` | `26 → 12` | `catalog-grid moda-lookbook-grid` | `Archivo` + `Bodoni Moda` / `Plus Jakarta Sans` | `135.1 KB` |
| `lanchonete` | `12 → 4` | `17 → 8` | `catalog-grid lanch-stream-grid` | `Bricolage Grotesque` / `Plus Jakarta Sans` | `126.7 KB` |
| `petshop` | `13 → 5` | `22 → 10` | `catalog-grid pet-club-grid` | `Nunito` / `Plus Jakarta Sans` | `121.1 KB` |
| `floricultura` | `12 → 4` | `17 → 9` | `catalog-grid flo-gallery-grid` | `Cormorant Garamond` / `DM Sans` | `129.4 KB` |

- **Correlação de Silhueta (`G-SILHUETA`):** Máximo entre os 21 pares caiu para **`0.21`** (`barbearia × lanchonete`, limite `<= 0.35`); média **`0.136`**. O par anteriormente idêntico (`padaria × floricultura`) ficou abaixo do teto em todos os pares.
- **Varredura Clean-Room (`G_LEGAL_SCAN`) + Gate `p7` (`task-audit-gate-squad`):** Veredito **`APPROVED`**, `hits: []`, `failures: []`.
