
Objetivo: eliminar o erro de geração PIX no Sigilo Pay sem exigir CPF no checkout.

1) Diagnóstico final (confirmado)
- Do I know what the issue is? **Sim**.
- O erro atual não é mais UI: está no backend `supabase/functions/pix-api/index.ts`.
- A função quebra no fallback com `ReferenceError: adminClient is not defined`.
- Mesmo corrigindo isso, ainda haveria falha de leitura: o banco salva Sigilo Pay como `client_id/client_secret`, mas o `pix-api` tenta ler `x_public_key/x_secret_key`.

2) Correções de implementação
- **Arquivo:** `supabase/functions/pix-api/index.ts`
  - Corrigir fallback de credenciais da plataforma para usar cliente válido (`supabase` já existente no handler, ou criar `adminClient` corretamente).
  - Unificar leitura de credenciais Sigilo Pay com compatibilidade dupla:
    - aceitar `client_id/client_secret` (formato atual salvo pela UI)
    - aceitar `x_public_key/x_secret_key` (compatibilidade retroativa)
  - Ajustar payload Sigilo Pay para nunca quebrar por falta de CPF no checkout:
    - manter `client.phone` obrigatório com fallback seguro
    - enviar `client.document` com fallback válido quando não houver CPF informado (sem exigir campo no front).

- **Arquivo:** `supabase/functions/external-payment-api/index.ts`
  - Aplicar a mesma regra de normalização de credenciais e payload do Sigilo Pay (consistência entre checkout e API externa).

- **Arquivo:** `supabase/functions/get-gateway-credentials/index.ts`
  - Melhorar fallback para Sigilo Pay lendo ambos formatos (`client_*` e `x_*`) para evitar inconsistência ao abrir/editar credenciais.

- **Arquivo:** `supabase/functions/set-gateway-credentials/index.ts`
  - Garantir persistência robusta (preferencialmente `upsert` por `gateway_slug`) para evitar falso “salvo” se linha não existir.

3) Verificação completa (fim a fim)
- Teste 1: `GET /payment-methods/:sellerId` com `platform_gateway + sigilopay` deve retornar PIX disponível.
- Teste 2: Checkout real sem CPF preenchido deve gerar PIX com sucesso (sem 500).
- Teste 3: Confirmar em logs que:
  - não aparece mais `adminClient is not defined`
  - credencial é carregada do banco quando env vars não existem
  - request ao Sigilo Pay contém `client.phone` e `client.document`.
- Teste 4: Repetir fluxo via `external-payment-api` para garantir comportamento idêntico.

Seção técnica (resumo)
- Não precisa nova migração de banco.
- O problema é de **resolução de credenciais + referência inválida de variável + normalização de payload**.
- A correção principal é centralizar o resolvedor de credenciais da plataforma e reutilizá-lo em ambos os endpoints de cobrança.
