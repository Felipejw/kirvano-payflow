
# Diagnostico: Checkout e Credenciais no VPS

## Resultado da investigacao

Testei a Edge Function `pix-api/payment-methods` diretamente no Lovable Cloud e ela **funciona perfeitamente** -- retorna `methods: ["pix"]` com as credenciais Ghostpay configuradas.

Os dois problemas que voce reportou sao do **ambiente VPS** (`gatteflow.store` / `pay.chatbotwhatsapp.store`), nao do Lovable Cloud:

### Problema 1: Checkout mostrando "produto nao disponivel"
O checkout chama `VITE_SUPABASE_URL/functions/v1/pix-api/payment-methods/{sellerId}`. No VPS, o `VITE_SUPABASE_URL` aponta para o Supabase do VPS local, onde as Edge Functions podem estar desatualizadas ou os secrets (`GHOSTPAY_COMPANY_ID`, `GHOSTPAY_SECRET_KEY`) nao estao configurados.

### Problema 2: Credenciais "Nao configurado" no painel admin
A Edge Function `get-gateway-credentials` falhou (mostra "Funcao Edge indisponivel"), e o fallback mostra "Nao configurado" porque as credenciais globais so sao acessiveis via env vars na Edge Function.

## O que voce precisa fazer no VPS

Estes problemas nao sao do codigo -- sao de **configuracao no servidor VPS**:

1. **Atualizar as Edge Functions** no VPS com as versoes mais recentes (rodar o `update.sh` ou re-deploy manual das funcoes `pix-api` e `get-gateway-credentials`)

2. **Verificar os secrets/env vars** no Supabase do VPS:
   - `GHOSTPAY_COMPANY_ID` 
   - `GHOSTPAY_SECRET_KEY`
   - Confirmar que estao definidos corretamente no painel Supabase do VPS

3. **Verificar o `platform_settings`** no banco do VPS: a coluna `platform_gateway_type` deve estar como `ghostpay`

Nao ha alteracoes de codigo necessarias -- o sistema funciona corretamente no Lovable Cloud.
