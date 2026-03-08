

# Plano: Corrigir createGhostpayCharge na external-payment-api

## Problema

A Edge Function `external-payment-api` tem sua **propria copia** da funcao `createGhostpayCharge` (linhas 106-178) que **nao foi atualizada** com as correcoes feitas no `pix-api`. Os mesmos 2 bugs estao presentes:

1. **CPF falso** na linha 124: `document.number: buyerDocument?.replace(/\D/g, '') || '00000000000'` — causa recusa pela adquirente
2. **Sem verificacao de status refused** — quando Ghostpay retorna `status: "refused"` com `pix.qrcode: null`, o codigo retorna QR code vazio

Os logs confirmam: todas as chamadas via API externa estao sendo recusadas com o mesmo padrao (`status: "refused"`, `acquirerCode: 200`).

## Alteracoes

### Arquivo: `supabase/functions/external-payment-api/index.ts`

**1. Remover CPF falso (linhas 122-126):**

Trocar o bloco `document` fixo por envio condicional:
```typescript
...(buyerDocument && buyerDocument.replace(/\D/g, '').length >= 11 ? {
  document: {
    number: buyerDocument.replace(/\D/g, ''),
    type: buyerDocument.replace(/\D/g, '').length > 11 ? 'CNPJ' : 'CPF'
  }
} : {})
```

**2. Adicionar verificacao de status refused (apos linha 168):**

```typescript
if (data.status === 'refused' || data.status === 'chargedback') {
  const reason = data.refusedReason?.description || 'Transação recusada';
  console.error('Ghostpay refused:', reason, JSON.stringify(data.refusedReason));
  throw new Error(`Transação recusada pelo gateway: ${reason}`);
}
```

**3. Validar que qrCode nao esta vazio (apos extrair copyPasteCode):**

```typescript
if (!copyPasteCode) {
  throw new Error('Gateway não gerou código PIX. Verifique as credenciais e dados do comprador.');
}
```

## Resultado

- Transacoes via API externa passam a funcionar (sem CPF falso bloqueando)
- Erros claros retornados ao sistema externo em vez de QR code vazio
- Consistencia entre `pix-api` e `external-payment-api`

