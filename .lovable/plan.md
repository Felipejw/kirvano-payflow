
# Plano: Corrigir Validação de Preço para Cupons

## Problema Identificado

Os logs mostram claramente o erro:
```
ERROR SECURITY EVENT [PRICE_MANIPULATION]: 
{
  "received_amount": 150,      // Valor com cupom aplicado
  "expected_amount": 194,      // Valor sem cupom
  "difference": 44            // Desconto do cupom
}
```

O sistema de segurança anti-manipulação de preço está bloqueando compras legítimas com cupom porque:
- O frontend envia o valor final com desconto (R$ 150)
- O backend calcula apenas `produto + order_bumps` (R$ 194)
- A função `validateAndGetExpectedPrice` NÃO considera cupons

---

## Solução

Modificar o fluxo para incluir validação de cupom no backend:

```text
Frontend (Checkout.tsx)              Backend (pix-api)
        │                                    │
        │  body: {                           │
        │    amount: 150,                    │
        │    coupon_code: "DESCONTO44",  ◄── NOVO
        │    product_id: "...",              │
        │    order_bumps: [...]              │
        │  }                                 │
        └────────────────┬───────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────────┐
        │  validateAndGetExpectedPrice()      │
        │  1. Busca produto = R$ 97           │
        │  2. Busca order bumps = R$ 97       │
        │  3. Subtotal = R$ 194               │
        │  4. Valida cupom "DESCONTO44" ◄── NOVO
        │  5. Aplica desconto = R$ 44         │
        │  6. Expected = R$ 150 ✅            │
        └─────────────────────────────────────┘
```

---

## Arquivos a Modificar

### 1. Frontend: `src/pages/Checkout.tsx`

Adicionar `coupon_code` e `coupon_id` no payload enviado para a pix-api:

```typescript
// Linha ~1120-1152
const { data, error } = await supabase.functions.invoke('pix-api', {
  body: {
    amount: totalPrice,
    buyer_email: buyerEmail,
    // ... outros campos ...
    order_bumps: selectedBumps.length > 0 ? selectedBumps : undefined,
    // ADICIONAR:
    coupon_code: appliedCoupon?.code || undefined,
    coupon_id: appliedCoupon?.id || undefined,
    // ...
  },
});
```

### 2. Backend: `supabase/functions/pix-api/index.ts`

**2.1. Atualizar Schema de Validação (linhas 57-94)**

Adicionar campos de cupom:
```typescript
const chargeRequestSchema = z.object({
  // ... campos existentes ...
  coupon_code: z.string().max(20).nullable().optional(),
  coupon_id: z.string().uuid().nullable().optional(),
});
```

**2.2. Atualizar Interface (linhas 173-210)**

```typescript
interface CreateChargeRequest {
  // ... campos existentes ...
  coupon_code?: string;
  coupon_id?: string;
}
```

**2.3. Modificar `validateAndGetExpectedPrice` (linhas 99-137)**

Adicionar parâmetro de cupom e calcular desconto:

```typescript
async function validateAndGetExpectedPrice(
  supabase: any,
  productId: string,
  orderBumps?: string[],
  couponCode?: string,  // NOVO
  couponId?: string     // NOVO
): Promise<{ 
  expectedAmount: number; 
  productName: string; 
  sellerId: string; 
  parentProductId: string | null;
  appliedCouponId: string | null;  // NOVO
}> {
  // ... busca produto e order bumps ...
  
  let expectedAmount = product.price;
  // ... soma order bumps ...
  
  // NOVO: Validar e aplicar cupom
  let appliedCouponId: string | null = null;
  
  if (couponCode || couponId) {
    let couponQuery = supabase
      .from('coupons')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true);
    
    if (couponId) {
      couponQuery = couponQuery.eq('id', couponId);
    } else {
      couponQuery = couponQuery.ilike('code', couponCode!.trim());
    }
    
    const { data: coupon } = await couponQuery.single();
    
    if (coupon) {
      // Validar datas
      const now = new Date();
      const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
      const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;
      
      if ((!validFrom || validFrom <= now) && 
          (!validUntil || validUntil >= now) &&
          (coupon.max_uses === null || coupon.used_count < coupon.max_uses)) {
        
        // Calcular desconto
        if (coupon.discount_type === 'percentage') {
          expectedAmount -= (expectedAmount * coupon.discount_value) / 100;
        } else {
          expectedAmount -= Math.min(coupon.discount_value, expectedAmount);
        }
        
        appliedCouponId = coupon.id;
      }
    }
  }
  
  return {
    expectedAmount: Math.max(0, expectedAmount),
    productName: product.name,
    sellerId: product.seller_id,
    parentProductId: product.parent_product_id,
    appliedCouponId,
  };
}
```

**2.4. Atualizar Chamada da Função (linha 1883)**

```typescript
const priceData = await validateAndGetExpectedPrice(
  supabase, 
  body.product_id, 
  body.order_bumps,
  body.coupon_code,  // NOVO
  body.coupon_id     // NOVO
);
```

**2.5. Incrementar Uso do Cupom na Confirmação de Pagamento**

Quando o pagamento for confirmado (webhook), chamar o RPC `increment_coupon_usage`:

```typescript
// Na função confirmPayment, após confirmar:
if (charge.coupon_id) {
  await supabase.rpc('increment_coupon_usage', { 
    p_coupon_id: charge.coupon_id 
  });
}
```

**2.6. Salvar coupon_id na pix_charges**

Garantir que o campo `coupon_id` seja salvo ao criar a cobrança para uso posterior na confirmação.

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Checkout.tsx` | Enviar `coupon_code` e `coupon_id` no payload |
| `supabase/functions/pix-api/index.ts` | Adicionar campos no schema, interface, e lógica de validação |

---

## Fluxo Corrigido

1. **Cliente aplica cupom** → Frontend valida e mostra desconto
2. **Cliente finaliza compra** → Frontend envia `coupon_code` + `coupon_id`
3. **Backend valida** → `validateAndGetExpectedPrice` calcula preço COM desconto
4. **Comparação** → R$ 150 (recebido) == R$ 150 (esperado) ✅
5. **Pagamento confirmado** → `increment_coupon_usage` é chamado

---

## Resultado Esperado

- Compras com cupom serão processadas corretamente
- Sistema de segurança continuará bloqueando manipulações reais
- Cupons terão seu uso contabilizado apenas após pagamento confirmado
