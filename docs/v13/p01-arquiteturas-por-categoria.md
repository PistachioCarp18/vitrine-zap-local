# VitrineZap v13.0 — Arquiteturas Mobile-First Distintas por Categoria

**Squads:** `research-squad`, `innovation-squad`, `reverse-engineering-squad`, `design-system-squad`, `open-apis-geo-squad`, `frontend-squad`, `optimization-qa-squad`, `task-audit-gate-squad`

## 1. Benchmarks Pesquisados & Limites Clean-Room
- **Barbearia (Ref. AppBarber `[O]`/`[T]`):** funil visual em etapas `1. Barbeiro → 2. Data → 3. Horário`, avatares filtráveis de barbeiros e faixa de dias clicável acima da lista de serviços em tema escuro obsidiana & latão (`heritage-grooming`).
- **Padaria & Lanchonete (Ref. iFood / Express `[T]`):** trilha horizontal com mini-cards ilustrados (*Fornadas Mais Pedidas / Destaques na Brasa*) em 1 toque acima do catálogo + ilustrações vetoriais multi-camadas (`src/illustrations.js`).
- **Moda (Ref. Insider Store `[T]` / `insiderstore.com.br` `[L]` timeout respeitado):** barra superior de benefícios (`Frete Grátis`, `Antiodor`, `Térmico`, `Não Amassa`), seleção de cor por *swatch* com tintagem vetorial ao vivo e **Provador Virtual (Altura × Peso -> P/M/G/GG)** dentro de `#size-guide-modal`.
- **Floricultura (Ref. Giuliana Flores `200 [O]`):** faixa postal de urgência (*Entrega Expressa Hoje*), anéis circulares por ocasião (`Todas`, `Romântico`, `Aniversário`, `Agradecimento`), arranjos vetoriais e **preview ao vivo do cartão dedicatória** no checkout (`#card-live-preview`).
- **Oficina Mecânica (Telemetria DVI & Catálogo FIPE):** HUD de telemetria carbono com slider de quilometragem (`10k–120k km`) recalculando revisão preventiva ao vivo + simulador em cascata FIPE (`#fipe-estimator-modal`).
- **Pet Shop:** switch ao vivo de assinatura `Clube -10% OFF` recalculando preços de ração/serviços na hora + inferência automática de porte por raça (`Dog CEO`).

## 2. Verificação Pós-Edição (`FATO OBSERVADO`)
- **`node --test`:** **`57/57` testes passando** (`0` falhas).
- **Playwright Chromium + WebKit (`v2388`):** `uniqueDesignSystemsRendered = 7`, `smallTargetsCount = 0`, `docOverflow = false`, `0` erros JS em todas as verticais e viewports, peso gzip `86.4 KB` (`<= 170 KB`).
- **`axe-core` WCAG A/AA:** **`0` violações `critical` / `serious`** nos 7 Design Systems + modal FIPE.
- **Gate P7 (`audit-runner.js p7`):** **`APPROVED`** (`G_LEGAL_SCAN = 0`, loop REJECTED -> correção de comentário em `styles.css` -> APPROVED).
