
Objetivo: corrigir os 2 problemas que você mostrou no print — erro ao salvar gateway SIGILOPAY e credenciais que “somem” após salvar.

1) Diagnóstico confirmado
- O erro `platform_settings_platform_gateway_type_check` ocorre porque a constraint atual aceita apenas `bspay | pixup | ghostpay` (não inclui `sigilopay`).
- No modal de credenciais, o super admin salva em `seller_gateway_credentials`, mas a leitura do super admin vem de credenciais globais (env). Resultado: parece que salvou, mas ao reabrir volta “Não configurado”.

2) Plano de implementação

- Criar migração de banco para:
  - Atualizar a constraint `platform_settings_platform_gateway_type_check` para incluir `sigilopay`.
  - Criar tabela global de credenciais da plataforma (ex.: `platform_gateway_credentials`) para armazenar credenciais por gateway.
  - Habilitar RLS nessa tabela com acesso apenas para `super_admin`.
  - Seed inicial dos gateways (`bspay`, `pixup`, `ghostpay`, `sigilopay`) com valores vazios para evitar inconsistência.

- Ajustar backend functions:
  - `get-gateway-credentials`:
    - Para super admin, buscar credenciais globais com estratégia: **env primeiro**, fallback para `platform_gateway_credentials`.
  - Criar função de escrita (ex.: `set-gateway-credentials`) para super admin salvar credenciais globais nessa tabela com validação de role.
  - Atualizar `pix-api` e `external-payment-api` para usar o mesmo resolvedor global (env -> fallback banco), garantindo que checkout e cobrança usem as credenciais salvas pela UI.

- Ajustar frontend:
  - `GatewayCredentialsDialog.tsx`:
    - Se for super admin, salvar via função global (não em `seller_gateway_credentials`).
    - Manter sellers/admin comuns usando `seller_gateway_credentials`.
    - Atualizar feedback visual para mostrar claramente quando a origem é “Credencial global da plataforma”.
  - `AdminSettings.tsx`:
    - Manter seleção/salvamento do gateway como está, agora sem erro de constraint após migração.
    - Melhorar mensagem de erro para caso de valor inválido (fallback amigável).

3) Validação (fim a fim)
- Em `/admin/settings`, selecionar SIGILOPAY e clicar “Salvar Gateway” sem erro de constraint.
- Abrir “Ver Credenciais do SIGILOPAY”, editar, salvar, fechar e reabrir: os valores devem permanecer.
- Com vendedor em modo `platform_gateway`, validar `GET /payment-methods/:sellerId` retornando PIX quando credencial global estiver configurada.
- Gerar cobrança PIX real de teste no fluxo da plataforma e confirmar uso do gateway SIGILOPAY.

Detalhes técnicos (arquivos previstos)
- Banco (migração nova): `supabase/migrations/<nova>.sql`
- Edge functions:
  - `supabase/functions/get-gateway-credentials/index.ts`
  - `supabase/functions/pix-api/index.ts`
  - `supabase/functions/external-payment-api/index.ts`
  - `supabase/functions/set-gateway-credentials/index.ts` (novo)
- Frontend:
  - `src/components/admin/GatewayCredentialsDialog.tsx`
  - `src/pages/admin/AdminSettings.tsx`
