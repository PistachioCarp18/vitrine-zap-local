# P2 — Resumo da Engenharia Reversa Clean-Room (v11.0)

**Data:** 2026-11-16
**Squad:** `reverse-engineering-squad` + auditoria independente via `task-audit-gate-squad` (`audit-runner.js p2` -> **APPROVED** `8/8`)

## 1. Inspeção de Alvos e Limites `[L]` Respeitados
- Evidências em `evidence/v11/` e `audit/p2-targets-inspection.json`:
  - **Pista A (MIT verificado):** `primer/css` (`200 OK` MIT LICENSE) e `radix-ui/primitives` (`200 OK` MIT LICENSE); docs públicas inspecionadas sem restrições (`primer.style`, `radix-ui.com`).
  - **Pista B (Observação pública apenas):** `MenuDino`, `Square Online`, `Cobasi`, `Booksy`, `Giuliana Flores`, `Mercado Pago UX` acessados publicamente (`200 OK`).
  - **Bloqueios HTTP `403` registrados como `[L]` (sem bypass):** `ifood.com.br`, `chewy.com`, `repairpal.com` retornaram `403`; padrões desses domínios foram fundamentados com documentação oficial/primária (`[T]`) ou substituídos por fontes públicas acessíveis (`MenuDino`, `Cobasi`).

## 2. Dossiês REA no Segundo Cérebro (`G:\Meu Drive\Segundo Cérebro\30-Conhecimento\`)
1. `Dossie-REA-iFood-e-MenuDino.md` (REA `6/6`, Grau `A/B`)
2. `Dossie-REA-SquareOnline-e-Starbucks.md` (REA `6/6`)
3. `Dossie-REA-Chewy-e-Cobasi.md` (REA `6/6`)
4. `Dossie-REA-RepairPal-e-Tekmetric.md` (REA `6/6`)
5. `Dossie-REA-Booksy-e-Trinks.md` (REA `6/6`)
6. `Dossie-REA-MercadoLivre-Andes-e-Dawn.md` (REA `6/6`, registrando Dawn excluído da Pista A)
7. `Dossie-REA-GiulianaFlores-e-1800Flowers.md` (REA `6/6`)
8. `Dossie-REA-WhatsAppCatalog-e-MercadoPagoUX.md` (REA `6/6`)
