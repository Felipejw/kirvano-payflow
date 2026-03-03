

# Plano: Corrigir integração Ghostpay PIX - Transações sendo recusadas

## Diagnóstico

Analisei os logs da Edge Function `pix-api` e encontrei a causa raiz. **Todas as transações recentes estão sendo recusadas pela Ghostpay** com:

```text
status: "refused"
pix.qrcode: null
refusedReason: {
  acquirerCode: 200,
  description: "Transação recusada pela adquirente",
  antifraud: false
}
```

Isso explica por que o QR Code e o código copia e cola aparecem vazios no checkout.

### Problemas identificados:

**1. CPF falso `00000000000`**: O campo `buyer_document` não está sendo preenchido pelo checkout, então o fallback `'00000000000'` é usado. A Ghostpay (ou a adquirente por trás) rejeita transações com CPF inválido.

**2. O código não verifica se a transação foi recusada**: Mesmo quando a Ghostpay retorna `status: "refused"` com `pix.qrcode: null`, o código trata como sucesso (HTTP 200) e salva a charge sem QR Code. O frontend mostra a tela de PIX com campos vazios.

**3. Campo `ip: "0.0.0.0"` no metadata**: Pode contribuir para recusa por antifraude/adquirente.

## Alterações

### Arquivo 1: `supabase/functions/pix-api/index.ts`

**Alteração A - Verificar status "refused" na resposta do Ghostpay** (dentro de `createGhostpayPixPayment`, após parsear a resposta):

Após `const data = JSON.parse(responseText)`, adicionar verificação:

```typescript
if (data.status === 'refused' || data.status === 'chargedback') {
  const reason = data.refusedReason?.description || 'Transação recusada';
  console.error('Ghostpay PIX refused:', reason, data.refusedReason);
  throw new Error(`Transação recusada pelo gateway: ${reason}`);
}
```

Isso faz com que o erro seja propagado corretamente para o frontend em vez de mostrar uma tela de PIX vazia.

**Alteração B - Remover CPF falso e enviar sem document se não fornecido** (dentro de `createGhostpayPixPayment`):

Trocar:
```typescript
document: {
  number: customer.document?.replace(/\D/g, '') || '00000000000',
  type: 'CPF'
}
```

Por:
```typescript
...(customer.document && customer.document !== '00000000000' ? {
  document: {
    number: customer.document.replace(/\D/g, ''),
    type: customer.document.replace(/\D/g, '').length > 11 ? 'CNPJ' : 'CPF'
  }
} : {})
```

Isso envia o campo `document` apenas quando um CPF real for fornecido, em vez de enviar um CPF falso que causa recusa.

**Alteração C - Capturar IP real do comprador** (no handler `/charges`):

Ao chamar `createGhostpayPixPayment`, passar o IP real em vez de `'0.0.0.0'`:

```typescript
metadata: {
  external_id: externalId,
  ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || req.headers.get('x-real-ip') 
    || '0.0.0.0'
}
```

### Arquivo 2: Checkout frontend (investigar se CPF está sendo coletado)

Verificar se o checkout coleta o CPF do comprador e envia como `buyer_document` na request. Se não, será necessário garantir que o campo CPF seja obrigatório no checkout ao usar Ghostpay.

## Resumo

| Alteração | Arquivo | Impacto |
|-----------|---------|---------|
| Verificar status "refused" | pix-api/index.ts | Erro claro no frontend em vez de PIX vazio |
| Remover CPF falso | pix-api/index.ts | Evita recusa pela adquirente |
| Capturar IP real | pix-api/index.ts | Reduz rejeições por antifraude |

## Resultado Esperado

- Transações PIX via Ghostpay passam a ser aceitas (sem CPF falso bloqueando)
- Se uma transação for recusada, o frontend mostra mensagem de erro em vez de tela de PIX vazia
- Transações aparecem no painel da Ghostpay como pendentes (não mais recusadas)

