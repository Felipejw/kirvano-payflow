

# Plano: Backfill de Dados Históricos

## Problemas Identificados

| Problema | Quantidade | Impacto |
|----------|------------|---------|
| Usuários Gateflow sem role "seller" | 19+ usuários | Não conseguem criar/vender produtos |
| Compras com order bumps sem membership | 20+ compras | Produtos não aparecem na área de membros |

---

## Solução

### 1. Atualizar `backfill-gateflow-buyers` para adicionar role "seller"

**Arquivo:** `supabase/functions/backfill-gateflow-buyers/index.ts`

Adicionar upsert da role "seller" junto com as roles "admin" e "member":

```typescript
// 2) Ensure admin role
await supabase.from("user_roles")
  .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

// 2b) Ensure member role
await supabase.from("user_roles")
  .upsert({ user_id: userId, role: "member" }, { onConflict: "user_id,role" });

// NOVO: 2c) Ensure seller role para poder criar e vender produtos
await supabase.from("user_roles")
  .upsert({ user_id: userId, role: "seller" }, { onConflict: "user_id,role" });
```

---

### 2. Criar nova função para backfill de order bumps históricos

**Arquivo:** `supabase/functions/backfill-order-bump-memberships/index.ts`

Nova Edge Function que:
1. Busca todas as `pix_charges` pagas que têm `order_bumps`
2. Para cada charge, verifica se existem memberships para os order bumps
3. Cria memberships faltantes

**Lógica:**
```typescript
// 1. Buscar charges pagas com order_bumps
const { data: charges } = await supabase
  .from("pix_charges")
  .select("id, buyer_email, order_bumps")
  .eq("status", "paid")
  .not("order_bumps", "is", null);

// 2. Para cada charge com order_bumps
for (const charge of charges) {
  // Encontrar user_id pelo email
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("email", charge.buyer_email)
    .single();
    
  if (!profile?.user_id) continue;
  
  // 3. Para cada order bump, criar membership se não existir
  for (const productId of charge.order_bumps) {
    const { data: existing } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", profile.user_id)
      .eq("product_id", productId)
      .maybeSingle();
      
    if (!existing) {
      await supabase.from("members").insert({
        user_id: profile.user_id,
        product_id: productId,
        access_level: "full",
        status: "active"
      });
    }
  }
}
```

---

## Resumo das Alterações

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/functions/backfill-gateflow-buyers/index.ts` | Modificar | Adicionar upsert de role "seller" |
| `supabase/functions/backfill-order-bump-memberships/index.ts` | Criar | Nova função para criar memberships de order bumps históricos |

---

## Fluxo de Execução

1. **Deploy** das funções atualizadas
2. **Executar** `backfill-gateflow-buyers` com `dry_run: false` para adicionar role "seller" a todos compradores
3. **Executar** `backfill-order-bump-memberships` para criar memberships de order bumps faltantes

---

## Interface de Uso

Ambas as funções podem ser chamadas pelo painel Super Admin existente (`GateflowBackfillCard`), ou adicionar um novo card para o backfill de order bumps.

