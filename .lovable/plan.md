

# Correções do Sigilo Pay - Credenciais e UI

## Problemas Identificados

1. **Labels incorretos** nos campos de credenciais — devem ser "Chave Pública (Client ID)" e "Chave Privada (Client Secret)" conforme o painel do SigiloPay
2. **Sem opção de salvar** — super_admin não consegue editar porque `canEdit` exclui super_admin
3. **Nomes inconsistentes** — o GatewayConfigDialog (para sellers) também usa labels errados "x-public-key" / "x-secret-key"

## Alterações

### 1. `src/components/admin/GatewayCredentialsDialog.tsx`
- Corrigir labels do sigilopay: `"Chave Pública (Client ID)"` e `"Chave Privada (Client Secret)"`
- Permitir super_admin editar quando `source === 'platform'` e credenciais não configuradas: ajustar `canEdit` para incluir super_admin nesse caso (ou sempre permitir edição para super_admin)

### 2. `src/components/finance/GatewayConfigDialog.tsx`
- Corrigir labels no `fieldLabels`: `x_public_key` → `"Chave Pública (Client ID)"` e `x_secret_key` → `"Chave Privada (Client Secret)"`

### 3. Secrets pendentes
- Após as correções de UI, solicitar os secrets `SIGILOPAY_PUBLIC_KEY` e `SIGILOPAY_SECRET_KEY` para que o gateway funcione como gateway da plataforma

