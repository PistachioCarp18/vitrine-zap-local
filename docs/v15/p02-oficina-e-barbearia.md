# VitrineZap v15.0 — Fase P2 (Lote 1): Templates Originais de Oficina e Barbearia

> **Checkpoint Visual (Lote 1):** Construção e auditoria independente dos **2 primeiros templates por categoria** escolhidos no Checkpoint P1 (`oficina` Opção A + `barbearia` Opção A), antes de avançar para Padaria, Moda, Lanchonete, Pet Shop e Floricultura.

## 1. Resumo das Mudanças Estruturais (`R1`–`R10`)

### 1) Oficina (`src/home/oficina.js` + `styles/home-oficina.css`) — *Diagnóstico Claro de Concessionária (Opção A)*
- **Esqueleto próprio:** Topbar claro `#FFFFFF` → **Momento-Assinatura: Ficha do Carro (`BR • MER-4S20` + cena SVG de oficina + botão FIPE + slider de KM movendo linha do tempo `10k | 40k | 80k | 120k`)** → Jornada visual em **3 degraus** → Lista Semáforo DVI limpa (`is-crit`, `is-warn`, `is-ok`) com **faixa estimada e preço único em sans tabular** (`+ Incluir`).
- **Removido (`R6`):** busca, seletor "Destaques", poluição de códigos OS/peça/mão-de-obra nos cards, estética dark "terminal dev" e stepper de quantidade no PDP (`B06` — `Incluir na OS`).
- **Tipografia self-hosted OFL (`R3` / `G-TIPO`):** `Barlow Condensed 700` (`21.9 KB`) + `Plus Jakarta Sans 400` (`11.5 KB`) = **`33.4 KB` (`<= 45 KB`)**, `document.fonts.check()` verdadeiro em Chromium e WebKit.

### 2) Barbearia (`src/home/barbearia.js` + `styles/home-barbearia.css`) — *Obsidiana & Latão Editorial + Agenda Única (Opção A)*
- **Esqueleto próprio:** Topbar Obsidiana `#141210` → **Momento-Assinatura: Agenda Única em 3 Passos no topo (`Profissional` + `Dia em Fuso Local` + grade única de até 4 horários reais filtrados com selo `"Agenda demo"` e destaque `"Próx. livre"`)** → Lista editorial de serviços em nogueira escura com latão (`Reservar`).
- **Removido (`R6` / `B05` / `B06`):** repetição da grade de horários em cada card, pílula de cupom no topo, busca/ordenar, stepper de quantidade no PDP (`Confirmar Horário`).
- **Tipografia self-hosted OFL (`R3` / `G-TIPO`):** `Playfair Display 700` (`22.7 KB`) + `Plus Jakarta Sans 400` (`11.5 KB`) = **`34.2 KB` (`<= 45 KB`)**, `document.fonts.check()` verdadeiro em Chromium e WebKit.

## 2. Medições Pós-Edição Final (`390×844` — `audit/v15-p2-checkpoint1.json`)

| Vertical | Motor | Controles acima 1º item (`<= 6`) | Controles 1ª tela (`<= 12`) | `fontLoadedOk` (`G-TIPO`) | Preço ≠ Mono | Stepper oculto PDP (`B06`) | Alvos `< 44px` / Overflow | Axe Crít/Sér | Peso Inicial Gzip+WOFF2 (`< 170 KB`) |
|---|---|---|---|---|---|---|---|---|---|
| `oficina` | Chromium | `2` | `8` | `true` (`Barlow Condensed`) | `true` (`Plus Jakarta Sans`) | `true` | `0` / `false` | `0` | `126.2 KB` |
| `oficina` | WebKit | `2` | `8` | `true` (`Barlow Condensed`) | `true` (`Plus Jakarta Sans`) | `true` | `0` / `false` | `0` | `127.2 KB` |
| `barbearia` | Chromium | `6` | `12` | `true` (`Playfair Display`) | `true` (`Plus Jakarta Sans`) | `true` | `0` / `false` | `0` | `126.6 KB` |
| `barbearia` | WebKit | `6` | `12` | `true` (`Playfair Display`) | `true` (`Plus Jakarta Sans`) | `true` | `0` / `false` | `0` | `127.6 KB` |

- **Suíte Unitária (`node --test`):** `64/64` passando (`0` falhas, `0` pulados, `1060.44ms`).
- **Evidências Visuais (`390×844`):** `evidence/v15/p2-oficina-390x844.png`, `evidence/v15/p2-barbearia-390x844.png`.
