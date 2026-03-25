

# Integração Sigilo Pay como Gateway de Pagamento

## Resumo

Adicionar o **Sigilo Pay** como novo gateway de pagamento, seguindo o mesmo padrão já usado por BSPAY, Pixup, Ghostpay, Mercado Pago e Asaas. A integração suporta **PIX** (baseado na documentação fornecida).

## API Sigilo Pay — Dados Técnicos

- **URL Base**: `https://app.sigilopay.com.br/api/v1`
- **Autenticação**: Headers `x-public-key` e `x-secret-key`
- **Criar PIX**: `POST /gateway/pix/receive` com body `{ identifier, amount, client: { name, email, cpf }, callbackUrl }`
- **Consultar Transação**: `GET /gateway/transactions?id=<id>`
- **Webhook**: Eventos `TRANSACTION_PAID`, `TRANSACTION_CREATED`, etc. com payload contendo `transaction.status`, `transaction.id`, `pix.qrCode`
- **Status**: `COMPLETED` = pago, `PENDING` = pendente, `FAILED` = falhou

## Plano de Implementação

### 1. Adicionar Sigilo Pay na tabela `payment_gateways` (migração SQL)

Inserir novo registro com `slug = 'sigilopay'`, `supports_pix = true`, `supports_card = false`, `supports_boleto = false`, `required_fields = ['x_public_key', 'x_secret_key']`.

### 2. Atualizar Edge Function `pix-api/index.ts`

- **Funções de integração Sigilo Pay** (~80 linhas):
  - `createSigilopayPixPayment(publicKey, secretKey, amount, externalId, buyer, callbackUrl, description)` — chama `POST /gateway/pix/receive`
  - `getSigilopayTransaction(publicKey, secretKey, transactionId)` — chama `GET /gateway/transactions?id=`
  - `mapSigilopayStatus(status)` — mapeia `COMPLETED`→`paid`, `PENDING`→`pending`, `FAILED`→`failed`

- **Adicionar no fluxo de criação de cobrança PIX** (bloco `else if (gateway.slug === 'sigilopay')`):
  - Extrair `x_public_key` e `x_secret_key` das credentials
  - Chamar `createSigilopayPixPayment`
  - Salvar `qrCode` e `transactionId`

- **Webhook handler** — `POST /webhook/sigilopay`:
  - Receber payload do Sigilo Pay
  - Verificar evento `TRANSACTION_PAID` com `status === 'COMPLETED'`
  - Buscar charge por `external_id` e chamar `processPaymentConfirmation`

- **Verificação de status** — no bloco de check-status existente, adicionar suporte para `sigilopay`

### 3. Atualizar `get-gateway-credentials/index.ts`

Adicionar `'sigilopay'` na lista de gateways válidos para o super-admin, lendo `SIGILOPAY_PUBLIC_KEY` e `SIGILOPAY_SECRET_KEY` das env vars (caso seja usado como gateway da plataforma).

### 4. Atualizar `platform_settings.platform_gateway_type`

Adicionar suporte para `sigilopay` nos blocos que checam `platformGatewayType` na `pix-api` (seção de platform_gateway e payment-methods endpoint).

### 5. Atualizar `GatewayConfigDialog.tsx`

Adicionar labels para os campos do Sigilo Pay:
- `x_public_key` → "Chave Pública (x-public-key)"
- `x_secret_key` → "Chave Secreta (x-secret-key)"

### 6. Atualizar `external-payment-api` (se aplicável)

Espelhar a mesma lógica de integração Sigilo Pay para manter consistência entre checkout e API externa.

## Arquivos Afetados

| Arquivo | Ação |
|---|---|
| `supabase/functions/pix-api/index.ts` | Adicionar integração Sigilo Pay (PIX, webhook, status check) |
| `supabase/functions/get-gateway-credentials/index.ts` | Adicionar 'sigilopay' como gateway válido |
| `supabase/functions/external-payment-api/index.ts` | Espelhar lógica Sigilo Pay |
| `src/components/finance/GatewayConfigDialog.tsx` | Adicionar labels dos campos |
| Migração SQL | Inserir gateway na tabela `payment_gateways` |

