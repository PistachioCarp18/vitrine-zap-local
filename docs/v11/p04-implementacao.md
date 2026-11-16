# P4 — Implementação Modular e Composição no Estúdio (v11.0)

## 1. Carregamento Sob Demanda e Isolamento (`src/mechanics/registry.js`)
- `resolveActiveMechanics(state)` filtra as mecânicas permitidas para a categoria ativa, impedindo vazamento cross-vertical (ex.: `barbearia` não aceita `item-sheet-addons` nem `autoship-reminder`).
- `loadMechanicsOnDemand(ids)` injeta dinamicamente apenas os scripts `<script src="./src/mechanics/<id>.js">` necessários para a vertical em tela.

## 2. Divergência Real de Fluxo nas 7 Verticais
- **Barbearia (`slot-picker`):** Fluxo expresso em **3 toques** — clicar em serviço/horário abre a sacola diretamente na Etapa 2 (*Reserva Expressa*) com seletor de dia, profissional e botão `.ics` offline (`#download-booking-ics-btn`).
- **Padaria & Floricultura (`deposit-pix`, `pickup-window`, `occasion-card-message`):** Substituição do checkbox `20x20px` capturado na P0 pelo `<button id="pay-deposit-50" role="switch" class="deposit-switch-btn">` medindo **`358x52px`** (`>= 44px`), janela de retirada filtrada por hora, filtro por ocasião, templates de dedicatória, contador `0/160` e switch `#surprise-gift-switch`.
- **Oficina (`inspection-checklist`):** Emblemas de severidade semáforo e switch por item na sacola (`.os-approve-btn`, `Aprovado` / `Adiado`) recalculando `#total-val` ao vivo.
- **Pet Shop (`autoship-reminder`):** Cálculo ao vivo da duração em dias (`Dura ~N dias`) por peso + porte do pet e exportação `.ics` local para recompra.
- **Moda (`variant-picker`):** Chips de tamanho em `role="radiogroup"` e modal acessível de Guia de Medidas (`#size-guide-modal`).
- **Lanchonete (`item-sheet-addons`, `free-shipping-progress`, `reorder-1-tap`):** Sheet de adicionais, barra de progresso para entrega grátis e recompra em 1 toque.

## 3. Painel do Lojista (`#merchant-studio-modal`)
- Seletor **"Mecânicas Ativas"** permitindo ligar/desligar módulos permitidos da categoria em tempo real com cache offline atualizado em `sw.js` (`vitrine-zap-v11`).
