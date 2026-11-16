# VitrineZap v11.0 — P1: Seleção de Autoridades & Verificação Clean-Room

**Lead:** `research-squad` (`*authority-scout`) | **Suporte:** `innovation-squad` | **Auditoria Cruzada:** `reverse-engineering-squad` (`@reveng-orchestrator` Cipher)
**Data:** `2026-11-16` | **Gate:** Pontuação `0–100` (mínimo `70`, empate favorece DS público/MIT)

---

## 1. Critérios de Pontuação Aplicados (`[R]`)
- Autoridade na categoria (`25`) · Mesma categoria/modelo (`20`) · Observabilidade pública sem login (`15`) · Transferibilidade Zero-API/Offline (`20`) · Licença & Clean-Room (`10`) · Mobile-First nativo (`10`).

> [!IMPORTANT] Verificação Crítica de Licenças (`[T]`)
> Consulta realizada em 2026-11-16 revelou que **Shopify Polaris** e **Shopify Dawn** NÃO utilizam licença MIT irrestrita — ambos usam licença proprietária *source-available* da Shopify que **proíbe uso em lojas/aplicações não vinculadas à Shopify**. Por isso, na v11 eles foram **reclassificados para Pista B** (somente princípios UX abstratos), enquanto **Mercado Libre Andes UI (MIT)**, **GitHub Primer (MIT)** e **Radix UI / shadcn (MIT)** assumem a **Pista A** com atribuição em `attribution/LICENSES.md`.

---

## 2. Matriz de Avaliação — 3 Candidatos por Vertical/Transversal (27 Avaliados) `[T]`/`[I]`

| Demo / Transversal | Candidato 1 (Primária / Pista) | Score | Candidato 2 (Secundária / PME / Pista) | Score | Candidato 3 (Descartado / Pista) | Score | Decisão Final (`research` + `Cipher`) |
| :--- | :--- | :---: | :--- | :---: | :--- | :---: | :--- |
| **1. Lanchonete** | **MenuDino** (Pista B — web público `.menudino.com` sem login `[T]`) | **88** | **iFood** (Pista B — cardápio web público com guest flow + referencial de mercado `[T]`) | **86** | Rappi (Pista B — fecha mobile web cedo atrás de app/login `[T]`) | **71** | **Primária:** iFood (autoridade de sheet/frete/progresso) · **Secundária PME:** MenuDino (zero login + WhatsApp) |
| **2. Padaria / Confeitaria** | **Square Online** (Pista B — web browser App Site público, pickup agendado e controle de janela `[T]`) | **88** | **Starbucks** (Pista B — order-ahead em janelas de 5 min & reorder `[T]`, menos observável em web aberta `[I]`) | **78** | Saipos / Cardápio Web (Pista B — foco PDV delivery geral) | **74** | **Primária:** Square Online · **Secundária:** Starbucks |
| **3. Petshop** | **Chewy Autoship** (Pista B — PDP público com toggle "Subscribe & Save" + gestão por item `[T]`) | **86** | **Cobasi Compra Programada** (Pista B — BR pet UX `"Comprar e Programar"` e apelido por pet `[T]`) | **85** | Petz Assinatura (Pista B — similar à Cobasi, fluxo mais preso a app `[T]`) | **81** | **Primária:** Chewy · **Secundária PME/BR:** Cobasi |
| **4. Oficina Mecânica** | **RepairPal Estimator** (Pista B — estimador público aberto sem cadastro, veículo + peças vs. mão de obra `[T]`) | **84** | **Tekmetric / Shopmonkey** (Pista B — DVI semáforo Verde/Amarelo/Vermelho + aprovação item a item em docs públicas `[T]`; sandbox fechada `[L]`) | **79** | AutoVitals (Pista B — portal B2B fechado `[L]`) | **68** | **Primária:** RepairPal (público sem login) · **Secundária:** Tekmetric (docs/DVI público, sem contornar demo) |
| **5. Barbearia** | **Booksy** (Pista B — web pública permite serviço + barbeiro + horário sem login antes da etapa final `[T]`) | **85** | **Trinks** (Pista B — link público BR de barbearia, cadastro leve só no fechamento `[T]`) | **82** | Fresha (Pista B — intercepta o fluxo exigindo login/OTP ao escolher slot `[T]`) | **74** | **Primária:** Booksy · **Secundária PME/BR:** Trinks |
| **6. Moda / Vestuário** | **Mercado Livre (Andes UI)** (**Pista A MIT** `github.com/mercadolibre` `[T]` + fluxos públicos de variante) | **91** | **Shopify Dawn** (Pista B — grade tamanho/cor; **vetado de Pista A pela licença restritiva Shopify `[T]`**) | **83** | Renner / Zara (Pista B — SPA pesada proprietária) | **72** | **Primária:** Mercado Livre (**Pista A MIT Andes UI** + Pista B fluxos) · **Secundária:** Dawn (apenas Pista B conceitual) |
| **7. Floricultura** | **Giuliana Flores** (Pista B — web pública mobile BR: ocasião, calendário com legenda + CEP prévio e cartão `[T]`) | **87** | **1-800-Flowers** (Pista B — chips de ocasião, countdown same-day e templates de mensagem `[T]`) | **84** | Flowwow (Pista B — marketplace app-centric) | **75** | **Primária:** Giuliana Flores · **Secundária:** 1-800-Flowers |
| **8. Painel do Lojista** *(Transversal)* | **Andes UI (MIT)** + **GitHub Primer (MIT)** + **Radix/shadcn (MIT)** (**Pista A** — tokens/primitivos permissivos `[T]`) | **90** | **Square Dashboard** (Pista B — densidade de KPIs e status toggle) | **80** | Shopify Admin Polaris (Pista B apenas; licença restritiva `[T]`) | **78** | **Primária:** Primer / Andes UI (**Pista A MIT**) · **Secundária:** Square Dashboard (Pista B conceitual) |
| **9. Catálogo + WhatsApp** *(Transversal)* | **WhatsApp Business Catalog** (Pista B — catálogo in-chat + cart summary formatado em texto `[T]`) | **92** | **Mercado Pago Checkout UX Guide** (Pista B — docs públicas de conversão mobile e Pix `[T]`) | **89** | Stripe Checkout / PaymentSheet (Pista B — docs públicas mobile `[T]`) | **86** | **Primária:** WhatsApp Business Catalog · **Secundária:** Mercado Pago Checkout UX Guide |

---

## 3. Auditoria Cruzada (`reverse-engineering-squad` — `@reveng-orchestrator` Cipher)
- **Critérios & Pontuações:** Todos os 9 pares (Primária + Secundária) ultrapassam o corte mínimo `>= 70` (faixa `78–92`).
- **Conformidade Clean-Room (Seção 1):**
  - Pista A restrita exclusivamente a sistemas com **licença MIT verificada** (`Andes UI`, `Primer`, `Radix UI / shadcn`).
  - **Shopify Polaris/Dawn** removidos da Pista A devido à cláusula restritiva da licença Shopify (`[T]`).
  - Alvos sem sandbox aberta (`Tekmetric`/`Shopmonkey`) limitados estritamente a documentação/walkthroughs públicos e pareados com **RepairPal** (widget público aberto sem login).
- **Parecer do Cipher (`[O]`):** Lista aprovada para avançar para a Fase P2 (`run-full-deconstruction` + `rea-harness.js audit-dossier`) mediante aval do Checkpoint Humano 1.

---

## 4. Checkpoint Humano 1 (`after_p1_authority_selection`)
Aguardando aprovação de **Leandro** sobre a lista de alvos acima antes de iniciar a **P2 (Desconstrução REA clean-room e geração dos Dossiês)**.
