

# Plano: Corrigir erro na funcao get-gateway-credentials

## Diagnostico

A funcao `get-gateway-credentials` falha com "Failed to send a request to the Edge Function" por dois motivos:

1. **`verify_jwt = true` no config.toml**: O sistema de signing-keys do Supabase nao e compativel com `verify_jwt = true`. A funcao ja valida autenticacao no codigo via `supabase.auth.getUser()`, entao o JWT no config deve ser desabilitado.

2. **Headers CORS incompletos**: Faltam headers que o cliente Supabase envia automaticamente (`x-supabase-client-platform`, etc.), o que pode causar falha no preflight.

## Alteracoes

### Arquivo 1: `supabase/config.toml`

Alterar `verify_jwt` de `true` para `false`:

```toml
[functions.get-gateway-credentials]
verify_jwt = false
```

### Arquivo 2: `supabase/functions/get-gateway-credentials/index.ts`

Atualizar os headers CORS para incluir todos os headers necessarios:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
```

## Resumo

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/config.toml` | Mudar `verify_jwt` para `false` |
| `supabase/functions/get-gateway-credentials/index.ts` | Atualizar CORS headers |

## Resultado Esperado

- Dialog de credenciais do GHOSTPAY (e BSPAY/PIXUP) carrega corretamente
- Super Admin ve as credenciais globais da plataforma
- Admin ve/edita suas proprias credenciais

