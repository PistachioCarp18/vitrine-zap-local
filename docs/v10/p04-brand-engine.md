# VitrineZap v10.0 — P4: Motor White-Label Brand Engine v2

**Status:** CONCLUÍDO `[O]`

## 1. Arquitetura Implementada
- **Contrato JSON Schema:** [`src/brand/brand.schema.json`](file:///C:/Users/JUNIOR_2025/.gemini/antigravity/scratch/vitrine-zap-local/src/brand/brand.schema.json) (`schemaVersion: "1.0"`). Define 7 verticais (`lanchonete`, `padaria`, `petshop`, `oficina`, `barbearia`, `moda`, `floricultura`, além de `custom`), 4 stacks tipográficas offline (`geometric`, `humanist`, `serif`, `mono`), 3 raios (`sharp`, `soft`, `round`), densidade, vocabulário dinâmico, módulos ativáveis (`freteKm`, `splitBill`, `sinalPix`, `recompra`, `agendamento`, `osTecnica`) e bloco `geo`.
- **Motor de Tokens 3 Camadas (`[O]`):** [`src/brand/brand-engine.js`](file:///C:/Users/JUNIOR_2025/.gemini/antigravity/scratch/vitrine-zap-local/src/brand/brand-engine.js) implementa:
  - `generateBrandTokens(brand)`: calcula contraste em tempo real; quando a cor-semente não atinge 4.5:1 contra `#FFFFFF` (caso de `#EA1D2C` = 3.96:1), escurece `actionBg` para `>= 4.7:1` e deriva `inkAccent` com `>= 4.7:1` sobre `surfaceTint`.
  - `FONT_STACK_MAP`: pilhas locais de sistema sem requisições externas ao Google Fonts (`0` CDN requests comprovado em runtime Playwright).
  - `validateBrandConfig(raw)`: bloqueia payloads nulos, HEX inválidos e imagens `dataUri` > 150KB.
  - `encodeMagicHash` / `decodeMagicHash`: compartilha personalização em `#brand=...` (nunca em `?query` e sem expor `pixKey` por padrão).
- **Geo Configurável (`[O]`):** [`src/geo-apis.js`](file:///C:/Users/JUNIOR_2025/.gemini/antigravity/scratch/vitrine-zap-local/src/geo-apis.js) agora aceita `geo` dinâmico (`lat`, `lon`, `feeTable`, `offlineDictionary`, `city`, `state`) com retrocompatibilidade preservada para os dados locais de Sorocaba.
