

# Plano: Corrigir erro ao criar Admin (case-sensitivity do email)

## Diagnóstico

O erro ocorre porque o formulário envia o email com letras maiusculas (ex: `Pauloriko@bol.com.br`), mas o banco armazena em minusculas (`pauloriko@bol.com.br`). As comparacoes no codigo sao case-sensitive, causando falha na localizacao do usuario.

Adicionalmente, o fallback `listUsers()` retorna apenas 50 dos 207 usuarios, tornando-o pouco confiavel.

## Solucao

### Arquivo: `supabase/functions/create-tenant-admin/index.ts`

**Alteracao 1: Normalizar email para minusculas no inicio da funcao**

Apos o parsing do body, converter o email para lowercase:

```typescript
const emailNormalized = email.trim().toLowerCase();
```

E usar `emailNormalized` em todas as operacoes subsequentes (busca de perfil, criacao de usuario, etc).

**Alteracao 2: Usar `.ilike()` na busca por perfil como seguranca extra**

Trocar:
```typescript
.eq("email", email)
```
Por:
```typescript
.eq("email", emailNormalized)
```

**Alteracao 3: Melhorar fallback de busca de usuario existente**

Substituir `listUsers()` sem filtro (que so traz 50 usuarios) por busca paginada ou comparacao case-insensitive:

```typescript
// Ao inves de listar todos, normalizar o email na comparacao
const { data: { users } } = await supabase.auth.admin.listUsers({ 
  page: 1, 
  perPage: 1000 
});
const existingAuthUser = users?.find(
  u => u.email?.toLowerCase() === emailNormalized
);
```

**Alteracao 4: Adicionar roles "seller" e "member" alem de "admin"**

Aproveitar para incluir as roles que foram adicionadas no `process-gateflow-sale`, garantindo que admins criados manualmente tambem recebam todas as roles necessarias:

```typescript
// Adicionar role admin
await supabase.from("user_roles")
  .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

// Adicionar role seller
await supabase.from("user_roles")
  .upsert({ user_id: userId, role: "seller" }, { onConflict: "user_id,role" });

// Adicionar role member
await supabase.from("user_roles")
  .upsert({ user_id: userId, role: "member" }, { onConflict: "user_id,role" });
```

Usar `upsert` em vez de `insert` para evitar erro de duplicidade se a role ja existir (como no caso do usuario `Pauloriko@bol.com.br` que ja tem role "member").

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/create-tenant-admin/index.ts` | Normalizar email para lowercase, aumentar limite do listUsers, usar upsert para roles, adicionar roles seller e member |

## Resultado Esperado

- Criar admin funciona independente de maiusculas/minusculas no email
- Usuarios existentes sao encontrados corretamente
- Novos admins recebem todas as 3 roles: admin, seller, member
- Sem erro de duplicidade ao adicionar roles que ja existem

