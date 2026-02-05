
# Plano: Correção de 3 Problemas no Sistema

## Problema 1: Order Bumps não aparecem na Área de Membros

### Diagnóstico
Quando um cliente paga por um produto com order bumps, apenas o produto principal recebe um registro na tabela `members`. Os order bumps são armazenados no campo `order_bumps` da tabela `pix_charges`, mas a função `processPaymentConfirmation` no `pix-api` só cria membership para o `product_id` principal.

**Código atual (linha 1672-1680):**
```typescript
if (charge.product_id && charge.buyer_email) {
  const membershipResult = await createMembershipForBuyer(
    supabase,
    charge.buyer_email,
    charge.buyer_name,
    charge.product_id,  // Apenas produto principal
    transaction?.id
  );
}
```

### Solução
Modificar a função `processPaymentConfirmation` em `supabase/functions/pix-api/index.ts` para também criar memberships para cada produto nos order_bumps.

**Alterações necessárias:**

1. Após criar membership para o produto principal, iterar sobre `charge.order_bumps` e criar membership para cada um.

```typescript
// Criar membership para produto principal
if (charge.product_id && charge.buyer_email) {
  const membershipResult = await createMembershipForBuyer(...);
  
  // NOVO: Criar membership para cada order bump
  if (charge.order_bumps && Array.isArray(charge.order_bumps) && charge.order_bumps.length > 0) {
    console.log('Creating memberships for order bumps:', charge.order_bumps);
    for (const bumpProductId of charge.order_bumps) {
      try {
        await createMembershipForBuyer(
          supabase,
          charge.buyer_email,
          charge.buyer_name,
          bumpProductId,
          transaction?.id
        );
        console.log('Order bump membership created for:', bumpProductId);
      } catch (bumpError) {
        console.error('Error creating order bump membership:', bumpError);
      }
    }
  }
}
```

2. Garantir que a query que busca o charge inclua o campo `order_bumps`.

---

## Problema 2: Cliente ao instalar sistema não pode vender (falta role "seller")

### Diagnóstico
O `process-gateflow-sale` adiciona as roles "admin" e "member", mas não adiciona "seller". Como resultado, o usuário não consegue criar e vender produtos.

**Código atual (linhas 165-187):**
```typescript
// Adicionar role 'admin'
await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "admin" });

// Adicionar role 'member' para acesso à área de membros
await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "member" });
```

### Solução
Adicionar também a role "seller" no `supabase/functions/process-gateflow-sale/index.ts`.

**Alterações necessárias:**

Após adicionar as roles "admin" e "member", adicionar também "seller":

```typescript
// Adicionar role 'admin'
const { error: roleError } = await supabaseAdmin
  .from("user_roles")
  .insert({ user_id: userId, role: "admin" });

// Adicionar role 'member' para acesso à área de membros  
const { error: memberRoleError } = await supabaseAdmin
  .from("user_roles")
  .insert({ user_id: userId, role: "member" });

// NOVO: Adicionar role 'seller' para poder criar e vender produtos
const { error: sellerRoleError } = await supabaseAdmin
  .from("user_roles")
  .insert({ user_id: userId, role: "seller" });

if (sellerRoleError) {
  console.error("Error adding seller role:", sellerRoleError);
}
```

---

## Problema 3: Produtos não aparecem no diálogo "Conceder Acesso"

### Diagnóstico
O `ClientDetailDialog` busca apenas produtos com `seller_id = user.id` e `status = 'active'`. Se o vendedor não criou nenhum produto ainda (como no caso de quem acabou de instalar), nenhum produto aparece.

**Código atual (linhas 131-136):**
```typescript
const { data: products, error } = await supabase
  .from("products")
  .select("id, name")
  .eq("seller_id", user.id)
  .eq("status", "active")
  .order("name");
```

### Solução
O problema está relacionado ao problema 2 - sem a role "seller", o usuário pode não ver produtos. Mas também precisamos considerar que o vendedor novo pode não ter criado produtos ainda.

Porém, após análise, o problema real é que quando o novo admin é criado pelo `process-gateflow-sale`, um produto é copiado para ele (linha 237-256), então deveria ter ao menos um produto.

A correção do problema 2 (adicionar role seller) deve resolver isso, pois o usuário terá as permissões corretas para ver e gerenciar seus produtos.

Adicionalmente, vou verificar se o produto copiado tem o `status = 'active'` corretamente.

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/pix-api/index.ts` | Criar memberships para order bumps além do produto principal |
| `supabase/functions/process-gateflow-sale/index.ts` | Adicionar role "seller" para novos admins do sistema |

---

## Detalhes Técnicos

### Arquivo 1: `supabase/functions/pix-api/index.ts`

**Localização:** Após a criação do membership do produto principal (linha ~1713)

**Código a adicionar:**
```typescript
// Create memberships for order bump products
if (charge.order_bumps && Array.isArray(charge.order_bumps) && charge.order_bumps.length > 0) {
  console.log('Creating memberships for order bumps:', charge.order_bumps);
  for (const bumpProductId of charge.order_bumps) {
    try {
      await createMembershipForBuyer(
        supabase,
        charge.buyer_email,
        charge.buyer_name,
        bumpProductId,
        transaction?.id
      );
      console.log('Order bump membership created for product:', bumpProductId);
    } catch (bumpError) {
      console.error('Error creating order bump membership for:', bumpProductId, bumpError);
      // Continue with other bumps even if one fails
    }
  }
}
```

### Arquivo 2: `supabase/functions/process-gateflow-sale/index.ts`

**Localização:** Após adicionar role "member" (linha ~187)

**Código a adicionar:**
```typescript
// Adicionar role 'seller' para poder criar e vender produtos
const { error: sellerRoleError } = await supabaseAdmin
  .from("user_roles")
  .insert({
    user_id: userId,
    role: "seller",
  });

if (sellerRoleError) {
  console.error("Error adding seller role:", sellerRoleError);
}
```

---

## Comportamento Esperado Após Correções

1. **Order Bumps na Área de Membros:** Quando um cliente compra um produto com order bumps, todos os produtos (principal + bumps) aparecerão na área de membros.

2. **Novos Admins como Vendedores:** Ao instalar o sistema Gateflow, o novo admin terá as roles: admin + member + seller, permitindo acesso à área de membros E capacidade de criar/vender produtos.

3. **Produtos no Diálogo de Acesso:** Com a role "seller" adicionada, o novo admin poderá ver e gerenciar seus produtos corretamente, incluindo conceder acesso manual a clientes.
