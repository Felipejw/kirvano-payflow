

# Plano: Marcar Transação como Paga Manualmente

## Resumo
Adicionar funcionalidade para que o vendedor possa marcar uma transação pendente como "Paga" manualmente através do modal de detalhes da transação. Ao fazer isso, o sistema executará todo o fluxo de pagamento automático, incluindo:
- Atualização do status para "paid"
- Criação da transação na tabela `transactions`
- Criação de acesso à área de membros
- Envio de e-mail de confirmação ao comprador

---

## Arquitetura da Solução

O fluxo será implementado criando uma nova Edge Function dedicada para processar o pagamento manual. Isso é necessário porque:
1. A lógica de `processPaymentConfirmation` está dentro do `pix-api` e usa `service_role`
2. O frontend não tem permissão para inserir na tabela `transactions` (RLS bloqueado)
3. O frontend não pode criar usuários ou memberships diretamente

---

## Componentes a Serem Modificados

### 1. Nova Edge Function: `mark-as-paid`

**Arquivo:** `supabase/functions/mark-as-paid/index.ts`

Esta função:
- Recebe o `charge_id` e valida se pertence ao vendedor autenticado
- Verifica se a cobrança está em status `pending`
- Reutiliza a lógica existente de `processPaymentConfirmation`:
  - Atualiza `pix_charges.status` para 'paid' e define `paid_at`
  - Cria registro em `transactions`
  - Cria membership para o comprador (usuário + membro)
  - Envia e-mail de confirmação com acesso

```text
Flow:
┌─────────────────┐
│   Frontend      │
│  (Transactions) │
└────────┬────────┘
         │ POST /mark-as-paid
         │ { charge_id: uuid }
         ▼
┌─────────────────┐
│  Edge Function  │
│  mark-as-paid   │
├─────────────────┤
│ 1. Validate JWT │
│ 2. Check owner  │
│ 3. Check status │
│ 4. Process pay  │
│ 5. Create member│
│ 6. Send email   │
└─────────────────┘
```

### 2. Atualizar Configuração: `supabase/config.toml`

Adicionar a nova função com JWT obrigatório:
```toml
[functions.mark-as-paid]
verify_jwt = true
```

### 3. Modificar Página de Transações: `src/pages/Transactions.tsx`

Adicionar no modal de detalhes da transação:
- Botão "Marcar como Pago" (visível apenas para status `pending`)
- Dialog de confirmação antes de executar
- Estado de loading durante processamento
- Toast de sucesso/erro após a ação
- Refresh da lista após sucesso

---

## Detalhes Técnicos

### Edge Function `mark-as-paid`

```typescript
// Principais passos:

// 1. Validar JWT e obter user_id
const { user } = await supabase.auth.getUser();

// 2. Buscar charge e validar propriedade
const { data: charge } = await supabase
  .from('pix_charges')
  .select('*, products(name, seller_id)')
  .eq('id', chargeId)
  .single();

if (charge.seller_id !== user.id) {
  return error("Não autorizado");
}

if (charge.status !== 'pending') {
  return error("Apenas cobranças pendentes podem ser marcadas");
}

// 3. Processar confirmação (mesma lógica do webhook)
// - Atualizar pix_charges.status = 'paid'
// - Criar transaction
// - Criar membership
// - Enviar email
```

### Modificações no Frontend

1. **Novo estado no componente:**
```typescript
const [markingAsPaid, setMarkingAsPaid] = useState(false);
const [confirmMarkAsPaidOpen, setConfirmMarkAsPaidOpen] = useState(false);
```

2. **Função de ação:**
```typescript
const handleMarkAsPaid = async () => {
  if (!selectedTransaction) return;
  
  setMarkingAsPaid(true);
  try {
    const response = await supabase.functions.invoke('mark-as-paid', {
      body: { charge_id: selectedTransaction.id }
    });
    
    if (response.error) throw response.error;
    
    toast.success("Transação marcada como paga!");
    fetchTransactions();
    setDetailDialogOpen(false);
  } catch (error) {
    toast.error("Erro ao marcar como pago");
  } finally {
    setMarkingAsPaid(false);
    setConfirmMarkAsPaidOpen(false);
  }
};
```

3. **UI no modal de detalhes:**
```tsx
{selectedTransaction.status === 'pending' && (
  <Button 
    onClick={() => setConfirmMarkAsPaidOpen(true)}
    className="w-full"
  >
    <CheckCircle className="mr-2 h-4 w-4" />
    Marcar como Pago
  </Button>
)}
```

---

## Fluxo Completo de Processamento

Quando o vendedor clicar em "Marcar como Pago":

1. **Validação de Segurança**
   - JWT verificado na Edge Function
   - Vendedor só pode marcar suas próprias cobranças
   - Apenas status `pending` pode ser alterado

2. **Atualização da Cobrança**
   - `pix_charges.status` → 'paid'
   - `pix_charges.paid_at` → timestamp atual

3. **Criação da Transação**
   - Novo registro em `transactions` com valores calculados
   - Taxas da plataforma aplicadas normalmente

4. **Criação de Acesso à Área de Membros**
   - Se produto tiver área de membros:
     - Cria usuário (se não existir) com senha padrão "123456"
     - Atribui role `member`
     - Cria registro em `members`

5. **Notificações**
   - Dispara `send-payment-confirmed` para enviar email ao comprador
   - Inclui credenciais de acesso se for novo membro

---

## Arquivos a Serem Criados/Modificados

| Arquivo | Ação |
|---------|------|
| `supabase/functions/mark-as-paid/index.ts` | **Criar** - Nova Edge Function |
| `supabase/config.toml` | **Modificar** - Adicionar configuração da função |
| `src/pages/Transactions.tsx` | **Modificar** - Adicionar botão e lógica no modal |

---

## Considerações de Segurança

- A função requer autenticação JWT obrigatória
- Vendedor só pode marcar cobranças onde `seller_id` = seu próprio ID
- Apenas cobranças com status `pending` são aceitas
- Usa `service_role` internamente para operações privilegiadas (criar usuários, inserir membros)
- Logs de segurança são mantidos em `platform_gateway_logs`

