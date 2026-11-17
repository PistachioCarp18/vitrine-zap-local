# VitrineZap v14.0 — PDPs Mobile-First por Categoria (`p01-pdp-por-categoria`)

## Objetivo
Substituir o modal único genérico de item (`Observação: Ex: Sem cebola...`) por experiências de detalhe de produto/serviço (`#item-modal` governado por `src/pdp.js`) adaptadas à jornada e ao Design System de cada uma das 7 categorias.

## Modos e Anatomias Implementados (`src/pdp.js`)

| Vertical | `getPdpMode(v)` | Experiência ao Tocar no Item | Elementos Exclusivos Observados |
|---|---|---|---|
| **Moda** (`moda`) | `full-page` | Navegação para PDP em tela cheia (`#item-modal.pdp-fullpage` + `← Voltar para Coleção`) | Galeria 3 ângulos (`Vista Frontal`, `Costas & Caimento`, `Macro Fibra`) recolorida ao vivo pela swatch selecionada, seleção de tamanho, botão inline *Provador Virtual & Tabela cm*, 3 acordeões (*Composição & Tecido*, *Cuidados & Lavagem*, *Entrega & Troca Fácil*) e recado para presente recolhido |
| **Floricultura** (`floricultura`) | `full-page` | PDP botânico em tela cheia (`← Voltar aos Arranjos`) | Galeria 3 ângulos (`Arranjo Completo`, `Proporção Mesa/Vaso`, `Pétalas & Kraft`), seletor de porte em camadas (`Clássico`, `Luxo (+50% flores)`, `Premium + Bombons`), campo de dedicatória inline com `#pdp-card-preview` ao vivo e acordeões de frescor/cuidados |
| **Oficina** (`oficina`) | `technical-sheet` | Sheet técnico de Ordem de Serviço | Hint de modelo/KM ativo + badge de severidade, flags rápidas (`+ Guardar peças substituídas`, `+ Ligar antes se surgir extra`, `+ Incluir check 30 pontos grátis`), acordeões técnicos de bancada e garantia OS |
| **Barbearia** (`barbearia`) | `booking-sheet` | Sheet de reserva e protocolo de atendimento | Duração + profissional em destaque, etapas numeradas do serviço (`1..4`), tags de preferência e grade de horários com CTA `Confirmar Horário • R$ X` |
| **Pet Shop** (`petshop`) | `club-sheet` | Sheet de compra e recorrência pet | Pacotes com cálculo de duração (`1kg`, `3kg`, `15kg`) para o porte ativo, switch inline `Clube Recorrente -10% OFF`, resumo nutricional e campo opcional colapsável |
| **Padaria** (`padaria`) | `bakery-sheet` | Sheet rápido de confeitaria/fornada | Selo de rendimento (`Serve 15 fatias`), opcionais com `20x20px` em linha `>=44px` e recado opcional sem obrigatoriedade |
| **Lanchonete** (`lanchonete`) | `craving-sheet` | Sheet expressa de personalização | Variantes (ex. ponto da carne), adicionais com valor e campo de observação aberto por padrão |

## Evidências de Verificação (pós-edição final)
- **Testes automatizados (`node --test`):** `60/60` passando (`tests/integrations.test.js`, `tests/mechanics/mechanics.test.js`, `tests/design-systems-and-apis.test.js`, `tests/pdp.test.js`), `0` falhas, `0` skipped.
- **Playwright (Chromium + WebKit em `390x844` + desktop/mobile viewports + 6 PDPs):**
  - `7` Design Systems únicos renderizados (`blindDistinctScorePct: 100`).
  - `smallCount: 0` em todos os 6 PDPs (`moda`, `floricultura`, `oficina`, `barbearia`, `petshop`, `padaria`) e `small: 0`, `ovf: false`, `errs: 0` em WebKit nas 7 verticais.
  - `axe-core`: `0` violações críticas ou sérias em todas as 14 checagens (7 homes + modal FIPE + 6 PDPs).
  - Transferência inicial máxima observada: `94 KB` (limite `< 170 KB`).
  - Screenshots mobile em `evidence/v14/pdp/{moda,floricultura,oficina,barbearia,petshop,padaria}-pdp.png`.
- **Auditoria Independente (`audit-runner.js p7`):** Veredito **`APPROVED`** (`G_LEGAL_SCAN`, `G_MOBILE_AND_WEBKIT`, `G_PESO_UNDER_170KB`, `G_DISTINCT`, `AXE_ZERO` todos `ok: true`, `failures: []`).
