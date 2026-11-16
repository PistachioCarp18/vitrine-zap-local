# P2 — Descoberta, Validação CORS e Integração de APIs Abertas por Categoria (v12.0)

**Squads:** `open-apis-geo-squad` (`discover-category-open-apis`) + `research-squad` + `innovation-squad` + `integration-squad`
**Módulo:** `src/category-apis.js` (`OFFLINE_FIPE_BRANDS`, `OFFLINE_DOG_BREEDS`, estimador por KM/FIPE)

## 1. APIs Verificadas ao Vivo (`HTTP 200` + `Access-Control-Allow-Origin: *`, Zero Chave Paga)
1. **Oficina Mecânica — Catálogo FIPE Cascata + Estimador Preditivo de Manutenção por KM:**
   - **Endpoints testados:** `https://parallelum.com.br/fipe/api/v1/carros/marcas` (`marcas/{id}/modelos`, `/modelos/{id}/anos`, valor e combustível FIPE) + fallback `https://brasilapi.com.br/api/fipe/marcas/v1/carros` + catálogo offline.
   - **Motor preditivo (`estimateMaintenanceByVehicleAndMileage`):** combina porte/valor FIPE + combustível + idade do veículo (`1.0x` Popular, `1.28x` Intermediário/Turbo, `1.65x` SUV/Pick-up/Diesel) com marcos de quilometragem (`10k`, `20k`, `40k`, `60k`, `90k+ km`), exibindo faixa estimada (`totalMin`–`totalMax`) e botão de inclusão direta na OS (`#fipe-add-pack-btn`).
2. **Pet Shop — Catálogo de Raças & Porte (`Dog CEO API` + fallback local):**
   - **Endpoint:** `https://dog.ceo/api/breeds/list/all` (`200 OK`, `CORS *`).
   - Infere porte (`Pequeno 120g/dia`, `Médio 250g/dia`, `Grande 450g/dia`) ao selecionar raça em `#pet-breed`, atualizando o cálculo de duração da ração ao vivo.
3. **Floricultura & Barbearia — Feriados Nacionais (`BrasilAPI Feriados`):**
   - **Endpoint:** `https://brasilapi.com.br/api/feriados/v1/2026` (`200 OK`, `CORS *`).
   - Exibe automaticamente a próxima data comemorativa/feriado aplicável na faixa de meta da loja sem adicionar altura vertical.
4. **Alimentação & Moda — Clima Ao Vivo (`Open-Meteo`):**
   - Já integrado com coordenada parametrizada por loja (`200 OK`, `CORS *`).
