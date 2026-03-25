

# Correção: PIX Sigilo Pay - Credenciais DB + Campos Obrigatórios

## Problemas Identificados

1. **Credenciais não encontradas no pix-api**: O fluxo de criação de cobrança (linha ~2270) busca credenciais APENAS em variáveis de ambiente (`SIGILOPAY_PUBLIC_KEY`/`SIGILOPAY_SECRET_KEY`), mas você salvou via UI no banco de dados (`platform_gateway_credentials`). O fallback para DB existe apenas no endpoint de payment-methods, não no de criação de cobrança.

2. **Campos obrigatórios da API Sigilo Pay**: A API exige `client.phone` e `client.document` (não `cpf`). O código envia `cpf` em vez de `document` e omite `phone` completamente. Erro retornado: `"path":["client","phone"],"message":"Required"`.

## Alterações

### 1. `supabase/functions/pix-api/index.ts` — Fallback DB nas credenciais de cobrança (~linha 2269-2289)
- Após verificar env vars para sigilopay, adicionar fallback para buscar de `platform_gateway_credentials` (mesmo padrão já usado no payment-methods)
- Se env vazio, consultar tabela e usar `credentials.x_public_key` / `credentials.x_secret_key`

### 2. `supabase/functions/pix-api/index.ts` — Função `createSigilopayPixPayment` (~linha 1501-1516)
- Mudar `payload.client.cpf` para `payload.client.document`
- Adicionar `payload.client.phone` com fallback para `"00000000000"` (telefone padrão quando não fornecido)

### 3. `supabase/functions/external-payment-api/index.ts` — Payload Sigilo Pay (~linha 409-422)
- Mesma correção: `cpf` → `document`, adicionar `phone`

### 4. DB fallback no `platform_gateway_credentials` para sigilopay
- Na checagem de credenciais para sigilopay, o cast do DB deve usar `x_public_key`/`x_secret_key` (não `client_id`/`client_secret`)

## Resultado Esperado
- Super Admin salva credenciais Sigilo Pay pela UI → ficam no banco
- PIX-API busca do banco quando env vars não existem
- Cobrança enviada com `client.document` e `client.phone` → Sigilo Pay aceita

