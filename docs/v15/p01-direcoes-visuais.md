# VitrineZap v15.0 — Fase P1: Referências Visuais e Direções A/B por Categoria

> **Squads responsáveis:** `research-squad` (curadoria e validação de alvos públicos sem login) + `design-system-squad` (direções A/B tipográficas, estruturais e de momento-assinatura).
> **Objetivo:** Transformar cada demo de "mesmo esqueleto com cores diferentes" em **7 arquiteturas originais reconhecíveis em 3 segundos em silhueta/escala de cinza** (`G-ESQUELETO`, `G-SILHUETA <= 0.35`, `G-PERCEPTUAL >= 6/7`), com **<= 6 controles acima do 1º item** e **<= 12 controles na 1ª tela (`G-1ª-TELA`)**.

---

## 1. Curadoria de Referências Públicas por Categoria (5 por vertical = 35 alvos `[T]`)

Todos os alvos abaixo provêm de premiações/galerias públicas verificadas (Awwwards SOTD / Honorable Mention / Nominee, CSS Design Awards, curadorias Shopify/Webflow), inspecionáveis publicamente sem login (`clean-room` **Pista B** — extraímos somente hierarquia de fluxo, densidade, ritmo, pares tipográficos e anatomia de componente; zero logos, fotos ou textos proprietários).

| Categoria | 5 Referências Premiadas / Curadas (`[T]`) | Fonte & Reconhecimento | Padrões Mobile-First Vencedores Observados |
|---|---|---|---|
| **Oficina (`oficina`)** | 1. **Forge Automotive** (12 Studio)<br>2. **Classics Garage**<br>3. **Project Cars** (Syne™)<br>4. **HB Body Automotive Refinish** (Strictly Studio)<br>5. **Benchmark Auto Services** / **MY GARAGE** | Awwwards SOTD (Out 2026)<br>Awwwards HM<br>Awwwards HM (Nov 2023)<br>Awwwards HM (Set 2024)<br>Awwwards Nominee / HM | Configurador progressivo focado no veículo; iluminação e contraste limpos (não "terminal hacker"); preços em faixa transparente; fluxo em 3 passos (Veículo → Sintoma/Revisão → Orçamento); barra fixa inferior dupla (*Agendar / Chamar*). |
| **Barbearia (`barbearia`)** | 1. **CRISP Barbershop** (Casa Media)<br>2. **Rendezvous Barbers** (Ebda)<br>3. **Porem Barbershop** (BuildwithBlocks)<br>4. **Don Barber & Groom**<br>5. **Balls Barbershop** / **Gentlemen Barber Clubs** | Awwwards HM (Ago 2026)<br>Awwwards HM (Jul 2024)<br>Awwwards Nominee (Dez 2024)<br>Awwwards HM (Mar 2021)<br>Awwwards HM (Jan 2019 / Dez 2015) | Estética editorial masculina de baixo ruído; modal/drawer de agendamento *in-page* (Serviço → Barbeiro → Horário disponível); tipografia display apertada de revista; zero repetição da grade de horários em cada linha. |
| **Padaria (`padaria`)** | 1. **UND NY** (LOWORKS INC.)<br>2. **For the Love of Bread** (NIGHTJAR)<br>3. **Sonoma Bakery** (NIGHTJAR)<br>4. **Bernice Bakery** (Casa Media)<br>5. **Bakery Landing Page** (Gapsy Studio) | Awwwards SOTD (Jul 2024)<br>Awwwards SOTD (Abr 2021)<br>Awwwards HM (Jun 2022)<br>Awwwards HM (Fev 2025)<br>CSSDA Special Kudos (Jun 2026) | Separação clara entre retirada diária (*fornada do dia*) e encomenda agendada (*bolo/festa por data*); tipografia serifada calorosa com micro-interações táteis de textura e cadência lenta. |
| **Moda (`moda`)** | 1. **P448** (By Association Only, Shopify)<br>2. **Permian** (Holographik & Owls, Shopify)<br>3. **Drop Edition** (Square43, Shopify+Next.js)<br>4. **Natty Garb** (Nilesh Thorath)<br>5. **Won Hundred** / **Marcell Von Berlin** | Awwwards SOTD (Out 2024)<br>Awwwards SOTD (Nov 2025)<br>Awwwards E-com HM (Mar 2026)<br>Awwwards HM (Fev 2025)<br>Awwwards Mobile Excellence | Lookbook *image-first* em 2 colunas enxutas (`~260–300px`); seletores de tamanho e variação saem do card da home e vão para filtro persistente *Meu Tamanho* + PDP/Quick-add. |
| **Lanchonete (`lanchonete`)** | 1. **Crav Burgers**<br>2. **Amici** (Beaucoup)<br>3. **Burger & Sauce** (Paperock)<br>4. **Pizza 4P's** (RIDE Inc.)<br>5. **The One. Burger Bcn** | Awwwards SOTD<br>Awwwards SOTD<br>Awwwards HM<br>Awwwards HM<br>Awwwards HM | Página única contínua com *scroll-spy* em vez de troca de lista; hero de apetite de alta legibilidade + *Monte seu Combo* rápido no rodapé; remoção de busca/ordenação redundante. |
| **Pet Shop (`petshop`)** | 1. **VOLDOG**<br>2. **Made By Nacho** (Trellis / Shopify)<br>3. **Boop**<br>4. **Paleo Ridge - Raw Dog Food** (Shopify)<br>5. **LifeWise Pet Food** / **Harringtons** | Awwwards HM<br>Awwwards HM<br>Awwwards HM<br>CSSDA Winner / Awwwards Nom.<br>CSSDA Special Kudos / Nom. | Onboarding / **Carteirinha do Pet** como âncora visual no topo; cálculo automático de porção/duração em dias; fluxo de recorrência limpo sem misturar ação, toggle e filtro na mesma linha. |
| **Floricultura (`floricultura`)** | 1. **Botanic Expo** (Enrico Deiana)<br>2. **FLORA** (Waka & animaticss)<br>3. **Ora The Floral Agency** (Contra Studio)<br>4. **Lior Flower Design**<br>5. **Flower Dose** / **Flùr** | Awwwards SOTD<br>Awwwards HM<br>Awwwards HM<br>Awwwards HM<br>Awwwards Nominees | Grid editorial **assimétrico** (card destaque alto + pares); entrada orientada por **Ocasião + Horário de Corte de Entrega Hoje**; preservação integral do PDP com preview do cartão impresso. |

---

## 2. Tipografia OFL Self-Hosted (`assets/fonts/*.woff2`) — Diagnóstico (`[T]` / `[R]`)

Todas as 7 famílias abaixo possuem licença **SIL Open Font License (OFL)** e subset `latin` enxuto em WOFF2 (`~18–42 KB` no par por categoria, `<= 45 KB` sob `G-TIPO`, `font-display: swap`, 100% cacheado pelo `sw.js`, **zero dependência de fontes Windows**):

- **Oficina:** `Barlow Condensed` (600/700, display industrial) + `Inter` ou `Plus Jakarta Sans` (texto legível); `JetBrains Mono` ou `ui-monospace` **somente** para placa Mercosul e código de OS (preço volta para sans tabular!).
- **Barbearia:** `Playfair Display` ou `Cormorant Garamond` (600/700, editorial masculino) + `Plus Jakarta Sans` (texto/preços limpos).
- **Padaria:** `Fraunces` (600/700, serif calorosa artesanal) + `Lora` ou `Caveat` (acento manuscrito discreto para fornada/recado) + `Nunito Sans`.
- **Moda:** `Archivo` ou `Syne` (caixa alta compacta para títulos) + `Bodoni Moda` (itálico editorial de destaque) + sans limpa.
- **Lanchonete:** `Bricolage Grotesque` ou `Baloo 2` (título arredondado de apetite) + `Plus Jakarta Sans`.
- **Pet Shop:** `Nunito` (700/800, amigável e lúdico) + `Plus Jakarta Sans`.
- **Floricultura:** `Cormorant Garamond` (600/700, serif botânica orgânica) + `DM Sans`.

---

## 3. Direções Visuais A vs. B por Categoria (Checkpoint P1 para Escolha do Leandro)

### 1) Oficina (`oficina`)
- **Opção A — Diagnóstico Claro de Concessionária (Recomendada `[R]`):**
  - *Estética:* Fundo cinza-aço claro (`#F4F6F9`), superfícies brancas com bordas grafite precisas (`#CBD5E1`) e azul técnico (`#0369A1`), sem cara de "terminal escuro". Semáforo verde/âmbar/vermelho em itens de revisão.
  - *Layout & Assinatura (`R1/R2`):* **Ficha do Carro no Topo** (cartão único com modelo/placa Mercosul + slider de KM que atualiza ao vivo a **linha do tempo de revisões** e faixa estimada). Abaixo: jornada limpa em **3 degraus** (Carro → Pacote por KM/Sintoma → Orçamento). **Remove:** busca, seletor "Destaques", stepper de quantidade no PDP e monoespaçada no corpo/preços.
- **Opção B — Cockpit Oficina Carbono Refinado:**
  - *Estética:* Mantém carbono profundo (`#0E131B`), porém substitui toda monoespaçada do título/preço por `Barlow Condensed` + `Plus Jakarta Sans`, reservando mono só à placa e faixa estimada em R$.
  - *Layout & Assinatura:* Mesma **Ficha do Carro + Semáforo DVI**, porém em estética noturna de painel automotivo com acentos âmbar/ciano.

### 2) Barbearia (`barbearia`)
- **Opção A — Agenda em Uma Tela + Lista Editorial (Recomendada `[R]`):**
  - *Estética:* Obsidiana & Latão refinados (`#141210` / `#D97706`) com `Playfair Display` + `Plus Jakarta Sans`.
  - *Layout & Assinatura:* **Assistente Fixo de Agenda no Topo** (Passo 1: Avatar do Barbeiro → Passo 2: Dia local sem bug UTC → Passo 3: Grade **única** de horários disponíveis filtrada pelo expediente/feriados, nunca repetida nos cards). Serviços abaixo em lista editorial ultra-limpa (`Nome • Duração • Preço`), sem cupom em pílula, sem busca e sem stepper no PDP (`<= 6` controles acima do 1º serviço).
- **Opção B — Clube Diurno Off-White & Mogno:**
  - *Estética:* Papel creme quente (`#F9F6F0`), tipografia clássica escura (`#1F1A17`) e detalhes verde-oliva/mogno (`#3F4E3A`), cara de barbearia tradicional de revista impressa.
  - *Layout & Assinatura:* Mesmo funil único de 3 passos sem repetição de horários nos cards.

### 3) Padaria (`padaria`)
- **Opção A — Balcão Lousa & Fornada ao Vivo + Modo Encomenda (Recomendada `[R]`):**
  - *Estética:* Pergaminho quente (`#FBF6EE`), verde/cacau (`#3A2618`), display `Fraunces` com acento manuscrito sutil.
  - *Layout & Assinatura:* **Hero "Fornada ao Vivo"** (contagem regressiva até a próxima fornada das 16h + barra de lote esgotando) + alternância binária **Agora (Balcão)** vs **Encomenda (Data)**. Modo *Agora* renderiza **lousa-cardápio tipográfica** (sem ícones de 50px repetidos); Modo *Encomenda* abre fluxo *date-first* + montador de bolo por camadas.
- **Opção B — Vitrines de Vitral & Cartões Editoriais de Sourdough:**
  - *Estética:* Crema + Terracota de forno (`#9A3412`), fotografia/ilustração ampla em 1 coluna larga de destaque.
  - *Layout & Assinatura:* Banner de fornada + destaque de pão do dia no topo e lista de balcão abaixo sem seção duplicada.

### 4) Moda (`moda`)
- **Opção A — Lookbook 2 Colunas + Filtro "Meu Tamanho" Persistente (Recomendada `[R]`):**
  - *Estética:* Editorial monocromático puro (`#FFFFFF` / `#09090B`), `Archivo` em caixa alta + `Bodoni Moda`, cantos retos (`0px`) e zero sombra pesada.
  - *Layout & Assinatura:* Barra superior **"Meu Tamanho"** (`P | M | G | GG`) que esmaece/destaca peças com estoque disponível em todo o catálogo, seguida por **grid lookbook 2 colunas compacto (`~270px` de altura)** focado na peça (cor/tamanho saem de dentro do card da home e vão para o PDP tela cheia).
- **Opção B — Magazine Assimétrica Streetwear:**
  - *Estética:* Off-white cinza (`#F4F4F5`) + detalhe vermelho-sinal (`#DC2626`), cards horizontais alternados com card hero de coleção em largura total.
  - *Layout & Assinatura:* Filtro "Meu Tamanho" + Wishlist local com cards *image-first* sem seletores internos poluentes.

### 5) Lanchonete (`lanchonete`)
- **Opção A — Página Única Scroll-Spy + Hero Combo (Recomendada `[R]`):**
  - *Estética:* Vermelho apetite (`#B42318`) sobre branco limpo (`#FFF9F7`), tipografia expressiva `Bricolage Grotesque` + `Plus Jakarta Sans`.
  - *Layout & Assinatura:* **"Monte seu Combo"** interativo no topo + barra fixa de frete grátis progressivo + categorias ancoradas em **scroll contínuo (scroll-spy)** sem dropdown de ordenação "Destaques/A-Z".
- **Opção B — Dark Diner Noturno:**
  - *Estética:* Grafite noturno (`#161414`) com amarelo mostarda (`#F59E0B`), visual de hamburgueria artesanal noturna.
  - *Layout & Assinatura:* Hero de combo em destaque + seções contínuas de burguers/porções/bebidas.

### 6) Pet Shop (`petshop`)
- **Opção A — Carteirinha do Pet Primeiro (Recomendada `[R]`):**
  - *Estética:* Menta suave & Esmeralda (`#ECFDF6` / `#0F766E`), bordas orgânicas (`20px`), `Nunito` 800 arredondada.
  - *Layout & Assinatura:* **Carteirinha do Pet** única no topo (Nome/Raça via Dog CEO + Porte + contador real *"ração 15kg dura ~60 dias"* + toggle limpo do Clube -10% separado da ação de compra), filtrando e calibrando todo o catálogo abaixo para aquele pet.
- **Opção B — Clube Bento Editorial Pet:**
  - *Estética:* Fundo creme neutro (`#FAF8F4`) + terracota/turquesa acolhedora para cães e gatos.
  - *Layout & Assinatura:* Cards Bento no topo com perfil Cão/Gato + estimador visual de estoque em dias.

### 7) Floricultura (`floricultura`)
- **Opção A — Home Assimétrica por Ocasião + Corte Entrega Hoje (Recomendada `[R]`):**
  - *Estética:* Sálvia & Marfim botânico (`#F2F7F3` / `#166534`), `Cormorant Garamond` + `DM Sans`, cantos em pétala (`18px 4px`).
  - *Layout & Assinatura:* Selector **"Para quem? Para quando?"** com contagem até a próxima data comemorativa + **relógio de corte para entrega hoje**. Home usa **grid assimétrico** (card hero grande na esquerda/topo + arranjos variados), quebrando 100% a semelhança com a padaria — **preservando integralmente o PDP atual v14**.
- **Opção B — Galeria de Botânica Minimalista Clara:**
  - *Estética:* Branco puro (`#FFFFFF`) com linhas verde-musgo finas (`#14532D`) e espaçamento de catálogo de exposição floral.
  - *Layout & Assinatura:* Faixa de ocasiões editoriais em texto + arranjos verticais altos (`1` coluna destacada + duplas), mantendo o PDP v14 intacto.
