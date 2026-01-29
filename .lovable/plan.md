
# Plano: Criar Função para Corrigir Email de Clientes

## Diagnóstico Confirmado

| Campo | Valor Atual (Incorreto) | Valor Correto |
|-------|------------------------|---------------|
| `auth.users.email` | `jonasoliveirax@yaho.com.br` | `jonasoliveirax@yahoo.com.br` |
| `profiles.email` | `jonasoliveirax@yaho.com.br` | `jonasoliveirax@yahoo.com.br` |
| `pix_charges.buyer_email` | `jonasoliveirax@yahoo.com.br` | ✅ Já corrigido |

O cliente **Jonas Lopes de Oliveira** (`user_id: 1fce67e9-d546-4ec1-8d50-9c4800f22e2e`) tem acesso ativo ao produto **Sistema Gatteflow**, mas não consegue fazer login com o email correto porque o sistema de autenticação ainda tem o email antigo.

---

## Solução

Criar uma nova Edge Function `update-customer-email` que permitirá ao admin/vendedor corrigir o email de um cliente em todos os lugares necessários.

---

## Arquivos a Criar/Modificar

### 1. Nova Edge Function: `supabase/functions/update-customer-email/index.ts`

```text
Fluxo:
┌─────────────────────────────┐
│      Admin/Vendedor         │
│ (via ClientDetailDialog ou  │
│  endpoint direto)           │
└──────────────┬──────────────┘
               │ POST /update-customer-email
               │ { userId, newEmail }
               ▼
┌─────────────────────────────┐
│    Edge Function            │
│  update-customer-email      │
├─────────────────────────────┤
│ 1. Validar JWT (admin)      │
│ 2. Validar formato email    │
│ 3. Verificar se novo email  │
│    já existe                │
│ 4. Atualizar auth.users     │
│ 5. Atualizar profiles       │
│ 6. Atualizar pix_charges    │
└─────────────────────────────┘
```

**Funcionalidades:**
- Recebe `userId` (UUID do usuário) e `newEmail`
- Valida se o usuário autenticado é admin ou super_admin
- Verifica se o novo email já está em uso por outro usuário
- Atualiza o email em `auth.users` usando `admin.updateUserById()`
- Atualiza o email em `profiles`
- Atualiza todas as ocorrências em `pix_charges.buyer_email`
- Retorna sucesso ou erro detalhado

### 2. Atualizar `supabase/config.toml`

Adicionar configuração:
```toml
[functions.update-customer-email]
verify_jwt = false
```

---

## Implementação da Edge Function

```typescript
// Principais operações:

// 1. Validar JWT e verificar se é admin
const { data: roleData } = await supabaseClient
  .from('user_roles')
  .select('role')
  .eq('user_id', callingUser.id)
  .in('role', ['admin', 'super_admin']);

// 2. Verificar se novo email já existe
const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
const emailExists = existingUsers?.users?.find(u => 
  u.email === newEmail && u.id !== userId
);

// 3. Atualizar auth.users
await supabaseAdmin.auth.admin.updateUserById(userId, { 
  email: newEmail 
});

// 4. Atualizar profiles
await supabaseAdmin
  .from('profiles')
  .update({ email: newEmail })
  .eq('user_id', userId);

// 5. Buscar email antigo e atualizar pix_charges
const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
const oldEmail = userData.user.email;

await supabaseAdmin
  .from('pix_charges')
  .update({ buyer_email: newEmail })
  .eq('buyer_email', oldEmail);
```

---

## Uso Imediato

Após criar a função, ela poderá ser chamada diretamente para corrigir o email do Jonas:

```bash
# Via curl ou interface
POST /functions/v1/update-customer-email
{
  "userId": "1fce67e9-d546-4ec1-8d50-9c4800f22e2e",
  "newEmail": "jonasoliveirax@yahoo.com.br"
}
```

---

## Resultado Esperado

1. **Edge Function criada** com validação de segurança (apenas admins)
2. **Email corrigido** em `auth.users`, `profiles` e `pix_charges`
3. **Cliente poderá fazer login** com `jonasoliveirax@yahoo.com.br`
4. **Função reutilizável** para futuros casos semelhantes

---

## Arquivos a Serem Criados/Modificados

| Arquivo | Ação |
|---------|------|
| `supabase/functions/update-customer-email/index.ts` | **Criar** |
| `supabase/config.toml` | **Modificar** - Adicionar configuração da função |
