

# Plano: Tornar get-gateway-credentials compativel com ambos ambientes

## Diagnostico

O problema ocorre porque:

1. **Lovable Cloud**: A Edge Function `get-gateway-credentials` funciona corretamente (testado e confirmado)
2. **Instancia Docker auto-hospedada**: A Edge Function pode nao estar disponivel ou ter configuracao diferente no Supabase Docker local

O frontend depende 100% da Edge Function para carregar credenciais, sem nenhum fallback. Quando a funcao falha (por qualquer motivo), o dialog mostra "Erro ao carregar credenciais".

## Solucao: Fallback direto no frontend

A abordagem e adicionar um fallback no `GatewayCredentialsDialog` que busca as credenciais diretamente do banco de dados quando a Edge Function falha. Isso funciona porque:

- **Admin (tenant)**: As politicas RLS ja permitem `auth.uid() = user_id` na tabela `seller_gateway_credentials`, entao o admin pode consultar suas proprias credenciais diretamente
- **Super Admin**: Se a Edge Function falhar, exibir mensagem informando que as credenciais globais sao gerenciadas no nivel do servidor (nao e possivel acessar env vars sem Edge Function)

### Arquivo: `src/components/admin/GatewayCredentialsDialog.tsx`

**Alteracao na funcao `fetchCredentials`:**

```text
Fluxo atual:
  1. Chamar Edge Function get-gateway-credentials
  2. Se falhar -> mostrar erro

Novo fluxo:
  1. Chamar Edge Function get-gateway-credentials
  2. Se funcionar -> usar resultado normalmente
  3. Se falhar -> executar fallback:
     a. Buscar gateway_id na tabela payment_gateways (por slug)
     b. Buscar credenciais na tabela seller_gateway_credentials (por user_id + gateway_id)
     c. Se for super_admin -> mostrar aviso que credenciais globais sao gerenciadas no servidor
     d. Se for admin -> mostrar credenciais encontradas no banco
```

**Detalhes tecnicos do fallback:**

```typescript
// Fallback: buscar diretamente do banco
const { data: gatewayData } = await supabase
  .from('payment_gateways')
  .select('id')
  .eq('slug', gateway)
  .maybeSingle();

if (gatewayData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: sellerCreds } = await supabase
      .from('seller_gateway_credentials')
      .select('credentials')
      .eq('user_id', user.id)
      .eq('gateway_id', gatewayData.id)
      .eq('is_active', true)
      .maybeSingle();

    // Usar credenciais encontradas ou null
    setCredentials(sellerCreds?.credentials || { client_id: null, client_secret: null });
    setSource('admin');
  }
}
```

Para super_admin sem Edge Function, o componente exibira:
- "Credenciais globais sao configuradas diretamente no servidor (variaveis de ambiente). Use o painel do servidor para gerencia-las."
- Isso substitui a mensagem de erro por algo informativo e util

**Alteracao adicional - Melhorar mensagem de erro:**

Em vez de mostrar "Erro ao carregar credenciais" generico, incluir log detalhado do erro no console para facilitar debug futuro.

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/admin/GatewayCredentialsDialog.tsx` | Adicionar fallback com busca direta no banco quando Edge Function falhar; mensagem especial para super_admin sem Edge Function |

## Resultado Esperado

- **Lovable Cloud**: Continua funcionando via Edge Function (sem mudanca)
- **Instancia Docker**: Admin carrega credenciais diretamente do banco; Super Admin ve mensagem informativa sobre configuracao no servidor
- **Zero quebras**: O fallback so e ativado se a Edge Function falhar

