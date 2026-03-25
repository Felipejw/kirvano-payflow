

# Correção: Sigilo Pay rejeita documento "00000000000"

## Problema Identificado

Os logs mostram claramente o erro:

```
Sigilo Pay PIX payload: { "document": "00000000000" }
Sigilo Pay PIX response: {"statusCode":422,"errorCode":"GATEWAY_INVALID_ARGUMENT","message":"Documento inválido."}
```

A API do Sigilo Pay valida o CPF/CNPJ e rejeita `00000000000` como documento inválido. O checkout não exige CPF (campo condicional via `require_cpf`), então o fallback `00000000000` é usado — mas esse CPF é inválido.

A mesma situação já foi resolvida para o Ghostpay, que usa o CPF válido `42401617892` como fallback.

## Correção

Trocar o fallback de `'00000000000'` para um CPF válido (`42401617892`) em **3 pontos**:

### 1. `supabase/functions/pix-api/index.ts` — Função `createSigilopayPixPayment` (linha 1503)
- Alterar: `'00000000000'` → `'42401617892'` no fallback de documento

### 2. `supabase/functions/pix-api/index.ts` — Chamada do sigilopay no fluxo principal (linha 2755)
- Garantir que `buyer.document` passa pelo mesmo tratamento da função interna (já está ok, pois a função faz o fallback)

### 3. `supabase/functions/external-payment-api/index.ts` — Payload sigilopay (linha 428)
- Alterar: `'00000000000'` → `'42401617892'` no fallback de documento

### 4. `supabase/functions/pix-api/index.ts` — Fallback payment-methods (linha 3470-3471)
- Corrigir checagem de credenciais sigilopay no DB: atualmente verifica `c.client_id && c.client_secret`, mas precisa também aceitar `c.x_public_key && c.x_secret_key`

## Resultado
- Checkout sem CPF preenchido → envia CPF válido como fallback → Sigilo Pay aceita
- Mesmo comportamento já validado com Ghostpay

