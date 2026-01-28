

# Plano: Permitir Marcar como Pago para Transações Expiradas

## Resumo
Estender a funcionalidade "Marcar como Pago" para aceitar transações com status `expired`, além de `pending`.

---

## Modificações Necessárias

### 1. Frontend - `src/pages/Transactions.tsx`

**Linha 844** - Alterar a condição para mostrar o botão:

```typescript
// ANTES:
{selectedTransaction.status === 'pending' && (

// DEPOIS:
{(selectedTransaction.status === 'pending' || selectedTransaction.status === 'expired') && (
```

### 2. Edge Function - `supabase/functions/mark-as-paid/index.ts`

**Linhas 390-396** - Alterar a validação de status:

```typescript
// ANTES:
if (charge.status !== 'pending') {
  return new Response(JSON.stringify({ error: `Apenas cobranças pendentes podem ser marcadas como pagas. Status atual: ${charge.status}` }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// DEPOIS:
if (charge.status !== 'pending' && charge.status !== 'expired') {
  return new Response(JSON.stringify({ error: `Apenas cobranças pendentes ou expiradas podem ser marcadas como pagas. Status atual: ${charge.status}` }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Transactions.tsx` | Adicionar condição `|| selectedTransaction.status === 'expired'` na linha 844 |
| `supabase/functions/mark-as-paid/index.ts` | Adicionar condição `&& charge.status !== 'expired'` na linha 391 |

---

## Resultado Esperado

Após a implementação:
- O botão "Marcar como Pago" será visível tanto para transações **Pendentes** quanto **Expiradas**
- O fluxo completo será executado normalmente (acesso à área de membros + email de confirmação)
- Transações já pagas ou canceladas continuarão bloqueadas

