---
fase: p3-descoberta
squad_lead: open-apis-geo-squad
suporte: [research-squad, innovation-squad]
data: 2026-11-16
status: concluido
---

# p03 — Auditoria de APIs Públicas Gratuitas & Benchmarks

## 1. Matriz de APIs Candidatas (Zero Chave / Uso Comercial `[O]` / `[R]`)
| API | Uso | Sem Chave? | CORS Browser | Rate Limit / Risco | Termos Comerciais | Plano B Determinístico |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| **BrasilAPI v2 CEP** (`brasilapi.com.br/api/cep/v2`) | Endereço + Coords por CEP | Sim | Sim | Best-effort; `AbortController` `2.2s` | Aberta (MIT/Dados públicos) | Fallback ViaCEP → Dicionário configurável por loja (`geo.offlineDictionary`) |
| **ViaCEP** (`viacep.com.br/ws`) | Fallback de endereço por CEP | Sim | Sim | Uso moderado sem polling | Gratuita sem chave | Fallback dicionário local + região configurada |
| **OSRM Public** (`router.project-osrm.org`) | Distância viária + polilinha | Sim | Sim | Servidor demo (sem SLA comercial pesado) | ODbL / Fair use | **Obrigatório:** Fallback `Haversine × 1.32` local imediato (`< 1ms`) `[O]` |
| **Open-Meteo** (`api.open-meteo.com`) | Clima por lat/lon da loja | Sim | Sim | 10.000 req/dia free não-comercial | Uso comercial exige plano pago `[R]` | Exibir apenas em modo Demo/Estúdio ou substituir por aviso manual do lojista `[R]` |
| **Parallelum FIPE** (`parallelum.com.br/fipe`) | Marcas de veículos | Sim | Sim | Moderado | Gratuita comunitária | Catálogo frota offline embutido (`OFFLINE_FIPE_VEHICLES`) `[O]` |

## 2. Guardrail Adicional Descoberto (`[R]`)
Para **Open-Meteo**, a licença gratuita restringe uso comercial contínuo: mover sua exibição opcional somente para consulta diagnóstica no Estúdio (sem dependência no checkout do comprador), preservando 100% aderência comercial no Cloudflare Pages.
