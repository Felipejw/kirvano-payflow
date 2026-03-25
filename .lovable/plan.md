

# Adicionar Sigilo Pay na página de Configurações da Plataforma

O Sigilo Pay foi integrado no backend mas não aparece como opção selecionável na UI de admin. Preciso atualizar 3 locais:

## Alterações

### 1. `src/pages/admin/AdminSettings.tsx`
- Expandir o tipo `platform_gateway_type` de `'bspay' | 'pixup' | 'ghostpay'` para incluir `'sigilopay'`
- Mudar o grid de `md:grid-cols-3` para `md:grid-cols-4`
- Adicionar um card clicável para SIGILOPAY (cor laranja, sigla "SP", subtítulo "Sigilo Pay")
- Atualizar todos os trechos de texto condicional (nome do gateway selecionado, label de credenciais, título de taxas) para incluir o caso `sigilopay` → "SIGILOPAY"

### 2. `src/components/admin/GatewayCredentialsDialog.tsx`
- Expandir o tipo do prop `gateway` para incluir `'sigilopay'`
- Adicionar mapeamento de nome: `sigilopay` → "SIGILOPAY"
- Mapear os campos de credenciais para `x_public_key` e `x_secret_key` (em vez de `client_id`/`client_secret`)

### 3. `supabase/functions/get-gateway-credentials/index.ts`
- Já suporta `sigilopay` (confirmado no código anterior) — nenhuma alteração necessária

